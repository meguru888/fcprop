"use client";

import { useState } from "react";
import type { BenefitIllustration, Client } from "@/lib/supabase/types";
import { BenefitIllustrationForm } from "@/components/benefit-illustration-form";

export function HomeBenefitIllustrationSection({
  clients,
  illustrations,
}: {
  clients: Client[];
  illustrations: Record<string, BenefitIllustration | null>;
}) {
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id ?? "");

  if (clients.length === 0) {
    return (
      <section className="rounded-[18px] border border-neutral-200/70 bg-paper-raised p-7 shadow-[var(--shadow-card)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600">
          Section 3 · Benefit Illustration <span className="text-neutral-400">(optional)</span>
        </p>
        <p className="mt-1.5 text-sm text-ink-soft">Add a client in Section 2 above before uploading an illustration.</p>
      </section>
    );
  }

  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium text-ink-soft" htmlFor="home-illustration-client">
        Upload a benefit illustration for
      </label>
      <select
        id="home-illustration-client"
        value={selectedClientId}
        onChange={(e) => setSelectedClientId(e.target.value)}
        className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
      >
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.name}
          </option>
        ))}
      </select>
      <BenefitIllustrationForm
        clientId={selectedClientId}
        illustration={illustrations[selectedClientId] ?? null}
      />
    </div>
  );
}
