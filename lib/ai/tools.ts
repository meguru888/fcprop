import type { SupabaseClient } from "@supabase/supabase-js";
import { getOpenAI, CHAT_MODEL, EMBEDDING_MODEL } from "@/lib/openai/client";
import { cosineSimilarity } from "@/lib/ai/similarity";
import { writeAuditLog } from "@/lib/ai/audit";
import { BUCKETS } from "@/lib/supabase/storage";
import { getUserId } from "@/lib/supabase/user";
import type {
  BenefitIllustrationExtractedData,
  ExtractionStatus,
  KbDocType,
  ProductKbDoc,
  ProposalContent,
} from "@/lib/supabase/types";

export const KB_MATCH_THRESHOLD = 0.78;

async function embedText(text: string): Promise<number[] | null> {
  const openai = getOpenAI();
  if (!openai) return null;
  const res = await openai.embeddings.create({ model: EMBEDDING_MODEL, input: text });
  return res.data[0].embedding;
}

export interface FigureExtractionResult {
  data: BenefitIllustrationExtractedData | null;
  status: ExtractionStatus;
  notes: string | null;
  source: string;
  confidence: number;
}

/**
 * Extracts real financial figures from a benefit illustration's raw PDF text.
 * Hard rule: never call this with empty/near-empty text, and the prompt itself
 * forbids the model from estimating or inferring any number it can't literally
 * find in the source — missing fields must come back as null, not a guess.
 */
export async function extractBenefitIllustrationFigures(
  rawText: string,
): Promise<FigureExtractionResult> {
  const openai = getOpenAI();
  if (!openai) {
    return { data: null, status: "failed", notes: "AI unavailable", source: "fallback", confidence: 0 };
  }

  const completion = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You extract ONLY figures that are literally printed in this benefit illustration document. " +
          "This is a real financial document for a real client — accuracy is critical, and a fabricated " +
          "number could mislead someone about their own money.\n\n" +
          "Hard rules:\n" +
          "1. Never calculate, estimate, infer, round, or guess any figure. Only report a number if it " +
          "appears explicitly in the text.\n" +
          "2. If a field is not explicitly present in the text, set it to null. Do not leave it out — " +
          "include the key with a null value.\n" +
          "3. Extract EVERY distinct projection/scenario row you find (e.g. guaranteed vs non-guaranteed, " +
          "or different illustrated rates of return), using the scenario label exactly as printed in the " +
          "document (e.g. 'Guaranteed', 'Non-Guaranteed at 4.25% p.a.'). Do not invent a scenario that " +
          "isn't named in the text.\n" +
          "4. For each scenario, extract the year-by-year values exactly as tabulated (e.g. surrender " +
          "value, cash value, or death benefit at each policy year) — whatever the document's own table " +
          "columns show.\n" +
          "5. currency should be exactly as printed (e.g. 'SGD', 'S$', 'USD').\n" +
          "6. If you are not fully confident a number belongs in the field you're about to place it in, " +
          "leave that field null instead of guessing.\n\n" +
          "Respond with ONLY valid JSON matching this shape: " +
          '{"currency": string|null, "premium": number|null, "premium_term_years": number|null, ' +
          '"sum_assured": number|null, "scenarios": [{"label": string, "rows": [{"year": number, "value": number}]}]}.',
      },
      { role: "user", content: rawText.slice(0, 24000) },
    ],
    temperature: 0,
    response_format: { type: "json_object" },
  });

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
  } catch {
    return {
      data: null,
      status: "failed",
      notes: "Model returned unparseable output",
      source: CHAT_MODEL,
      confidence: 0,
    };
  }

  const scenariosRaw = Array.isArray(parsed.scenarios) ? parsed.scenarios : [];
  const scenarios = scenariosRaw
    .filter((s): s is { label: unknown; rows: unknown } => !!s && typeof s === "object")
    .map((s) => ({
      label: typeof s.label === "string" ? s.label : "Scenario",
      rows: (Array.isArray(s.rows) ? s.rows : [])
        .filter((r): r is { year: unknown; value: unknown } => !!r && typeof r === "object")
        .map((r) => ({
          year: typeof r.year === "number" ? r.year : Number(r.year),
          value: typeof r.value === "number" ? r.value : Number(r.value),
        }))
        .filter((r) => Number.isFinite(r.year) && Number.isFinite(r.value)),
    }))
    .filter((s) => s.rows.length > 0);

  const data: BenefitIllustrationExtractedData = {
    currency: typeof parsed.currency === "string" ? parsed.currency : null,
    premium: typeof parsed.premium === "number" ? parsed.premium : null,
    premium_term_years: typeof parsed.premium_term_years === "number" ? parsed.premium_term_years : null,
    sum_assured: typeof parsed.sum_assured === "number" ? parsed.sum_assured : null,
    scenarios,
  };

  const foundAnything = data.premium !== null || data.sum_assured !== null || scenarios.length > 0;
  const foundEverythingCore = data.premium !== null && data.sum_assured !== null && scenarios.length > 0;

  if (!foundAnything) {
    return {
      data,
      status: "failed",
      notes: "No recognizable benefit-illustration figures found in the document text.",
      source: CHAT_MODEL,
      confidence: 0.2,
    };
  }

  return {
    data,
    status: foundEverythingCore ? "ok" : "partial",
    notes: foundEverythingCore ? null : "Some figures weren't found in the document and were left blank.",
    source: CHAT_MODEL,
    confidence: foundEverythingCore ? 0.85 : 0.6,
  };
}

