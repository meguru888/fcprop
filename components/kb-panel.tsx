"use client";

import { useActionState, useEffect, useState } from "react";
import { uploadKbDoc, deleteKbDoc, type UploadKbResult } from "@/lib/actions/kb";
import type { ProductKbDoc } from "@/lib/supabase/types";
import { FileDropField } from "@/components/file-drop-field";
import { getAnonId } from "@/lib/analytics/anon-id";

const initialState: UploadKbResult = { ok: false };

export function KbPanel({ docs }: { docs: ProductKbDoc[] }) {
  const [state, formAction, pending] = useActionState(uploadKbDoc, initialState);
  const [anonId, setAnonId] = useState("");

  useEffect(() => {
    setAnonId(getAnonId());
  }, []);

  return (
    <section className="rounded-[18px] border border-neutral-200/70 bg-paper-raised p-7 shadow-[var(--shadow-card)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600">
        Section 4 · Product Knowledge Base
      </p>
      <p className="mt-1.5 text-sm font-semibold text-ink">
        Create your Product Knowledge Base here so that AI can help you better.
        <br />
        (Please upload in pdf format)
      </p>
      <p className="mt-3 text-sm text-ink-soft">
        Upload benefit illustrations, product-related documents, product brochures, etc., to build your AI&apos;s
        understanding of your products. Every document strengthens its ability to recommend suitable solutions,
        explain product benefits and help you create very personalized proposals together with your client&apos;s
        info updated in other sections.
      </p>
      <p className="mt-3 text-sm text-ink-soft">
        If no benefit illustration is uploaded for a client in Section 3, the AI will intelligently draw from this
        knowledge base to recommend the most appropriate solution. The more documents you upload, the more
        knowledgeable and valuable your AI becomes and the faster you can scale your business.
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
        <input type="hidden" name="anon_id" value={anonId} />
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
