"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, type RequestResetResult } from "@/lib/actions/auth";

const initialState: RequestResetResult = { ok: false };

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState);

  if (state.sent) {
    return (
      <div className="mx-auto mt-24 max-w-sm rounded-[18px] border border-neutral-200/70 bg-paper-raised p-7 shadow-[var(--shadow-card)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600">ProposalOS</p>
        <p className="mt-1.5 text-sm font-semibold text-ink">Check your email.</p>
        <p className="mt-2 text-sm text-ink-soft">
          If an account exists for that email, we&apos;ve sent a link to reset your password.
        </p>
        <p className="mt-4 text-center text-sm">
          <Link href="/login" className="font-medium text-brand-700 hover:underline">
            Back to log in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-24 max-w-sm rounded-[18px] border border-neutral-200/70 bg-paper-raised p-7 shadow-[var(--shadow-card)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600">ProposalOS</p>
      <p className="mt-1.5 text-sm font-semibold text-ink">Reset your password.</p>
      <p className="mt-1.5 text-sm text-ink-soft">
        Enter your email and we&apos;ll send you a link to set a new password.
      </p>
      <form action={formAction} className="mt-4 space-y-3">
        <input
          type="email"
          name="email"
          required
          autoFocus
          className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-brand-600"
          placeholder="Email"
        />
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-brand-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-900 disabled:opacity-50"
        >
          {pending ? "Sending…" : "Send reset link"}
        </button>
      </form>
      {state.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
      <p className="mt-4 text-center text-sm">
        <Link href="/login" className="font-medium text-brand-700 hover:underline">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
