"use client";

import { useActionState } from "react";
import { uploadKbDoc, deleteKbDoc, type UploadKbResult } from "@/lib/actions/kb";
import type { ProductKbDoc } from "@/lib/supabase/types";

const initialState: UploadKbResult = { ok: false };

export function KbPanel({ docs }: { docs: ProductKbDoc[] }) {
  const [state, formAction, pending] = useActionState(uploadKbDoc, initialState);

  return (
    <section className="rounded-xl border border-neutral-200 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        Section 4 · Product Knowledge Base
      </p>
      <p className="mt-1 text-sm text-neutral-600">
        Upload product PDFs the AI can draw on when a client has no benefit illustration yet.
      </p>

      {docs.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-400">No product documents yet.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {docs.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between rounded-md border border-neutral-100 bg-neutral-50 px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium text-neutral-800">{doc.original_filename}</p>
                {doc.concept_summary ? (
                  <p className="text-xs text-neutral-500">{doc.concept_summary}</p>
                ) : (
                  <p className="text-xs text-neutral-400">Not yet digested</p>
                )}
              </div>
              <form action={deleteKbDoc.bind(null, doc.id)}>
                <button
                  type="submit"
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  Delete
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <form action={formAction} className="mt-4 flex items-center gap-2">
        <input
          type="file"
          name="file"
          accept=".pdf,.doc,.docx"
          required
          className="block flex-1 text-sm text-neutral-600 file:mr-3 file:rounded-md file:border file:border-neutral-300 file:bg-white file:px-3 file:py-1.5 file:text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Uploading…" : "Upload"}
        </button>
      </form>
      {state.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
    </section>
  );
}
