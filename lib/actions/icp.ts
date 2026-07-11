"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { BUCKETS, uploadToBucket } from "@/lib/supabase/storage";
import type { Icp } from "@/lib/supabase/types";

export async function getDefaultIcp(): Promise<Icp | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("icps")
    .select("*")
    .eq("is_default", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function listIcps(): Promise<Icp[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("icps")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export interface SaveIcpResult {
  ok: boolean;
  error?: string;
}

export async function saveIcp(_prev: SaveIcpResult, formData: FormData): Promise<SaveIcpResult> {
  const chatText = String(formData.get("chat_text") ?? "").trim();
  const setDefault = formData.get("is_default") === "on";
  const file = formData.get("file") as File | null;

  if (!chatText) {
    return { ok: false, error: "Please describe your Ideal Client Profile before saving." };
  }

  const supabase = await createClient();

  let fileUrls: string[] = [];
  if (file && file.size > 0) {
    try {
      const path = await uploadToBucket(supabase, BUCKETS.icp, file, "icp");
      fileUrls = [path];
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Upload failed." };
    }
  }

  if (setDefault) {
    const { error: clearError } = await supabase
      .from("icps")
      .update({ is_default: false })
      .eq("is_default", true);
    if (clearError) return { ok: false, error: clearError.message };
  }

  const { error } = await supabase.from("icps").insert({
    chat_text: chatText,
    file_urls: fileUrls,
    is_default: setDefault,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/");
  return { ok: true };
}

export async function setDefaultIcp(icpId: string): Promise<void> {
  const supabase = await createClient();
  const { error: clearError } = await supabase
    .from("icps")
    .update({ is_default: false })
    .eq("is_default", true);
  if (clearError) throw new Error(clearError.message);

  const { error } = await supabase.from("icps").update({ is_default: true }).eq("id", icpId);
  if (error) throw new Error(error.message);

  revalidatePath("/");
}
