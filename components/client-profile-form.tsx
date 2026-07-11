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
    <section className="rounded-xl border border-neutral-200 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        Section 2 · Client Fact-Find <span className="text-red-500">(required)</span>
      </p>
      <p className="mt-1 text-sm text-neutral-600">
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
          className="w-full rounded-md border border-neutral-300 p-3 text-sm focus:border-neutral-500 focus:outline-none"
        />
        <input
          type="file"
          name="file"
          accept=".pdf,.doc,.docx"
          className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-md file:border file:border-neutral-300 file:bg-white file:px-3 file:py-1.5 file:text-sm"
        />

        {profile?.file_urls && profile.file_urls.length > 0 && (
          <p className="text-xs text-neutral-500">{profile.file_urls.length} file(s) attached</p>
        )}
        {profile?.pain_points && (
          <p className="text-xs italic text-neutral-500">AI pain points: {profile.pain_points}</p>
        )}

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Saving…" : profile ? "Update fact-find" : "Save fact-find"}
        </button>
      </form>
    </section>
  );
}
