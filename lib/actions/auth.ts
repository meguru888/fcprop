"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export interface LoginResult {
  ok: boolean;
  error?: string;
}

export async function login(_prev: LoginResult, formData: FormData): Promise<LoginResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { ok: false, error: "Please enter your email and password." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { ok: false, error: "Incorrect email or password." };
  }

  // Belt-and-suspenders: RLS already blocks a deactivated FC's data, but bounce
  // them out here too with a clear reason instead of a confusingly empty app.
  const { data: profile } = await supabase
    .from("fc_profiles")
    .select("active")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (profile && profile.active === false) {
    await supabase.auth.signOut();
    return { ok: false, error: "This account has been deactivated. Contact your admin." };
  }

  redirect("/");
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export interface RequestResetResult {
  ok: boolean;
  error?: string;
  sent?: boolean;
}

export async function requestPasswordReset(
  _prev: RequestResetResult,
  formData: FormData,
): Promise<RequestResetResult> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { ok: false, error: "Please enter your email." };
  }

  const supabase = await createClient();
  const originHeader = (await headers()).get("origin");
  const origin = originHeader ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Never reveal whether an email exists — always report success to the caller.
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/reset-password`,
  });

  return { ok: true, sent: true };
}

export interface UpdatePasswordResult {
  ok: boolean;
  error?: string;
}

export async function updatePassword(
  _prev: UpdatePasswordResult,
  formData: FormData,
): Promise<UpdatePasswordResult> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }
  if (password !== confirm) {
    return { ok: false, error: "Passwords don't match." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Your reset link has expired. Please request a new one." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, error: error.message };

  redirect("/");
}
