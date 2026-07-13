"use client";

import { useActionState } from "react";
import { saveClientProfile, type SaveProfileResult } from "@/lib/actions/client-profiles";
import type { ClientProfile } from "@/lib/supabase/types";
import { FileDropField } from "@/components/file-drop-field";

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
    <section className="rounded-[18px] border border-neutral-200/70 bg-paper-raised p-7 shadow-[var(--shadow-card)]">
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
          className="w-full rounded-xl border border-neutral-300 p-3 text-sm text-ink focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
        />
        <FileDropField name="file" accept=".pdf,.doc,.docx" hint="Upload any additional info about client (optional)" />

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
          className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-900 disabled:opacity-50"
        >
          {pending ? "Saving…" : profile ? "Update fact-find" : "Save fact-find"}
        </button>
      </form>
    </section>
  );
}
