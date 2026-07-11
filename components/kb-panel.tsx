"use client";

import { useActionState } from "react";
import { uploadKbDoc, deleteKbDoc, type UploadKbResult } from "@/lib/actions/kb";
import type { ProductKbDoc } from "@/lib/supabase/types";
import { FileDropField } from "@/components/file-drop-field";

const initialState: UploadKbResult = { ok: false };

export function KbPanel({ docs }: { docs: ProductKbDoc[] }) {
  const [state, formAction, pending] = useActionState(uploadKbDoc, initialState);

  return (
    <section className="rounded-[18px] border border-neutral-200/70 bg-paper-raised p-7 shadow-[var(--shadow-card)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600">
        Section 4 · Product Knowledge Base
      </p>
      <p className="mt-1.5 text-sm text-ink-soft">
        Upload product PDFs the AI can draw on when a client has no benefit illustration yet.
      </p>

      {docs.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-400">No product documents yet.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {docs.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium text-ink">{doc.original_filename}</p>
                {doc.concept_summary ? (
                  <p className="text-xs text-ink-soft">{doc.concept_summary}</p>
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

      <form action={formAction} className="mt-4 space-y-3">
        <FileDropField name="file" accept=".pdf,.doc,.docx" required hint="Click to upload a product PDF, or drag a file here" />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-900 disabled:opacity-50"
          >
            {pending ? "Uploading…" : "Upload"}
          </button>
        </div>
      </form>
      {state.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
    </section>
  );
}
