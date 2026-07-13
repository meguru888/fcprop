"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, ADMIN_BUCKET } from "@/lib/supabase/admin";
import { BUCKETS, uploadToBucket } from "@/lib/supabase/storage";
import { getUserId } from "@/lib/supabase/user";
import { embedKbDoc } from "@/lib/ai/tools";
import { logEvent } from "@/lib/actions/analytics";
import { EVENTS, SECTIONS } from "@/lib/analytics/events";
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
  const userId = await getUserId(supabase);
  if (!userId) {
    return { ok: false, error: "Your session has expired. Please log in again." };
  }

  let path: string;
  try {
    path = await uploadToBucket(supabase, BUCKETS.productKb, file, "kb");
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Upload failed." };
  }

  const { data: inserted, error } = await supabase
    .from("product_kb_docs")
    .insert({ user_id: userId, file_url: path, original_filename: file.name })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  let docType: string | null = null;
  try {
    const result = await embedKbDoc(supabase, inserted.id);
    docType = result.doc_type;
  } catch {
    // Embedding/digestion is best-effort; the doc itself is already saved.
  }

  const anonId = String(formData.get("anon_id") ?? "");

  try {
    const admin = createAdminClient();
    const archivePath = `kb/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error: archiveUploadError } = await admin.storage
      .from(ADMIN_BUCKET)
      .upload(archivePath, file, { contentType: file.type || "application/octet-stream" });
    if (!archiveUploadError) {
      await admin.from("admin_documents").insert({
        kb_doc_id: inserted.id,
        storage_path: archivePath,
        original_filename: file.name,
        doc_type: docType ?? "other",
        uploader_anon_id: anonId || null,
        uploader_user_id: userId,
        file_size: file.size,
      });
    }
  } catch {
    // Archival to the locked-down admin store is best-effort; the FC-facing
    // upload has already succeeded and must not fail because of this.
  }

  if (anonId) {
    await logEvent(anonId, EVENTS.KB_DOC_UPLOAD, SECTIONS.SECTION_4, {
      doc_type: docType ?? "other",
      filename: file.name,
    });
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