export async function summarizeIcp(supabase: SupabaseClient, icpId: string) {
  const start = Date.now();
  const { data: icp, error: fetchError } = await supabase
    .from("icps")
    .select("*")
    .eq("id", icpId)
    .single();
  if (fetchError || !icp) throw new Error(fetchError?.message ?? "ICP not found");

  const openai = getOpenAI();
  let summary: string;
  let source: string;
  let confidence: number;

  if (openai && icp.chat_text) {
    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You summarize a financial consultant's Ideal Client Profile into one concise, plain-English sentence capturing demographics, life stage, and top financial concerns.",
        },
        { role: "user", content: icp.chat_text },
      ],
      temperature: 0.3,
    });
    summary = completion.choices[0]?.message?.content?.trim() ?? icp.chat_text.slice(0, 200);
    source = CHAT_MODEL;
    confidence = 0.9;
  } else {
    summary = (icp.chat_text ?? "").slice(0, 200);
    source = "fallback";
    confidence = 0.3;
  }

  const { error } = await supabase
    .from("icps")
    .update({
      summary,
      summary_source: source,
      summary_confidence: confidence,
      summary_review_status: "unreviewed",
    })
    .eq("id", icpId);

  await writeAuditLog(supabase, {
    tool_name: "summarize_icp",
    input_ref_id: icpId,
    output_ref_id: icpId,
    status: error ? "error" : "ok",
    latency_ms: Date.now() - start,
  });
  if (error) throw new Error(error.message);

  return { summary, source, confidence };
}

