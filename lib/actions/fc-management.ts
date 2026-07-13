"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminAuthed } from "@/lib/actions/admin-auth";

// These actions create/deactivate real login accounts, so — unlike the
// read-only metrics in lib/actions/admin.ts — they re-check the admin cookie
// themselves rather than relying only on the /admin page's render-time gate:
// a Next.js server action is a standalone endpoint once registered, callable
// independently of which page happened to render it.
async function requireAdmin(): Promise<void> {
  if (!(await isAdminAuthed())) {
    throw new Error("Not authorized.");
  }
}

function generatePassword(): string {
  // 16 URL-safe characters — well above Supabase's minimum and easy to
  // select/copy/paste cleanly from the UI (no quotes, slashes, or plus signs).
  return randomBytes(12).toString("base64url");
}

export interface FcRow {
  id: string;
  user_id: string | null;
  name: string | null;
  email: string | null;
  company_name: string | null;
  title_credentials: string | null;
  active: boolean;
  created_at: string;
}

export async function listFcs(): Promise<FcRow[]> {
  await requireAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("fc_profiles")
    .select("id, user_id, name, email, company_name, title_credentials, active, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export interface CreateFcResult {
  ok: boolean;
  error?: string;
  created?: { name: string; email: string; password: string };
}

export async function createFc(_prev: CreateFcResult, formData: FormData): Promise<CreateFcResult> {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!name || !email) {
    return { ok: false, error: "Please enter both a name and an email." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  const admin = createAdminClient();
  const password = generatePassword();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError || !created.user) {
    return { ok: false, error: createError?.message ?? "Failed to create account." };
  }

  const { error: profileError } = await admin
    .from("fc_profiles")
    .insert({ user_id: created.user.id, name, email, active: true });

  if (profileError) {
    // Don't leave an orphaned auth user with no FC record behind.
    await admin.auth.admin.deleteUser(created.user.id);
    return { ok: false, error: profileError.message };
  }

  revalidatePath("/admin");
  return { ok: true, created: { name, email, password } };
}

export async function setFcActive(fcProfileId: string, active: boolean): Promise<void> {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("fc_profiles").update({ active }).eq("id", fcProfileId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}
