"use client";

import { useActionState } from "react";
import { saveClientProfile, type SaveProfileResult } from "@/lib/actions/client-profiles";
import type { ClientProfile } from "@/lib/supabase/types";

const initialState: SaveProfileResult = { ok: false };

export function ClientProfileForm({
  clientId,
  profile,
}: {
  clientId: string;
  profile: ClientProfile | null;
}) {
  const [state, formAction, pending] = useActionState(saveClientProfile, initialState);

  return (
    <section className="rounded-2xl border border-neutral-200/70 bg-paper-raised p-6 shadow-[var(--shadow-card)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600">
        Section 2 · Client Fact-Find <span className="text-red-500">(required)</span>
      </p>
      <p className="mt-1.5 text-sm text-ink-soft">
        Free-text notes on the client&apos;s situation, worries, and goals, plus any supporting documents.
      </p>

      <form action={formAction} className="mt-4 space-y-3">
        <input type="hidden" name="client_id" value={clientId} />
        <textarea
          name="notes_text"
          rows={5}
          required
          defaultValue={profile?.notes_text ?? ""}
          placeholder="e.g. Client is a nurse with two kids, worried about critical illness cover..."
          className="w-full rounded-lg border border-neutral-300 p-3 text-sm text-ink focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
        />
        <input
          type="file"
          name="file"
          accept=".pdf,.doc,.docx"
          className="block w-full text-sm text-ink-soft file:mr-3 file:rounded-lg file:border file:border-neutral-300 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ink hover:file:bg-neutral-50"
        />

        {profile?.file_urls && profile.file_urls.length > 0 && (
          <p className="text-xs text-ink-soft">{profile.file_urls.length} file(s) attached</p>
        )}
        {profile?.pain_points && (
          <p className="text-xs italic text-ink-soft">AI pain points: {profile.pain_points}</p>
        )}

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-900 disabled:opacity-50"
        >
          {pending ? "Saving…" : profile ? "Update fact-find" : "Save fact-find"}
        </button>
      </form>
    </section>
  );
}