export async function extractPainPoints(supabase: SupabaseClient, clientProfileId: string) {
  const start = Date.now();
  const { data: profile, error: fetchError } = await supabase
    .from("client_profiles")
    .select("*")
    .eq("id", clientProfileId)
    .single();
  if (fetchError || !profile) throw new Error(fetchError?.message ?? "Client profile not found");

  const openai = getOpenAI();
  let painPoints: string;
  let source: string;
  let confidence: number;

  if (openai && profile.notes_text) {
    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        {
          role: "system",
          content:
            "Extract the client's key financial pain points and gaps from these fact-find notes. Return a short semicolon-separated list, no preamble.",
        },
        { role: "user", content: profile.notes_text },
      ],
      temperature: 0.3,
    });
    painPoints = completion.choices[0]?.message?.content?.trim() ?? "";
    source = CHAT_MODEL;
    confidence = 0.85;
  } else {
    painPoints = (profile.notes_text ?? "").slice(0, 200);
    source = "fallback";
    confidence = 0.3;
  }

  const { error } = await supabase
    .from("client_profiles")
    .update({
      pain_points: painPoints,
      pain_points_source: source,
      pain_points_confidence: confidence,
      pain_points_review_status: "unreviewed",
    })
    .eq("id", clientProfileId);

  await writeAuditLog(supabase, {
    tool_name: "extract_pain_points",
    input_ref_id: clientProfileId,
    output_ref_id: clientProfileId,
    status: error ? "error" : "ok",
    latency_ms: Date.now() - start,
  });
  if (error) throw new Error(error.message);

  return { pain_points: painPoints, source, confidence };
}

export async function embedKbDoc(supabase: SupabaseClient, kbDocId: string) {
  const start = Date.now();
  const { data: doc, error: fetchError } = await supabase
    .from("product_kb_docs")
    .select("*")
    .eq("id", kbDocId)
    .single();
  if (fetchError || !doc) throw new Error(fetchError?.message ?? "KB doc not found");

  const openai = getOpenAI();
  let conceptSummary = doc.concept_summary as string | null;
  let source = doc.concept_summary_source as string | null;
  let confidence = doc.concept_summary_confidence as number | null;
  let docType = (doc.doc_type as KbDocType | null) ?? null;

  const isPdf = (doc.original_filename ?? "").toLowerCase().endsWith(".pdf");
  const DOC_TYPES: KbDocType[] = ["benefit_illustration", "product_brochure", "product_related_document", "other"];
  const asDocType = (value: unknown): KbDocType =>
    DOC_TYPES.includes(value as KbDocType) ? (value as KbDocType) : "other";

  if (!conceptSummary && openai && isPdf) {
    const { data: fileBlob } = await supabase.storage.from(BUCKETS.productKb).download(doc.file_url);
    if (fileBlob) {
      const buffer = Buffer.from(await fileBlob.arrayBuffer());
      const completion = await openai.chat.completions.create({
        model: CHAT_MODEL,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are digesting a financial product document for a knowledge base used to match products to " +
              "client needs. Read the entire document — all text, tables, and illustrated figures/charts. " +
              'Respond with a JSON object: {"concept_summary": string, "doc_type": string}. ' +
              "concept_summary: a concise 2-4 sentence summary covering product type and coverage, key terms " +
              "(payment period, sum assured, etc.), typical use case, and any notable illustrated values or " +
              "charts shown. Base this only on what is actually in the document, never invent details. " +
              'doc_type: classify the document as exactly one of "benefit_illustration", "product_brochure", ' +
              '"product_related_document", or "other".',
          },
          {
            role: "user",
            content: [
              {
                type: "file",
                file: {
                  filename: doc.original_filename ?? "product.pdf",
                  file_data: `data:application/pdf;base64,${buffer.toString("base64")}`,
                },
              },
              { type: "text", text: "Summarize and classify this product document." },
            ],
          },
        ],
        temperature: 0.4,
      });
      const raw = completion.choices[0]?.message?.content?.trim();
      try {
        const parsed = raw ? JSON.parse(raw) : null;
        conceptSummary = typeof parsed?.concept_summary === "string" ? parsed.concept_summary : raw;
        docType = asDocType(parsed?.doc_type);
      } catch {
        conceptSummary = raw ?? null;
        docType = "other";
      }
      source = `${CHAT_MODEL}_pdf_content`;
      confidence = 0.9;
    }
  }

  if (!conceptSummary && openai) {
    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are digesting a financial product document for a knowledge base used to match products to " +
            'client needs. Given only the filename, respond with a JSON object: {"concept_summary": string, ' +
            '"doc_type": string}. concept_summary: a plausible one-sentence summary of what this product likely ' +
            'offers (coverage type, term, typical use case). doc_type: classify as exactly one of ' +
            '"benefit_illustration", "product_brochure", "product_related_document", or "other", based on the ' +
            "filename. Be concise.",
        },
        { role: "user", content: doc.original_filename ?? "product.pdf" },
      ],
      temperature: 0.4,
    });
    const raw = completion.choices[0]?.message?.content?.trim();
    try {
      const parsed = raw ? JSON.parse(raw) : null;
      conceptSummary = typeof parsed?.concept_summary === "string" ? parsed.concept_summary : raw;
      docType = asDocType(parsed?.doc_type);
    } catch {
      conceptSummary = raw ?? null;
      docType = "other";
    }
    source = CHAT_MODEL;
    confidence = 0.5;
  }

  if (!conceptSummary) {
    conceptSummary = doc.original_filename ?? "Uploaded product document";
    source = "fallback";
    confidence = 0.2;
    docType = docType ?? "other";
  }

  const embedding = await embedText(conceptSummary ?? doc.original_filename ?? "product document");

  const { error } = await supabase
    .from("product_kb_docs")
    .update({
      concept_summary: conceptSummary,
      concept_summary_source: source,
      concept_summary_confidence: confidence,
      concept_summary_review_status: "unreviewed",
      doc_type: docType,
      embedding,
    })
    .eq("id", kbDocId);

  await writeAuditLog(supabase, {
    tool_name: "embed_kb_doc",
    input_ref_id: kbDocId,
    output_ref_id: kbDocId,
    status: error ? "error" : "ok",
    latency_ms: Date.now() - start,
  });
  if (error) throw new Error(error.message);

  return { concept_summary: conceptSummary, doc_type: docType, embedding };
}

