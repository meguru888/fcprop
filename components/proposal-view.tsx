import type { Proposal, ProposalContent } from "@/lib/supabase/types";

const SECTIONS: { key: keyof ProposalContent["proposal_sections"]; label: string; accent: string }[] = [
  { key: "opening_story", label: "Opening Story", accent: "border-indigo-300 bg-indigo-50" },
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
    </section>
  );
}
