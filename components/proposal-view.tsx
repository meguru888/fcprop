import type { FcProfile, Proposal, ProposalContent } from "@/lib/supabase/types";
import { ProposalApproveButton } from "@/components/proposal-approve-button";
import { formatSgd } from "@/lib/format";

const GENERIC_PRODUCT_LABEL = "the recommended solution";
const LEGACY_GENERIC_LABELS = new Set(["Uploaded benefit illustration", GENERIC_PRODUCT_LABEL]);
const isGenericProduct = (value: string) => LEGACY_GENERIC_LABELS.has(value);
const displayProduct = (value: string) => (isGenericProduct(value) ? GENERIC_PRODUCT_LABEL : value);

const SECTIONS: { key: keyof ProposalContent["proposal_sections"]; label: string; index: string }[] = [
  { key: "opening_story", label: "Your Life's Journey", index: "01" },
  { key: "problem_bridge", label: "The Problems/Obstacles", index: "02" },
  { key: "solution_reveal", label: "The Solution", index: "03" },
  { key: "benefit_breakdown", label: "What You Get", index: "04" },
  { key: "dream_outcome", label: "Your Future", index: "05" },
  { key: "call_to_action", label: "Next Step", index: "06" },
];

const NEXT_STEPS = ["Review together", "Confirm the plan", "You're protected"];

const STATUS_STYLES: Record<Proposal["status"], string> = {
  draft: "bg-amber-100 text-amber-700",
  ready: "bg-emerald-100 text-emerald-700",
  exported: "bg-neutral-200 text-neutral-700",
};

