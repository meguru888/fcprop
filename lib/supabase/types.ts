export type ReviewStatus = "unreviewed" | "approved";

export interface Icp {
  id: string;
  user_id: string | null;
  is_default: boolean;
  chat_text: string | null;
  file_urls: string[] | null;
  summary: string | null;
  summary_source: string | null;
  summary_confidence: number | null;
  summary_review_status: ReviewStatus;
  created_at: string;
}

export interface Client {
  id: string;
  user_id: string | null;
  name: string;
  age: number | null;
  email: string | null;
  created_at: string;
}

export interface ClientProfile {
  id: string;
  user_id: string | null;
  client_id: string;
  notes_text: string | null;
  file_urls: string[] | null;
  pain_points: string | null;
  pain_points_source: string | null;
  pain_points_confidence: number | null;
  pain_points_review_status: ReviewStatus;
  created_at: string;
}

export interface BenefitIllustration {
  id: string;
  user_id: string | null;
  client_id: string;
  file_url: string | null;
  product_name: string | null;
  created_at: string;
}

export interface ProductKbDoc {
  id: string;
  user_id: string | null;
  file_url: string | null;
  original_filename: string | null;
  concept_summary: string | null;
  concept_summary_source: string | null;
  concept_summary_confidence: number | null;
  concept_summary_review_status: ReviewStatus;
  embedding: number[] | null;
  created_at: string;
}

export type ProposalStatus = "draft" | "ready" | "exported";

export interface ProposalContent {
  client_name: string;
  client_age: number | null;
  pain_points: string[];
  dreams: string[];
  icp_context: string;
  product_matched: string;
  product_source: string;
  proposal_sections: {
    opening_story: string;
    problem_bridge: string;
    solution_reveal: string;
    benefit_breakdown: string;
    dream_outcome: string;
    call_to_action: string;
  };
  charts?: {
    before_after?: { label: string; before: number; after: number }[];
    benefit_timeline?: { year: number; value: number }[];
  };
}

export interface Proposal {
  id: string;
  user_id: string | null;
  client_id: string;
  status: ProposalStatus;
  content_json: ProposalContent | Record<string, unknown> | null;
  product_used: string | null;
  content_source: string | null;
  content_confidence: number | null;
  content_review_status: ReviewStatus;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  tool_name: string;
  input_ref_id: string | null;
  output_ref_id: string | null;
  triggered_by: string | null;
  status: string | null;
  latency_ms: number | null;
  created_at: string;
}
