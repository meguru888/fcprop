"use client";

import { useActionState, useState } from "react";
import { deleteClient, type DeleteClientResult } from "@/lib/actions/clients";

const initialState: DeleteClientResult = { ok: false };

export function DeleteClientButton({ clientId }: { clientId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(deleteClient, initialState);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-sm text-red-600 hover:underline"
      >
        Delete client
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-neutral-600">Delete this client and all their data?</span>
      <form action={formAction}>
        <input type="hidden" name="client_id" value={clientId} />
        <button type="submit" disabled={pending} className="font-medium text-red-600 hover:underline disabled:opacity-50">
          {pending ? "Deleting…" : "Confirm delete"}
        </button>
      </form>
      <button type="button" onClick={() => setConfirming(false)} className="text-neutral-500 hover:underline">
        Cancel
      </button>
      {state.error && <span className="text-red-600">{state.error}</span>}
    </div>
  );
}
