import type { Proposal, ProposalContent } from "@/lib/supabase/types";
import { ProposalApproveButton } from "@/components/proposal-approve-button";

const SECTIONS: { key: keyof ProposalContent["proposal_sections"]; label: string; accent: string }[] = [
  { key: "opening_story", label: "Your Life's Journey", accent: "border-indigo-300 bg-indigo-50" },
  { key: "problem_bridge", label: "The Challenge", accent: "border-amber-300 bg-amber-50" },
  { key: "solution_reveal", label: "The Solution", accent: "border-emerald-300 bg-emerald-50" },
  { key: "benefit_breakdown", label: "What You Get", accent: "border-sky-300 bg-sky-50" },
  { key: "dream_outcome", label: "Your Future", accent: "border-fuchsia-300 bg-fuchsia-50" },
  { key: "call_to_action", label: "Next Step", accent: "border-neutral-800 bg-neutral-900 text-white" },
];

export function ProposalView({
  proposal,
  content,
}: {
  proposal: Proposal;
  content: ProposalContent;
}) {
  return (
    <section className="rounded-xl border border-neutral-200 p-6 space-y-5" id="proposal-view">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Proposal for {content.client_name}
          </p>
          <p className="mt-1 text-lg font-bold text-neutral-900">{content.product_matched}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            proposal.status === "ready"
              ? "bg-emerald-100 text-emerald-700"
              : proposal.status === "exported"
                ? "bg-neutral-200 text-neutral-700"
                : "bg-amber-100 text-amber-700"
          }`}
        >
          {proposal.status}
        </span>
      </div>

      {content.pain_points.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {content.pain_points.map((p, i) => (
            <span
              key={i}
              className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-700"
            >
              {p}
            </span>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {SECTIONS.map(({ key, label, accent }) => (
          <div key={key} className={`rounded-lg border p-4 ${accent}`}>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
            <p className="mt-2 text-sm leading-relaxed">{content.proposal_sections[key]}</p>
          </div>
        ))}
      </div>

      {content.real_figures && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
              Your Actual Policy Numbers
            </p>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
              From your uploaded illustration
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-neutral-700">
            {content.real_figures.premium !== null && (
              <span>
                Premium: <span className="font-medium">{content.real_figures.currency ?? ""} {content.real_figures.premium.toLocaleString()}</span>
                {content.real_figures.premium_term_years !== null && ` / yr for ${content.real_figures.premium_term_years} yrs`}
              </span>
            )}
            {content.real_figures.sum_assured !== null && (
              <span>
                Sum Assured: <span className="font-medium">{content.real_figures.currency ?? ""} {content.real_figures.sum_assured.toLocaleString()}</span>
              </span>
            )}
          </div>

          {content.real_figures.scenarios.length > 0 && (
            <div className="mt-3 space-y-3">
              {content.real_figures.scenarios.map((scenario, i) => (
                <div key={i}>
                  <p className="text-xs font-medium text-neutral-600">{scenario.label}</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {scenario.rows.map((row, j) => (
                      <span key={j} className="rounded bg-white px-2 py-1 text-xs text-neutral-700 border border-emerald-100">
                        Yr {row.year}: {content.real_figures!.currency ?? ""} {row.value.toLocaleString()}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {content.real_figures.extraction_status === "partial" && (
            <p className="mt-3 text-xs text-amber-700">
              Some figures weren&apos;t found in the uploaded document — please double-check the original illustration for anything not shown here.
            </p>
          )}
        </div>
      )}

      {(content.charts?.before_after?.length || content.charts?.benefit_timeline?.length) ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {content.charts.before_after && content.charts.before_after.length > 0 && (
            <div className="rounded-lg border border-neutral-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Before &amp; After (illustrative)
              </p>
              <div className="mt-3 space-y-3">
                {content.charts.before_after.map((bar, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs text-neutral-600">
                      <span>{bar.label}</span>
                      <span>
                        {bar.before} <span className="text-neutral-400">→</span>{" "}
                        <span className="font-medium text-emerald-600">{bar.after}</span>
                      </span>
                    </div>
                    <div className="mt-1 h-2 w-full rounded-full bg-neutral-100">
                      <div
                        className="h-2 rounded-full bg-amber-400"
                        style={{ width: `${Math.min(100, Math.max(0, bar.before))}%` }}
                      />
                    </div>
                    <div className="mt-1 h-2 w-full rounded-full bg-neutral-100">
                      <div
                        className="h-2 rounded-full bg-emerald-500"
                        style={{ width: `${Math.min(100, Math.max(0, bar.after))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {content.charts.benefit_timeline && content.charts.benefit_timeline.length > 0 && (
            <div className="rounded-lg border border-neutral-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Benefit Timeline (illustrative)
              </p>
              <div className="mt-3 flex h-24 items-end gap-2">
                {content.charts.benefit_timeline.map((point, i) => {
                  const pct = Math.min(100, Math.max(4, point.value));
                  return (
                    <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                      <div
                        className="w-full rounded-t bg-emerald-500"
                        style={{ height: `${Math.round((pct / 100) * 80)}px` }}
                      />
                      <span className="text-[10px] text-neutral-500">Yr {point.year}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : null}

      <div className="flex items-center justify-between border-t border-neutral-200 pt-4">
        {proposal.status === "draft" ? (
          <ProposalApproveButton proposalId={proposal.id} clientId={proposal.client_id} />
        ) : (
          <p className="text-sm text-neutral-500">Approved and ready to present.</p>
        )}
        <a
          href={`/api/proposals/${proposal.id}/pdf`}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Export PDF
        </a>
      </div>
    </section>
  );
}
