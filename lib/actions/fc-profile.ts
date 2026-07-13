"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUserId } from "@/lib/supabase/user";
import type { FcProfile } from "@/lib/supabase/types";

export async function getFcProfile(): Promise<FcProfile | null> {
  const supabase = await createClient();
  const userId = await getUserId(supabase);
  if (!userId) return null;

  const { data, error } = await supabase
    .from("fc_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    // fc_profiles migration may not be applied yet — don't break pages that read this.
    console.error("getFcProfile:", error.message);
    return null;
  }
  return data;
}

export interface SaveFcProfileResult {
  ok: boolean;
  error?: string;
}

export async function saveFcProfile(
  _prev: SaveFcProfileResult,
  formData: FormData,
): Promise<SaveFcProfileResult> {
  const name = String(formData.get("name") ?? "").trim();
  const companyName = String(formData.get("company_name") ?? "").trim();
  const titleCredentials = String(formData.get("title_credentials") ?? "").trim();

  if (!name || !companyName) {
    return { ok: false, error: "Please fill in both your name and company." };
  }

  const supabase = await createClient();
  const userId = await getUserId(supabase);
  if (!userId) {
    return { ok: false, error: "Your session has expired. Please log in again." };
  }

  const { data: existing, error: fetchError } = await supabase
    .from("fc_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (fetchError) return { ok: false, error: fetchError.message };

  const payload = {
    name,
    company_name: companyName,
    title_credentials: titleCredentials || null,
  };

  // The FC's fc_profiles row normally already exists — an admin creates it
  // (with user_id/email/active set) when granting the FC access. This form
  // only ever fills in name/company/title, so update is the expected path;
  // insert is just a defensive fallback if that row is somehow missing.
  const { error } = existing
    ? await supabase
        .from("fc_profiles")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", existing.id)
    : await supabase.from("fc_profiles").insert({ ...payload, user_id: userId });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/");
  return { ok: true };
}
