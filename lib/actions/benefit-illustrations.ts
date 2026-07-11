"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { BUCKETS, uploadToBucket } from "@/lib/supabase/storage";
import { extractPdfText } from "@/lib/pdf/extract-text";
import { extractBenefitIllustrationFigures } from "@/lib/ai/tools";
import { writeAuditLog } from "@/lib/ai/audit";
import type { BenefitIllustration, ExtractionStatus } from "@/lib/supabase/types";

export async function getBenefitIllustration(
  clientId: string,
): Promise<BenefitIllustration | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("benefit_illustrations")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export interface SaveIllustrationResult {
  ok: boolean;
  error?: string;
}

export async function saveBenefitIllustration(
  _prev: SaveIllustrationResult,
  formData: FormData,
): Promise<SaveIllustrationResult> {
  const clientId = String(formData.get("client_id") ?? "");
  const productName = String(formData.get("product_name") ?? "").trim();
  const file = formData.get("file") as File | null;

  if (!clientId) return { ok: false, error: "Missing client." };
  if (!file || file.size === 0) {
    return { ok: false, error: "Please choose a benefit illustration file to upload." };
  }

  const supabase = await createClient();

  let path: string;
  try {
    path = await uploadToBucket(supabase, BUCKETS.benefitIllustration, file, `bi/${clientId}`);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Upload failed." };
  }

  const extraction = await extractFigures(file);

  const { data: inserted, error } = await supabase
    .from("benefit_illustrations")
    .insert({
      client_id: clientId,
      file_url: path,
      product_name: productName || null,
      extracted_data: extraction.data,
      extraction_status: extraction.status,
      extraction_notes: extraction.notes,
      extraction_source: extraction.source,
      extraction_confidence: extraction.confidence,
      extraction_review_status: "unreviewed",
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  await writeAuditLog(supabase, {
    tool_name: "extract_benefit_illustration",
    input_ref_id: clientId,
    output_ref_id: inserted?.id ?? null,
    status: extraction.status === "failed" ? "error" : "ok",
    latency_ms: extraction.latencyMs,
  });

  revalidatePath(`/clients/${clientId}`);
  return { ok: true };
}

interface ExtractOutcome {
  data: BenefitIllustration["extracted_data"];
  status: ExtractionStatus;
  notes: string | null;
  source: string;
  confidence: number;
  latencyMs: number;
}

async function extractFigures(file: File): Promise<ExtractOutcome> {
  const start = Date.now();
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  if (!isPdf) {
    return {
      data: null,
      status: "unsupported_format",
      notes: "Automatic figure extraction currently only supports PDF uploads.",
      source: "unsupported",
      confidence: 0,
      latencyMs: Date.now() - start,
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { text, noTextLayer, failed } = await extractPdfText(buffer);

  if (failed) {
    return {
      data: null,
      status: "failed",
      notes: "Could not parse this PDF.",
      source: "pdf_parser",
      confidence: 0,
      latencyMs: Date.now() - start,
    };
  }

  if (noTextLayer || !text) {
    // No real text layer (e.g. scanned/image-only PDF) — never invoke the LLM here,
    // since without real source text it would have nothing to extract from but guesses.
    return {
      data: null,
      status: "no_text_layer",
      notes: "This PDF has no extractable text (likely a scanned image). Please review it manually.",
      source: "pdf_parser",
      confidence: 0,
      latencyMs: Date.now() - start,
    };
  }

  const result = await extractBenefitIllustrationFigures(text);
  return { ...result, latencyMs: Date.now() - start };
}
