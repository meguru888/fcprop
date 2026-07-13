"use client";

import { useActionState } from "react";
import {
  saveBenefitIllustration,
  type SaveIllustrationResult,
} from "@/lib/actions/benefit-illustrations";
import type { BenefitIllustration, ExtractionStatus } from "@/lib/supabase/types";
import { FileDropField } from "@/components/file-drop-field";
import { track } from "@/lib/analytics/track";
import { EVENTS, SECTIONS } from "@/lib/analytics/events";

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
      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${copy.className}`}>
        {copy.label}
      </span>
      {notes && <p className="mt-1 text-xs text-ink-soft">{notes}</p>}
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
    <section className="rounded-[18px] border border-neutral-200/70 bg-paper-raised p-7 shadow-[var(--shadow-card)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600">
        Section 3 · Benefit Illustration <span className="text-neutral-400">(optional)</span>
      </p>
      <p className="mt-1.5 text-sm text-ink-soft">
        If you don&apos;t have one yet, we&apos;ll try to match a product from your knowledge base.
      </p>

      {illustration ? (
        <div className="mt-4 rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-sm">
          <p className="font-medium text-ink">
            {illustration.product_name || "Uploaded illustration"}
          </p>
          <p className="text-xs text-ink-soft">Uploaded — you can add another below to replace it.</p>
          <ExtractionStatusBadge status={illustration.extraction_status} notes={illustration.extraction_notes} />
        </div>
      ) : (
        <p className="mt-4 text-sm text-neutral-400">No benefit illustration uploaded yet.</p>
      )}

      <form
        action={(fd) => {
          const file = fd.get("file");
          if (file instanceof File && file.size > 0) {
            track(EVENTS.BENEFIT_ILLUSTRATION_UPLOAD, SECTIONS.SECTION_3, { client_id: clientId });
          }
          formAction(fd);
        }}
        className="mt-4 space-y-3"
      >
        <input type="hidden" name="client_id" value={clientId} />
        <input
          name="product_name"
          placeholder="Product name (optional — we'll detect it if left blank)"
          className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
        />
        <FileDropField name="file" accept=".pdf,.doc,.docx" hint="Click to upload the illustration, or drag a file here" />
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-900 disabled:opacity-50"
        >
          {pending ? "Uploading…" : "Upload illustration"}
        </button>
      </form>
    </section>
  );
}
