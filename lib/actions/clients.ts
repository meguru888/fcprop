"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserId } from "@/lib/supabase/user";
import { logEvent } from "@/lib/actions/analytics";
import { EVENTS, SECTIONS } from "@/lib/analytics/events";
import type { Client } from "@/lib/supabase/types";

export async function listClients(): Promise<Client[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getClient(id: string): Promise<Client | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("clients").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export interface CreateClientResult {
  ok: boolean;
  error?: string;
}

export async function createClientRecord(
  _prev: CreateClientResult,
  formData: FormData,
): Promise<CreateClientResult> {
  const name = String(formData.get("name") ?? "").trim();
  const ageRaw = String(formData.get("age") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  if (!name) {
    return { ok: false, error: "Client name is required." };
  }

  const age = ageRaw ? Number(ageRaw) : null;
  if (ageRaw && (!Number.isFinite(age) || age! < 0 || age! > 120)) {
    return { ok: false, error: "Please enter a valid age." };
  }

  const supabase = await createClient();
  const userId = await getUserId(supabase);
  if (!userId) {
    return { ok: false, error: "Your session has expired. Please log in again." };
  }

  const { data, error } = await supabase
    .from("clients")
    .insert({ user_id: userId, name, age, email: email || null })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  const anonId = String(formData.get("anon_id") ?? "");
  if (anonId) {
    await logEvent(anonId, EVENTS.NEW_CLIENT_CLICK, SECTIONS.SECTION_2, { client_id: data.id });
  }

  revalidatePath("/");
  redirect(`/clients/${data.id}`);
}

export interface DeleteClientResult {
  ok: boolean;
  error?: string;
}

export async function deleteClient(
  _prev: DeleteClientResult,
  formData: FormData,
): Promise<DeleteClientResult> {
  const id = String(formData.get("client_id") ?? "");
  if (!id) return { ok: false, error: "Missing client." };

  const supabase = await createClient();

  for (const table of ["proposals", "benefit_illustrations", "client_profiles"] as const) {
    const { error } = await supabase.from(table).delete().eq("client_id", id);
    if (error) return { ok: false, error: error.message };
  }

  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/");
  redirect("/");
}
