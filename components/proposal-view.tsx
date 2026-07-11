import type { Proposal, ProposalContent } from "@/lib/supabase/types";
import { ProposalApproveButton } from "@/components/proposal-approve-button";

const SECTIONS: { key: keyof ProposalContent["proposal_sections"]; label: string; index: string }[] = [
  { key: "opening_story", label: "Your Life's Journey", index: "01" },
  { key: "problem_bridge", label: "The Challenge", index: "02" },
  { key: "solution_reveal", label: "The Solution", index: "03" },
  { key: "benefit_breakdown", label: "What You Get", index: "04" },
  { key: "dream_outcome", label: "Your Future", index: "05" },
  { key: "call_to_action", label: "Next Step", index: "06" },
];

const STATUS_STYLES: Record<Proposal["status"], string> = {
  draft: "bg-amber-100 text-amber-700",
  ready: "bg-emerald-100 text-emerald-700",
  exported: "bg-neutral-200 text-neutral-700",
};

export function ProposalView({
  proposal,
  content,
}: {
  proposal: Proposal;
  content: ProposalContent;
}) {
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
          <p className="mt-2 font-serif text-3xl italic tracking-tight text-ink">{content.product_matched}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${STATUS_STYLES[proposal.status]}`}
        >
          {proposal.status}
        </span>
      </div>

      {content.pain_points.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
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

      <div className="mt-8 space-y-8">
        {SECTIONS.map(({ key, label, index }) => (
          <div key={key} className="flex gap-5 border-l-2 border-brand-100 pl-5">
            <div className="shrink-0">
              <span className="font-serif text-lg italic text-gold-600">{index}</span>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600">{label}</p>
              <p className="mt-2 font-serif text-[16px] leading-[1.75] text-ink/90">
                {content.proposal_sections[key]}
              </p>
            </div>
          </div>
        ))}
      </div>

      {content.real_figures && (
        <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50/60 p-5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-800">
              Your Actual Policy Numbers
            </p>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
              From your uploaded illustration
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {content.real_figures.premium !== null && (
              <div className="rounded-lg bg-white px-4 py-2.5 shadow-sm">
                <p className="text-[10px] uppercase tracking-wide text-ink-soft">Premium</p>
                <p className="mt-0.5 font-serif text-lg text-ink">
                  {content.real_figures.currency ?? ""} {content.real_figures.premium.toLocaleString()}
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
                  {content.real_figures.currency ?? ""} {content.real_figures.sum_assured.toLocaleString()}
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
                        Yr {row.year}: {content.real_figures!.currency ?? ""} {row.value.toLocaleString()}
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

      {(content.charts?.before_after?.length || content.charts?.benefit_timeline?.length) ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {content.charts.before_after && content.charts.before_after.length > 0 && (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600">
                Before &amp; After (illustrative)
              </p>
              <div className="mt-4 space-y-3.5">
                {content.charts.before_after.map((bar, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs text-ink/70">
                      <span>{bar.label}</span>
                      <span>
                        {bar.before} <span className="text-neutral-400">→</span>{" "}
                        <span className="font-semibold text-emerald-600">{bar.after}</span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-neutral-200">
                      <div
                        className="h-1.5 rounded-full bg-gold-400"
                        style={{ width: `${Math.min(100, Math.max(0, bar.before))}%` }}
                      />
                    </div>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-neutral-200">
                      <div
                        className="h-1.5 rounded-full bg-emerald-500"
                        style={{ width: `${Math.min(100, Math.max(0, bar.after))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {content.charts.benefit_timeline && content.charts.benefit_timeline.length > 0 && (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600">
                Benefit Timeline (illustrative)
              </p>
              <div className="mt-4 flex h-24 items-end gap-2">
                {content.charts.benefit_timeline.map((point, i) => {
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
        </div>
      ) : null}

      <div className="mt-8 flex items-center justify-between border-t border-neutral-100 pt-6">
        {proposal.status === "draft" ? (
          <ProposalApproveButton proposalId={proposal.id} clientId={proposal.client_id} />
        ) : (
          <p className="text-sm text-ink-soft">Approved and ready to present.</p>
        )}
        <a
          href={`/api/proposals/${proposal.id}/pdf`}
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-ink hover:bg-neutral-50"
        >
          Export PDF
        </a>
      </div>
    </section>
  );
}
