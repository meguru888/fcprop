import type { Proposal, ProposalContent } from "@/lib/supabase/types";

export function extractContent(proposal: Proposal): ProposalContent | null {
  if (!proposal.content_json) return null;
  return proposal.content_json as ProposalContent;
}
