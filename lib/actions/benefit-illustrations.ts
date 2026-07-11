"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { BUCKETS, uploadToBucket } from "@/lib/supabase/storage";
import type { BenefitIllustration } from "@/lib/supabase/types";

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

  const { error } = await supabase.from("benefit_illustrations").insert({
    client_id: clientId,
    file_url: path,
    product_name: productName || null,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/clients/${clientId}`);
  return { ok: true };
}
