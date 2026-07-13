"use server";

import { createHash } from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "fcprop_admin_auth";

function expectedToken(): string {
  const password = process.env.ADMIN_DASHBOARD_PASSWORD ?? "";
  return createHash("sha256").update(password).digest("hex");
}

export async function isAdminAuthed(): Promise<boolean> {
  if (!process.env.ADMIN_DASHBOARD_PASSWORD) return false;
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return token === expectedToken();
}

export interface AdminLoginResult {
  ok: boolean;
  error?: string;
}

export async function adminLogin(
  _prev: AdminLoginResult,
  formData: FormData,
): Promise<AdminLoginResult> {
  const password = String(formData.get("password") ?? "");
  const configured = process.env.ADMIN_DASHBOARD_PASSWORD ?? "";
  if (!configured || password !== configured) {
    return { ok: false, error: "Incorrect password." };
  }
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, expectedToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return { ok: true };
}

export async function adminLogout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
