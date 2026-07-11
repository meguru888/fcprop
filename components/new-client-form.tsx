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
        className="w-full rounded-xl border border-dashed border-neutral-300 py-3 text-center text-sm font-medium text-ink-soft transition-colors hover:border-brand-400 hover:text-brand-700"
      >
        + New client
      </button>
    );
  }

  return (
    <form action={formAction} className="rounded-xl border border-neutral-200 bg-neutral-50 p-5 space-y-3">
      <div className="flex gap-2">
        <input
          name="name"
          placeholder="Client name"
          required
          className="flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
        />
        <input
          name="age"
          placeholder="Age"
          type="number"
          min={0}
          max={120}
          className="w-20 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
        />
      </div>
      <input
        name="email"
        placeholder="Email (optional)"
        type="email"
        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
      />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-900 disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create client"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-neutral-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
