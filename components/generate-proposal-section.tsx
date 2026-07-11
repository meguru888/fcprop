"use client";

import { useActionState, useEffect, useState } from "react";
import {
  runGenerateProposal,
  type GenerateProposalUiResult,
} from "@/lib/actions/proposals";

const initialState: GenerateProposalUiResult = { status: "idle" };

export function GenerateProposalSection({
  clientId,
  hasIllustration,
  hasProposal,
}: {
  clientId: string;
  hasIllustration: boolean;
  hasProposal: boolean;
}) {
  const [state, formAction, pending] = useActionState(runGenerateProposal, initialState);
  const [blockedForIllustration, setBlockedForIllustration] = useState(false);

  useEffect(() => {
    if (state.status === "needs_illustration") setBlockedForIllustration(true);
  }, [state]);

  useEffect(() => {
    if (hasIllustration) setBlockedForIllustration(false);
  }, [hasIllustration]);

  return (
    <section className="rounded-xl border border-neutral-200 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        Generate Proposal
      </p>
      <p className="mt-1 text-sm text-neutral-600">
        Assembles a personalized, story-driven proposal from Sections 1–4.
      </p>

      <form action={formAction} className="mt-4">
        <input type="hidden" name="client_id" value={clientId} />
        <button
          type="submit"
          disabled={pending || blockedForIllustration}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600"
        >
          {pending ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Generating…
            </span>
          ) : hasProposal ? (
            "Regenerate proposal"
          ) : (
            "Generate proposal"
          )}
        </button>
      </form>

      {state.status === "blocked" && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.message}</p>
      )}
      {state.status === "needs_illustration" && (
        <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {state.message}
        </p>
      )}
      {state.status === "error" && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.message}</p>
      )}
    </section>
  );
}
