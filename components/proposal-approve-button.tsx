"use client";

import { useActionState } from "react";
import { runApproveProposal, type ApproveProposalResult } from "@/lib/actions/proposals";

const initialState: ApproveProposalResult = { ok: false };

export function ProposalApproveButton({
  proposalId,
  clientId,
}: {
  proposalId: string;
  clientId: string;
}) {
  const [state, formAction, pending] = useActionState(runApproveProposal, initialState);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="proposal_id" value={proposalId} />
      <input type="hidden" name="client_id" value={clientId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
      >
        {pending ? "Approving…" : "Approve draft → ready to present"}
      </button>
      {state.error && <span className="text-sm text-red-600">{state.error}</span>}
    </form>
  );
}
