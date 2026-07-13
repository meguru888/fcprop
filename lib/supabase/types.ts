export type ReviewStatus = "unreviewed" | "approved";

export interface FcProfile {
  id: string;
  user_id: string | null;
  name: string | null;
  company_name: string | null;
  title_credentials: string | null;
  email: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

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

export type ExtractionStatus = "ok" | "partial" | "no_text_layer" | "unsupported_format" | "failed";

export interface BenefitIllustrationScenario {
  label: string;
  rows: { year: number; value: number }[];
}

export interface BenefitIllustrationExtractedData {
  currency: string | null;
  premium: number | null;
  premium_term_years: number | null;
  sum_assured: number | null;
  scenarios: BenefitIllustrationScenario[];
}

export interface BenefitIllustration {
  id: string;
  user_id: string | null;
  client_id: string;
  file_url: string | null;
  product_name: string | null;
  extracted_data: BenefitIllustrationExtractedData | null;
  extraction_status: ExtractionStatus | null;
  extraction_notes: string | null;
  extraction_source: string | null;
  extraction_confidence: number | null;
  extraction_review_status: ReviewStatus;
  created_at: string;
}

export type KbDocType = "benefit_illustration" | "product_brochure" | "product_related_document" | "other";

export interface ProductKbDoc {
  id: string;
  user_id: string | null;
  file_url: string | null;
  original_filename: string | null;
  concept_summary: string | null;
  concept_summary_source: string | null;
  concept_summary_confidence: number | null;
  concept_summary_review_status: ReviewStatus;
  doc_type: KbDocType | null;
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
  /**
   * Concrete risk-trigger events (e.g. critical illness, disability, death) tagged with the
   * client's age and a quantified dollar cost, grounded only in real figures from their data
   * (never invented) — same sourcing discipline as problem_bridge. Used to build the age-journey
   * timeline's "before" (cost of inaction) row.
   */
  risk_events?: { age: number; event: string; cost: number }[];
  /**
   * Real figures copied verbatim from the client's benefit illustration extraction —
   * never LLM-generated or estimated. Present only when extraction succeeded (fully or
   * partially); absent/null means no real policy numbers are available to show.
   */
  real_figures?: (BenefitIllustrationExtractedData & { extraction_status: ExtractionStatus }) | null;
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
