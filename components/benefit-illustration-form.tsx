"use client";

import { useActionState } from "react";
import {
  saveBenefitIllustration,
  type SaveIllustrationResult,
} from "@/lib/actions/benefit-illustrations";
import type { BenefitIllustration, ExtractionStatus } from "@/lib/supabase/types";

const initialState: SaveIllustrationResult = { ok: false };

const STATUS_COPY: Record<ExtractionStatus, { label: string; className: string }> = {
  ok: { label: "Figures extracted", className: "bg-emerald-100 text-emerald-700" },
  partial: { label: "Partially extracted", className: "bg-amber-100 text-amber-700" },
  no_text_layer: { label: "No text found — review manually", className: "bg-neutral-200 text-neutral-700" },
  unsupported_format: { label: "Format not auto-readable", className: "bg-neutral-200 text-neutral-700" },
  failed: { label: "Extraction failed — review manually", className: "bg-red-100 text-red-700" },
};

function ExtractionStatusBadge({
  status,
  notes,
}: {
  status: ExtractionStatus | null;
  notes: string | null;
}) {
  if (!status) return null;
  const copy = STATUS_COPY[status];
  return (
    <div className="mt-2">
      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${copy.className}`}>
        {copy.label}
      </span>
      {notes && <p className="mt-1 text-xs text-neutral-500">{notes}</p>}
    </div>
  );
}

export function BenefitIllustrationForm({
  clientId,
  illustration,
}: {
  clientId: string;
  illustration: BenefitIllustration | null;
}) {
  const [state, formAction, pending] = useActionState(saveBenefitIllustration, initialState);

  return (
    <section className="rounded-xl border border-neutral-200 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        Section 3 · Benefit Illustration <span className="text-neutral-400">(optional)</span>
      </p>
      <p className="mt-1 text-sm text-neutral-600">
        If you don&apos;t have one yet, we&apos;ll try to match a product from your knowledge base.
      </p>

      {illustration ? (
        <div className="mt-4 rounded-md border border-neutral-100 bg-neutral-50 px-3 py-2 text-sm">
          <p className="font-medium text-neutral-800">
            {illustration.product_name || "Uploaded illustration"}
          </p>
          <p className="text-xs text-neutral-500">Uploaded — you can add another below to replace it.</p>
          <ExtractionStatusBadge status={illustration.extraction_status} notes={illustration.extraction_notes} />
        </div>
      ) : (
        <p className="mt-4 text-sm text-neutral-400">No benefit illustration uploaded yet.</p>
      )}

      <form action={formAction} className="mt-4 space-y-3">
        <input type="hidden" name="client_id" value={clientId} />
        <input
          name="product_name"
          placeholder="Product name (optional — we'll detect it if left blank)"
          className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
        />
        <input
          type="file"
          name="file"
          accept=".pdf,.doc,.docx"
          className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-md file:border file:border-neutral-300 file:bg-white file:px-3 file:py-1.5 file:text-sm"
        />
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Uploading…" : "Upload illustration"}
        </button>
      </form>
    </section>
  );
}
