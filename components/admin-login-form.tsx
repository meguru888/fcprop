"use client";

import { useActionState } from "react";
import { adminLogin, type AdminLoginResult } from "@/lib/actions/admin-auth";

const initialState: AdminLoginResult = { ok: false };

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(adminLogin, initialState);

  return (
    <div className="mx-auto mt-24 max-w-sm rounded-[18px] border border-neutral-200/70 bg-paper-raised p-7 shadow-[var(--shadow-card)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600">Admin</p>
      <p className="mt-1.5 text-sm font-semibold text-ink">Enter the admin password to continue.</p>
      <form action={formAction} className="mt-4 space-y-3">
        <input
          type="password"
          name="password"
          required
          autoFocus
          className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-brand-600"
          placeholder="Password"
        />
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-brand-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-900 disabled:opacity-50"
        >
          {pending ? "Checking…" : "Enter"}
        </button>
      </form>
      {state.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
    </div>
  );
}