export interface KbMatch {
  doc: ProductKbDoc;
  confidence: number;
}

export async function matchKbProduct(
  supabase: SupabaseClient,
  clientId: string,
): Promise<KbMatch | null> {
  const start = Date.now();

  const { data: profile } = await supabase
    .from("client_profiles")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const queryText = profile?.pain_points || profile?.notes_text;
  if (!queryText) return null;

  const { data: docs, error } = await supabase.from("product_kb_docs").select("*");
  if (error) throw new Error(error.message);
  if (!docs || docs.length === 0) return null;

  for (const doc of docs as ProductKbDoc[]) {
    if (!doc.embedding) {
      await embedKbDoc(supabase, doc.id);
    }
  }

  const { data: freshDocs, error: refetchError } = await supabase
    .from("product_kb_docs")
    .select("*");
  if (refetchError) throw new Error(refetchError.message);

  const queryEmbedding = await embedText(queryText);
  if (!queryEmbedding) return null;

  let best: KbMatch | null = null;
  for (const doc of (freshDocs ?? []) as ProductKbDoc[]) {
    if (!doc.embedding) continue;
    const score = cosineSimilarity(queryEmbedding, doc.embedding);
    if (!best || score > best.confidence) {
      best = { doc, confidence: score };
    }
  }

  await writeAuditLog(supabase, {
    tool_name: "match_kb_product",
    input_ref_id: clientId,
    output_ref_id: best?.doc.id ?? null,
    status: "ok",
    latency_ms: Date.now() - start,
  });

  return best;
}

export type GenerateProposalResult =
  | { status: "blocked"; reason: string }
  | { status: "needs_illustration"; productName: string; confidence: number; clientName: string }
  | { status: "ok"; proposalId: string; content: ProposalContent };

