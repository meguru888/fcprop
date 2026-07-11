"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { BUCKETS, uploadToBucket } from "@/lib/supabase/storage";
import { embedKbDoc } from "@/lib/ai/tools";
import type { ProductKbDoc } from "@/lib/supabase/types";

export async function listKbDocs(): Promise<ProductKbDoc[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_kb_docs")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export interface UploadKbResult {
  ok: boolean;
  error?: string;
}

export async function uploadKbDoc(
  _prev: UploadKbResult,
  formData: FormData,
): Promise<UploadKbResult> {
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { ok: false, error: "Please choose a product document to upload." };
  }

  const supabase = await createClient();

  let path: string;
  try {
    path = await uploadToBucket(supabase, BUCKETS.productKb, file, "kb");
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Upload failed." };
  }

  const { data: inserted, error } = await supabase
    .from("product_kb_docs")
    .insert({ file_url: path, original_filename: file.name })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  try {
    await embedKbDoc(supabase, inserted.id);
  } catch {
    // Embedding/digestion is best-effort; the doc itself is already saved.
  }

  revalidatePath("/");
  return { ok: true };
}

export async function deleteKbDoc(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("product_kb_docs").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
}
