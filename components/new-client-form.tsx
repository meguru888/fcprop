"use client";

import { useActionState, useState } from "react";
import { createClientRecord, type CreateClientResult } from "@/lib/actions/clients";

const initialState: CreateClientResult = { ok: false };

export function NewClientForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createClientRecord, initialState);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-dashed border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-600 hover:border-neutral-400"
      >
        + New client
      </button>
    );
  }

  return (
    <form action={formAction} className="rounded-md border border-neutral-200 p-4 space-y-2">
      <div className="flex gap-2">
        <input
          name="name"
          placeholder="Client name"
          required
          className="flex-1 rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
        />
        <input
          name="age"
          placeholder="Age"
          type="number"
          min={0}
          max={120}
          className="w-20 rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
        />
      </div>
      <input
        name="email"
        placeholder="Email (optional)"
        type="email"
        className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
      />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create client"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