export async function generateProposal(
  supabase: SupabaseClient,
  clientId: string,
): Promise<GenerateProposalResult> {
  const start = Date.now();

  const userId = await getUserId(supabase);
  if (!userId) throw new Error("Your session has expired. Please log in again.");

  const { data: icp } = await supabase
    .from("icps")
    .select("*")
    .eq("is_default", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!icp) return { status: "blocked", reason: "Please complete your Ideal Client Profile first" };

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();
  if (clientError || !client) throw new Error(clientError?.message ?? "Client not found");

  const { data: profile } = await supabase
    .from("client_profiles")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!profile) {
    return { status: "blocked", reason: "Please add your client's details before generating" };
  }

  if (!icp.summary) await summarizeIcp(supabase, icp.id);
  if (!profile.pain_points) await extractPainPoints(supabase, profile.id);

  const { data: refreshedIcp } = await supabase.from("icps").select("*").eq("id", icp.id).single();
  const { data: refreshedProfile } = await supabase
    .from("client_profiles")
    .select("*")
    .eq("id", profile.id)
    .single();

  const { data: illustration } = await supabase
    .from("benefit_illustrations")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let productUsed: string;
  let productSource: string;

  if (illustration) {
    productUsed = illustration.product_name || "the recommended solution";
    productSource = `benefit_illustration_id:${illustration.id}`;
  } else {
    const match = await matchKbProduct(supabase, clientId);
    if (!match || match.confidence < KB_MATCH_THRESHOLD) {
      return {
        status: "blocked",
        reason:
          "No matching product found in your knowledge base. Please upload a benefit illustration in Section 3 or add product documents to Section 4",
      };
    }
    return {
      status: "needs_illustration",
      productName: match.doc.original_filename ?? "matched product",
      confidence: match.confidence,
      clientName: client.name,
    };
  }

  const openai = getOpenAI();
  const painPoints = (refreshedProfile?.pain_points ?? "")
    .split(";")
    .map((p: string) => p.trim())
    .filter(Boolean);

  const realFigures =
    illustration?.extracted_data &&
    (illustration.extraction_status === "ok" || illustration.extraction_status === "partial")
      ? { ...illustration.extracted_data, extraction_status: illustration.extraction_status }
      : null;

  let content: ProposalContent;
  let contentSource: string;
  let confidence: number;

  if (openai) {
    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a warm, perceptive Singapore financial consultant (FC) writing a proposal to read aloud to your own client. " +
            'Write in direct second person — "you" and "your" — as if speaking straight to them. Never describe them in the third person ' +
            '(not "Sarah faces these risks" but "you\'re facing these risks"). You may use their first name once or twice for warmth, ' +
            "never as a substitute for direct address.\n\n" +
            "This must read like real talk from an FC who actually knows this client's situation from a real fact-find — not a " +
            'storybook narrator. In EVERY section, never use fictional framing devices like "Picture this", "Imagine", "Once", or ' +
            "invented scene details (weather, rooms, moments) that aren't implied by their actual data — this applies to dream_outcome " +
            "just as much as opening_story. State things plainly and specifically, using only what's in their profile, pain points, and " +
            "life stage — grounded fact delivered with warmth, not invented narrative or hypotheticals dressed up as scenes.\n\n" +
            "Structure the six sections as an emotional bridge that carries the client from their life today to the life they want, " +
            "with the product as the vehicle that closes the gap. Throughout, mirror the client's own fears, worries, and concerns " +
            "back to them — reference the specific things named in their fact-find notes and pain points closely enough that they " +
            "recognize their own words and feel truly heard, not given a generic summary:\n" +
            "- opening_story: Ground them in their real, current situation right now — their actual life stage, what they've genuinely " +
            "built so far, and the real concern underneath it, drawn directly from their pain points and profile. This is a plain, " +
            "honest reflection of their actual circumstances, not a scene-setting story.\n" +
            "- problem_bridge (labeled 'The Problems/Obstacles' to the client): Name the specific risks concretely, mapped directly " +
            "onto the fears and worries this client raised in their fact-find — don't generalize, name their actual exposures. Then " +
            "quantify and magnify the cost of doing nothing: wherever the client's data (fact_find_notes, pain_points, or real_figures) " +
            "gives you concrete numbers — income, expenses, existing coverage, a sum-assured or savings gap, premiums, ages, timelines — " +
            "use those exact figures to make the financial exposure real (e.g. months of income lost, the size of a coverage shortfall, " +
            "the dollar cost of an uncovered gap). Always write dollar amounts as $X,XXX with comma separators, never a currency code. " +
            "If no hard number exists for a given worry, describe the real-world stakes concretely (time, disruption, missed " +
            "milestones) without inventing a specific dollar figure. Show how the exposure compounds and widens the longer they wait. " +
            "Create urgency through honest, quantified clarity, not pressure or invented numbers.\n" +
            "- solution_reveal: Introduce the named product as the bridge — the specific vehicle that carries them from where they are " +
            "to where they want to be. A turning point, not a feature list.\n" +
            "- benefit_breakdown: Connect each benefit directly back to a specific pain point named earlier — show concretely how each " +
            "worry gets resolved.\n" +
            "- dream_outcome: Describe the 'after' state concretely and plausibly — the peace of mind, the family protected, the " +
            "milestones secured — in clear contrast to opening_story. Ground it in their real goals, not invented imagery.\n" +
            "- call_to_action: A warm, direct, personal invitation to take the next step together. Never say " +
            "'illustration' or 'benefit illustration' here — refer to it as 'the recommended solution' instead.\n\n" +
            "Each section should be 3-5 sentences, concrete and specific to this client — no filler, no clichés, no boilerplate " +
            "reassurance.\n\n" +
            "Respond with ONLY valid JSON matching this shape: " +
            '{"opening_story": string, "problem_bridge": string, "solution_reveal": string, "benefit_breakdown": string, "dream_outcome": string, "call_to_action": string, ' +
            '"before_after": [{"label": string, "before": number, "after": number}], "benefit_timeline": [{"year": number, "value": number}], ' +
            '"risk_events": [{"age": number, "event": string, "cost": number}]}. ' +
            "before_after should have 2-4 items, each a protection area from the client's pain points, with 'before' = their current " +
            "coverage level and 'after' = their protected level once the plan is in place (both 0-100 scale). " +
            "benefit_timeline should have 3-5 illustrative points (0-100 scale) showing how the plan's protection value builds over the " +
            "years of the premium term. These are directional illustrations for the narrative only, not the client's actual policy figures.\n\n" +
            "risk_events should have 2-4 items for an age-journey timeline: concrete trigger events (e.g. critical illness, disability, " +
            "death, prolonged income loss) drawn from the client's own stated fears, each tagged with 'age' = the age at which this " +
            "exposure is live for them (use client_age unless their notes imply a more specific near-term milestone age) and 'cost' = a " +
            "quantified dollar figure for what that event would cost them, grounded ONLY in real numbers already present in their data " +
            "(income, expenses, existing coverage, savings) using exact figures or simple derived math — never invent a cost with no " +
            "basis. If you cannot ground a plausible event in real numbers, omit it rather than guessing; it is fine to return fewer " +
            "than 2 items or an empty array.\n\n" +
            (realFigures
              ? "The user message includes 'real_figures' — actual numbers extracted from this client's real benefit illustration " +
                "document. You may cite these EXACT figures naturally in benefit_breakdown and/or dream_outcome for credibility " +
                "(e.g. their real premium, sum assured, or a specific projected value at a specific year). Never alter, round, " +
                "recalculate, or invent any number beyond what's given in real_figures — if a figure isn't present there, don't " +
                "state a specific dollar amount as if it were their actual policy figure. Always write cited figures in Singapore " +
                "dollar format with a comma thousands separator, e.g. $50,000 — never a currency code like 'SGD50000'."
              : "No real policy figures were available for this client (no benefit illustration was uploaded, or it couldn't be " +
                "read). Do not state any specific dollar amount as if it were their actual policy figure — speak about benefits " +
                "and outcomes qualitatively instead."),
        },
        {
          role: "user",
          content: JSON.stringify({
            client_name: client.name,
            client_age: client.age,
            icp_context: refreshedIcp?.summary,
            fact_find_notes: refreshedProfile?.notes_text ?? "",
            pain_points: painPoints,
            product_used: productUsed,
            real_figures: realFigures,
          }),
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });
    const parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
    content = {
      client_name: client.name,
      client_age: client.age,
      pain_points: painPoints,
      dreams: [],
      icp_context: refreshedIcp?.summary ?? "",
      product_matched: productUsed,
      product_source: productSource,
      proposal_sections: {
        opening_story: parsed.opening_story ?? "",
        problem_bridge: parsed.problem_bridge ?? "",
        solution_reveal: parsed.solution_reveal ?? "",
        benefit_breakdown: parsed.benefit_breakdown ?? "",
        dream_outcome: parsed.dream_outcome ?? "",
        call_to_action: parsed.call_to_action ?? "",
      },
      charts: {
        before_after: Array.isArray(parsed.before_after) ? parsed.before_after : undefined,
        benefit_timeline: Array.isArray(parsed.benefit_timeline) ? parsed.benefit_timeline : undefined,
      },
      risk_events: Array.isArray(parsed.risk_events) ? parsed.risk_events : undefined,
      real_figures: realFigures,
    };
    contentSource = CHAT_MODEL;
    confidence = 0.85;
  } else {
    content = {
      client_name: client.name,
      client_age: client.age,
      pain_points: painPoints,
      dreams: [],
      icp_context: refreshedIcp?.summary ?? "",
      product_matched: productUsed,
      product_source: productSource,
      proposal_sections: {
        opening_story: `${client.name}, you've worked hard to get to where you are today — but underneath that progress, there's a worry you haven't quite put into words yet.`,
        problem_bridge: painPoints.length
          ? `Right now you're carrying real exposure: ${painPoints.join(", ")}. If nothing changes, that gap doesn't stay still — it widens every year you wait, and it's the people you care about who'd feel it first.`
          : "Right now there are gaps in your financial protection, and they won't close themselves — the longer they sit open, the more exposed you and your family become.",
        solution_reveal: `That's where ${productUsed} comes in — think of it as the bridge from where you are today to the security you actually want.`,
        benefit_breakdown: `${productUsed} is built to answer the exact gaps you're facing, so each worry we named has something concrete standing against it.`,
        dream_outcome: "On the other side of this: the gap closed, your family protected, and one less thing keeping you up at night.",
        call_to_action: "Let's take the next step together and get this in place for you.",
      },
      charts: {
        before_after: painPoints.length
          ? painPoints.map((label: string, i: number) => ({
              label,
              before: Math.max(10, 30 - i * 5),
              after: Math.max(70, 95 - i * 5),
            }))
          : [{ label: "Protection gap", before: 20, after: 90 }],
        benefit_timeline: [
          { year: 1, value: 15 },
          { year: 5, value: 40 },
          { year: 10, value: 65 },
          { year: 20, value: 100 },
        ],
      },
      real_figures: realFigures,
    };
    contentSource = "fallback";
    confidence = 0.3;
  }

  const { data: inserted, error: insertError } = await supabase
    .from("proposals")
    .insert({
      user_id: userId,
      client_id: clientId,
      status: "draft",
      content_json: content,
      product_used: productUsed,
      content_source: contentSource,
      content_confidence: confidence,
      content_review_status: "unreviewed",
    })
    .select("id")
    .single();

  await writeAuditLog(supabase, {
    tool_name: "generate_proposal",
    input_ref_id: clientId,
    output_ref_id: inserted?.id ?? null,
    status: insertError ? "error" : "ok",
    latency_ms: Date.now() - start,
  });
  if (insertError || !inserted) throw new Error(insertError?.message ?? "Failed to save proposal");

  return { status: "ok", proposalId: inserted.id, content };
}