function MiniBarRow({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div>
      <div className="flex justify-between text-xs text-ink/70">
        <span>{label}</span>
        <span className="font-semibold" style={{ color }}>
          {Math.round(pct)}%
        </span>
      </div>
      <div className="mt-1.5 h-1.5 w-full rounded-full bg-neutral-200">
        <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export function ProposalView({
  proposal,
  content,
  fcProfile,
}: {
  proposal: Proposal;
  content: ProposalContent;
  fcProfile?: FcProfile | null;
}) {
  const beforeAfter = content.charts?.before_after ?? [];
  const benefitTimeline = content.charts?.benefit_timeline ?? [];
  const riskEvents = content.risk_events ?? [];

  type AgePoint = {
    age: number;
    before?: { event: string; cost: number }[];
    after?: { protectionValue?: number; wealthValue?: number };
  };
  const sumAssured = content.real_figures?.sum_assured ?? null;
  const scenario = content.real_figures?.scenarios?.[0];

  const ageJourneyMap = new Map<number, AgePoint>();
  for (const r of riskEvents) {
    const existing = ageJourneyMap.get(r.age);
    if (existing) {
      existing.before = [...(existing.before ?? []), { event: r.event, cost: r.cost }];
    } else {
      ageJourneyMap.set(r.age, { age: r.age, before: [{ event: r.event, cost: r.cost }] });
    }
  }
  if (content.client_age !== null && scenario) {
    for (const row of scenario.rows) {
      const age = content.client_age + row.year;
      const existing = ageJourneyMap.get(age);
      if (existing) {
        existing.after = { ...(existing.after ?? {}), wealthValue: row.value };
      } else {
        ageJourneyMap.set(age, { age, after: { wealthValue: row.value } });
      }
    }
  }
  if (sumAssured !== null) {
    for (const point of ageJourneyMap.values()) {
      if (point.before) point.after = { ...(point.after ?? {}), protectionValue: sumAssured };
    }
  }
  const ageJourney: AgePoint[] = Array.from(ageJourneyMap.values())
    .sort((a, b) => a.age - b.age)
    .slice(0, 6);

  const snapshotStats = [
    content.client_age !== null ? { label: "Age", value: String(content.client_age) } : null,
    content.pain_points.length > 0 ? { label: "Concerns flagged", value: String(content.pain_points.length) } : null,
    !isGenericProduct(content.product_matched) ? { label: "Reviewing", value: content.product_matched } : null,
  ].filter((s): s is { label: string; value: string } => s !== null);

  return (
    <section
      className="rounded-2xl border border-neutral-200/70 bg-paper-raised p-8 shadow-[var(--shadow-card)] sm:p-10"
      id="proposal-view"
    >
      <div className="flex items-start justify-between gap-4 border-b border-neutral-100 pb-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600">
            Proposal for {content.client_name}
          </p>
          {!isGenericProduct(content.product_matched) && (
            <p className="mt-2 font-serif text-3xl italic tracking-tight text-ink">{content.product_matched}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${STATUS_STYLES[proposal.status]}`}
          >
            {proposal.status}
          </span>
          {fcProfile?.name && fcProfile.company_name && (
            <div className="text-right text-xs text-ink-soft">
              <p className="font-medium text-ink">{fcProfile.name}</p>
              {(fcProfile.title_credentials ?? "")
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              <p className="mt-1 italic text-brand-700">Representing {fcProfile.company_name}</p>
            </div>
          )}
        </div>
      </div>

      {/* Journey flow diagram — the six stages as one continuous arc */}
      <div className="mt-8 flex gap-0 overflow-x-auto pb-2">
        {SECTIONS.map(({ key, label, index }, i) => (
          <div key={key} className="flex min-w-[88px] flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              <div className={`h-px flex-1 ${i === 0 ? "bg-transparent" : "bg-brand-100"}`} />
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand-200 bg-white font-serif text-[13px] italic text-brand-700">
                {index}
              </div>
              <div className={`h-px flex-1 ${i === SECTIONS.length - 1 ? "bg-transparent" : "bg-brand-100"}`} />
            </div>
            <span className="mt-2 text-center text-[9px] font-semibold uppercase tracking-wide text-ink-soft">
              {label}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-8 space-y-8">
        {SECTIONS.map(({ key, label, index }) => (
          <div key={key} className="flex gap-5 border-l-2 border-brand-100 pl-5">
            <div className="shrink-0">
              <span className="font-serif text-lg italic text-gold-600">{index}</span>
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600">{label}</p>
              <p className="mt-2 font-serif text-[16px] leading-[1.75] text-ink/90">
                {content.proposal_sections[key]}
              </p>

              {key === "opening_story" && snapshotStats.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-3">
                  {snapshotStats.map((s, i) => (
                    <div key={i} className="rounded-lg bg-neutral-50 px-3.5 py-2 border border-neutral-100">
                      <p className="text-[9px] uppercase tracking-wide text-ink-soft">{s.label}</p>
                      <p className="mt-0.5 font-serif text-sm text-ink">{s.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {key === "problem_bridge" && content.pain_points.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {content.pain_points.map((p, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-gold-100 px-3 py-1 text-xs font-medium text-gold-600"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              )}

              {key === "problem_bridge" && beforeAfter.length > 0 && (
                <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50/50 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-rose-700">
                    Where you stand today
                  </p>
                  <div className="mt-3 space-y-3">
                    {beforeAfter.map((bar, i) => (
                      <MiniBarRow key={i} label={bar.label} value={bar.before} color="#e07a5f" />
                    ))}
                  </div>
                </div>
              )}

              {key === "solution_reveal" && beforeAfter.length > 0 && (
                <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                    Where {displayProduct(content.product_matched)} gets you
                  </p>
                  <div className="mt-3 space-y-3">
                    {beforeAfter.map((bar, i) => (
                      <MiniBarRow key={i} label={bar.label} value={bar.after} color="#059669" />
                    ))}
                  </div>
                </div>
              )}

              {key === "benefit_breakdown" && content.real_figures && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-800">
                      Your Actual Policy Numbers
                    </p>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                      From benefit illustration
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {content.real_figures.premium !== null && (
                      <div className="rounded-lg bg-white px-4 py-2.5 shadow-sm">
                        <p className="text-[10px] uppercase tracking-wide text-ink-soft">Premium</p>
                        <p className="mt-0.5 font-serif text-lg text-ink">
                          {formatSgd(content.real_figures.premium)}
                          {content.real_figures.premium_term_years !== null && (
                            <span className="text-sm font-sans text-ink-soft"> / yr for {content.real_figures.premium_term_years} yrs</span>
                          )}
                        </p>
                      </div>
                    )}
                    {content.real_figures.sum_assured !== null && (
                      <div className="rounded-lg bg-white px-4 py-2.5 shadow-sm">
                        <p className="text-[10px] uppercase tracking-wide text-ink-soft">Sum Assured</p>
                        <p className="mt-0.5 font-serif text-lg text-ink">
                          {formatSgd(content.real_figures.sum_assured)}
                        </p>
                      </div>
                    )}
                  </div>

                  {content.real_figures.scenarios.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {content.real_figures.scenarios.map((scenario, i) => (
                        <div key={i}>
                          <p className="text-xs font-semibold text-emerald-800">{scenario.label}</p>
                          <div className="mt-1.5 flex flex-wrap gap-2">
                            {scenario.rows.map((row, j) => (
                              <span key={j} className="rounded-md bg-white px-2.5 py-1 text-xs text-ink/80 border border-emerald-100">
                                Yr {row.year}: {formatSgd(row.value)}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {content.real_figures.extraction_status === "partial" && (
                    <p className="mt-4 text-xs text-amber-700">
                      Some figures weren&apos;t found in the uploaded document — please double-check the original illustration for anything not shown here.
                    </p>
                  )}
                </div>
              )}

              {key === "dream_outcome" && ageJourney.length > 0 && (
                <div className="mt-4 overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-[var(--shadow-card)]">
                  <div className="flex items-center justify-between border-b border-neutral-100 bg-paper px-5 py-3.5">
                    <p className="font-serif text-base italic text-ink">Your Future Life Journey</p>
                    <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wide text-brand-600">
                      With plan in place
                    </span>
                  </div>

                  <div className="px-5 py-6">
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-rose-700">
                        Cost if nothing changes
                      </p>
                    </div>

                    <div className="mt-4 flex items-end gap-3 overflow-x-auto pb-1">
                      {ageJourney.map((point, i) => (
                        <div key={i} className="flex min-w-[108px] flex-1 flex-col items-center">
                          <div
                            className={`w-full rounded-xl px-3 py-2.5 text-center ${
                              point.before ? "bg-rose-50/70 shadow-sm ring-1 ring-rose-100" : ""
                            }`}
                          >
                            {point.before?.map((item, j) => (
                              <div key={j} className={j > 0 ? "mt-2 border-t border-rose-200/60 pt-2" : undefined}>
                                <p className="font-serif text-sm text-rose-700">{formatSgd(item.cost)}</p>
                                <p className="mt-0.5 text-[9px] leading-snug text-rose-600/90">{item.event}</p>
                              </div>
                            ))}
                          </div>

                          <div className="mt-3 flex w-full items-center">
                            <div className={`h-px flex-1 ${i === 0 ? "bg-transparent" : "bg-neutral-200"}`} />
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-700 font-serif text-xs text-white shadow-sm ring-4 ring-white">
                              {point.age}
                            </div>
                            <div className={`h-px flex-1 ${i === ageJourney.length - 1 ? "bg-transparent" : "bg-neutral-200"}`} />
                          </div>
                          <p className="mt-1.5 text-center text-[10px] font-medium text-ink-soft">
                            {point.age} years old
                          </p>

                          <div
                            className={`mt-3 w-full rounded-xl px-3 py-2.5 text-center ${
                              point.after ? "bg-emerald-50/70 shadow-sm ring-1 ring-emerald-100" : ""
                            }`}
                          >
                            {point.after?.protectionValue !== undefined && (
                              <div>
                                <p className="font-serif text-sm text-emerald-700">
                                  {formatSgd(point.after.protectionValue)}
                                </p>
                                <p className="mt-0.5 text-[9px] leading-snug text-emerald-600/90">Protection value</p>
                              </div>
                            )}
                            {point.after?.wealthValue !== undefined && (
                              <div className={point.after?.protectionValue !== undefined ? "mt-2 border-t border-emerald-200/60 pt-2" : undefined}>
                                <p className="font-serif text-sm text-emerald-700">
                                  {formatSgd(point.after.wealthValue)}
                                </p>
                                <p className="mt-0.5 text-[9px] leading-snug text-emerald-600/90">Wealth accumulation</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                        With this plan in place
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {key === "dream_outcome" && ageJourney.length === 0 && benefitTimeline.length > 0 && (
                <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50/60 p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600">
                    Your Protection Value Over Time
                  </p>
                  <div className="mt-4 flex h-24 items-end gap-2">
                    {benefitTimeline.map((point, i) => {
                      const pct = Math.min(100, Math.max(4, point.value));
                      return (
                        <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                          <div
                            className="w-full rounded-t bg-brand-600"
                            style={{ height: `${Math.round((pct / 100) * 80)}px` }}
                          />
                          <span className="text-[10px] text-ink-soft">Yr {point.year}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {key === "call_to_action" && (
                <div className="mt-4 flex items-center gap-0">
                  {NEXT_STEPS.map((step, i) => (
                    <div key={i} className="flex flex-1 items-center">
                      <div className="flex flex-1 items-center gap-2 rounded-lg bg-brand-50 px-3 py-2">
                        <span className="font-serif text-xs italic text-gold-600">{i + 1}</span>
                        <span className="text-xs font-medium text-brand-700">{step}</span>
                      </div>
                      {i < NEXT_STEPS.length - 1 && <span className="mx-2 text-neutral-300">→</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-neutral-100 pt-6">
        {proposal.status === "draft" ? (
          <ProposalApproveButton proposalId={proposal.id} clientId={proposal.client_id} />
        ) : (
          <p className="text-sm text-ink-soft">Approved and ready to present.</p>
        )}
        <div className="flex gap-2">
          <a
            href={`/api/proposals/${proposal.id}/pptx`}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-ink hover:bg-neutral-50"
          >
            Export Slides
          </a>
          <a
            href={`/api/proposals/${proposal.id}/docx`}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-ink hover:bg-neutral-50"
          >
            Export Word
          </a>
          <a
            href={`/api/proposals/${proposal.id}/pdf`}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-ink hover:bg-neutral-50"
          >
            Export PDF
          </a>
        </div>
      </div>
    </section>
  );
}
