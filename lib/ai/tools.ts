import type { SupabaseClient } from "@supabase/supabase-js";
import { getOpenAI, CHAT_MODEL, EMBEDDING_MODEL } from "@/lib/openai/client";
import { cosineSimilarity } from "@/lib/ai/similarity";
import { writeAuditLog } from "@/lib/ai/audit";
import type { ProductKbDoc, ProposalContent } from "@/lib/supabase/types";

export const KB_MATCH_THRESHOLD = 0.78;

async function embedText(text: string): Promise<number[] | null> {
  const openai = getOpenAI();
  if (!openai) return null;
  const res = await openai.embeddings.create({ model: EMBEDDING_MODEL, input: text });
  return res.data[0].embedding;
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
    source = "gpt-4o";
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
    source = "gpt-4o";
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

  if (!conceptSummary && openai) {
    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are digesting a financial product document for a knowledge base used to match products to client needs. Given only the filename, write a plausible one-sentence concept summary of what this product likely offers (coverage type, term, typical use case). Be concise.",
        },
        { role: "user", content: doc.original_filename ?? "product.pdf" },
      ],
      temperature: 0.4,
    });
    conceptSummary = completion.choices[0]?.message?.content?.trim() ?? null;
    source = "gpt-4o";
    confidence = 0.5;
  } else if (!conceptSummary) {
    conceptSummary = doc.original_filename ?? "Uploaded product document";
    source = "fallback";
    confidence = 0.2;
  }

  const embedding = await embedText(conceptSummary ?? doc.original_filename ?? "product document");

  const { error } = await supabase
    .from("product_kb_docs")
    .update({
      concept_summary: conceptSummary,
      concept_summary_source: source,
      concept_summary_confidence: confidence,
      concept_summary_review_status: "unreviewed",
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

  return { concept_summary: conceptSummary, embedding };
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
    productUsed = illustration.product_name || "Uploaded benefit illustration";
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
            "You write emotionally resonant, story-driven financial proposals for Singapore financial consultants to present to clients. Respond with ONLY valid JSON matching this shape: " +
            '{"opening_story": string, "problem_bridge": string, "solution_reveal": string, "benefit_breakdown": string, "dream_outcome": string, "call_to_action": string}. ' +
            "Each field is 2-4 sentences. Reference the client by name, their pain points, and the named product naturally.",
        },
        {
          role: "user",
          content: JSON.stringify({
            client_name: client.name,
            client_age: client.age,
            icp_context: refreshedIcp?.summary,
            pain_points: painPoints,
            product_used: productUsed,
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
    };
    contentSource = "gpt-4o";
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
        opening_story: `${client.name}, let's talk about what matters most to you and your family.`,
        problem_bridge: painPoints.length
          ? `Right now you're facing: ${painPoints.join(", ")}.`
          : "Right now there are gaps in your financial protection.",
        solution_reveal: `${productUsed} is designed to close that gap.`,
        benefit_breakdown: `${productUsed} provides coverage tailored to your situation.`,
        dream_outcome: "With this in place, you can focus on what you're working toward.",
        call_to_action: "Let's take the next step together.",
      },
    };
    contentSource = "fallback";
    confidence = 0.3;
  }

  const { data: inserted, error: insertError } = await supabase
    .from("proposals")
    .insert({
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
