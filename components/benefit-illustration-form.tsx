"use client";

import { useActionState } from "react";
import {
  saveBenefitIllustration,
  type SaveIllustrationResult,
} from "@/lib/actions/benefit-illustrations";
import type { BenefitIllustration } from "@/lib/supabase/types";

const initialState: SaveIllustrationResult = { ok: false };

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
