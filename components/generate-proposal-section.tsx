"use client";

import { useActionState, useEffect, useState } from "react";
import {
  runGenerateProposal,
  type GenerateProposalUiResult,
} from "@/lib/actions/proposals";
import type { ProposalStatus } from "@/lib/supabase/types";

const initialState: GenerateProposalUiResult = { status: "idle" };

export function GenerateProposalSection({
  clientId,
  hasIllustration,
  hasProposal,
  proposalStatus,
}: {
  clientId: string;
  hasIllustration: boolean;
  hasProposal: boolean;
  proposalStatus: ProposalStatus | null;
}) {
  const [state, formAction, pending] = useActionState(runGenerateProposal, initialState);
  const [blockedForIllustration, setBlockedForIllustration] = useState(false);
  const [confirmingRegenerate, setConfirmingRegenerate] = useState(false);

  useEffect(() => {
    if (state.status === "needs_illustration") setBlockedForIllustration(true);
    if (state.status === "ok") setConfirmingRegenerate(false);
  }, [state]);

  useEffect(() => {
    if (hasIllustration) setBlockedForIllustration(false);
  }, [hasIllustration]);

  // Overwriting an approved 'ready' proposal is high-risk (AGENTIC_LAYER.md) and
  // needs explicit FC confirmation; regenerating a still-unapproved draft does not.
  const needsConfirmation = hasProposal && proposalStatus === "ready";

  return (
    <section className="rounded-[18px] border border-brand-100 bg-gradient-to-br from-brand-700 to-brand-900 p-7 shadow-[var(--shadow-card)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-400">
        Generate Proposal
      </p>
      <p className="mt-1.5 text-sm text-brand-100">
        Assembles a personalized, story-driven proposal from Sections 1–4.
      </p>

      {needsConfirmation && confirmingRegenerate && (
        <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
          This proposal was already approved. Regenerating will overwrite it with a new draft
          that will need to be reviewed and approved again.
        </p>
      )}

      <form action={formAction} className="mt-4 flex items-center gap-3">
        <input type="hidden" name="client_id" value={clientId} />
        {needsConfirmation && !confirmingRegenerate ? (
          <button
            type="button"
            onClick={() => setConfirmingRegenerate(true)}
            disabled={pending || blockedForIllustration}
            className="rounded-xl bg-gold-400 px-4 py-2 text-sm font-semibold text-brand-900 shadow-sm transition-shadow hover:bg-gold-400/90 hover:shadow-md disabled:opacity-50"
          >
            Regenerate proposal
          </button>
        ) : (
          <button
            type="submit"
            disabled={pending || blockedForIllustration}
            className="rounded-xl bg-gold-400 px-4 py-2 text-sm font-semibold text-brand-900 shadow-sm transition-shadow hover:bg-gold-400/90 hover:shadow-md disabled:opacity-50"
          >
            {pending ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-900 border-t-transparent" />
                Generating…
              </span>
            ) : needsConfirmation ? (
              "Confirm regenerate"
            ) : hasProposal ? (
              "Regenerate proposal"
            ) : (
              "Generate proposal"
            )}
          </button>
        )}
        {needsConfirmation && confirmingRegenerate && !pending && (
          <button
            type="button"
            onClick={() => setConfirmingRegenerate(false)}
            className="text-sm text-brand-100 hover:underline"
          >
            Cancel
          </button>
        )}
      </form>

      {state.status === "blocked" && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.message}</p>
      )}
      {state.status === "needs_illustration" && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {state.message}
        </p>
      )}
      {state.status === "error" && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.message}
        </p>
      )}
    </section>
  );
}
