export type DecisionType = "PASS" | "FAIL" | "FLAGGED";

export interface CriterionResult {
  criterion_id: string;
  criterion_label: string;
  extracted_value: number | null;
  extracted_display: string | null;
  required_value: string;
  source_page: string | null;
  confidence: number;
  decision: DecisionType;
  explanation: string;
}

export interface BidderResult {
  bidder_id: string;
  bidder_name: string;
  overall_decision: DecisionType;
  criteria_results: CriterionResult[];
  evaluated_at: string;
}

export interface AuditEntry {
  event_type?: "EXTRACTED" | "REVIEWED" | string;
  timestamp: string;
  bidder_id: string;
  bidder_name: string;
  criterion_id: string;
  criterion_label: string;
  extracted_value: string | null;
  required_value: string;
  source_page: string | null;
  decision: DecisionType;
  confidence: number;
  explanation: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  override_value: string | null;
}
