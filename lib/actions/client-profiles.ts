"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { BUCKETS, uploadToBucket } from "@/lib/supabase/storage";
import { extractPainPoints } from "@/lib/ai/tools";
import type { ClientProfile } from "@/lib/supabase/types";

export async function getClientProfile(clientId: string): Promise<ClientProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_profiles")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export interface SaveProfileResult {
  ok: boolean;
  error?: string;
}

export async function saveClientProfile(
  _prev: SaveProfileResult,
  formData: FormData,
): Promise<SaveProfileResult> {
  const clientId = String(formData.get("client_id") ?? "");
  const notesText = String(formData.get("notes_text") ?? "").trim();
  const file = formData.get("file") as File | null;

  if (!clientId) return { ok: false, error: "Missing client." };
  if (!notesText) {
    return { ok: false, error: "Please add your client's fact-find notes before saving." };
  }

  const supabase = await createClient();

  const existing = await getClientProfile(clientId);
  let fileUrls: string[] = existing?.file_urls ?? [];

  if (file && file.size > 0) {
    try {
      const path = await uploadToBucket(supabase, BUCKETS.client, file, `client/${clientId}`);
      fileUrls = [...fileUrls, path];
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Upload failed." };
    }
  }

  let profileId: string;
  if (existing) {
    const { error } = await supabase
      .from("client_profiles")
      .update({ notes_text: notesText, file_urls: fileUrls })
      .eq("id", existing.id);
    if (error) return { ok: false, error: error.message };
    profileId = existing.id;
  } else {
    const { data: inserted, error } = await supabase
      .from("client_profiles")
      .insert({ client_id: clientId, notes_text: notesText, file_urls: fileUrls })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    profileId = inserted.id;
  }

  try {
    await extractPainPoints(supabase, profileId);
  } catch {
    // Pain-point extraction is best-effort; the fact-find text itself is already saved.
  }

  revalidatePath(`/clients/${clientId}`);
  return { ok: true };
}
