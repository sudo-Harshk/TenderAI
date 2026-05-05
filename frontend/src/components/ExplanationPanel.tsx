import { CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { useState } from "react";
import { submitReview } from "../api";
import type { BidderResult, CriterionResult, DecisionType } from "../types";

interface Props {
  bidder: BidderResult;
  onUpdate: (updated: BidderResult) => void;
}

function DecisionIcon({ decision }: { decision: DecisionType }) {
  if (decision === "PASS") return <CheckCircle className="w-4 h-4 text-green-400" />;
  if (decision === "FAIL") return <XCircle className="w-4 h-4 text-red-400" />;
  return <AlertTriangle className="w-4 h-4 text-amber-400" />;
}

function DecisionBadge({ decision }: { decision: DecisionType }) {
  if (decision === "PASS")
    return (
      <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-500/15 text-green-400 border border-green-500/30">
        PASS
      </span>
    );
  if (decision === "FAIL")
    return (
      <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30">
        FAIL
      </span>
    );
  return (
    <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
      NEEDS REVIEW
    </span>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color =
    value >= 0.9 ? "bg-green-500" : value >= 0.75 ? "bg-blue-500" : value >= 0.5 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-navy-700 rounded-full h-1.5 overflow-hidden">
        <div className={`${color} h-full rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-400 w-8 text-right">{pct}%</span>
    </div>
  );
}

function CriterionRow({
  cr,
  bidderId,
  onUpdate,
}: {
  cr: CriterionResult;
  bidderId: string;
  onUpdate: (updated: BidderResult) => void;
}) {
  const [confirmedValue, setConfirmedValue] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!confirmedValue.trim() || !reviewerName.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const updated = await submitReview({
        bidder_id: bidderId,
        criterion_id: cr.criterion_id,
        confirmed_value: confirmedValue.trim(),
        reviewer_name: reviewerName.trim(),
      });
      onUpdate(updated);
      setConfirmedValue("");
      setReviewerName("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Review failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`rounded-lg p-4 border ${
        cr.decision === "NEEDS REVIEW"
          ? "border-amber-500/30 bg-amber-500/5"
          : cr.decision === "PASS"
          ? "border-green-500/20 bg-green-500/5"
          : "border-red-500/20 bg-red-500/5"
      }`}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2">
          <DecisionIcon decision={cr.decision} />
          <span className="font-semibold text-sm text-white">{cr.criterion_label}</span>
        </div>
        <DecisionBadge decision={cr.decision} />
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mb-3">
        <div>
          <span className="text-slate-500 text-xs">Extracted</span>
          <div className="text-slate-200 mt-0.5">{cr.extracted_display ?? "Not found"}</div>
        </div>
        <div>
          <span className="text-slate-500 text-xs">Required</span>
          <div className="text-slate-200 mt-0.5">{cr.required_value}</div>
        </div>
        {cr.source_page && (
          <div>
            <span className="text-slate-500 text-xs">Source</span>
            <div className="text-slate-400 mt-0.5 text-xs">{cr.source_page}</div>
          </div>
        )}
        <div>
          <span className="text-slate-500 text-xs">Confidence</span>
          <div className="mt-1">
            <ConfidenceBar value={cr.confidence} />
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed border-t border-white/5 pt-3">
        {cr.explanation}
      </p>

      {cr.decision === "NEEDS REVIEW" && (
        <div className="mt-4 pt-4 border-t border-amber-500/20">
          <p className="text-xs font-semibold text-amber-400 mb-3 uppercase tracking-wider">
            Human Review Required
          </p>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder={
                cr.criterion_id === "C1"
                  ? "e.g. 6.2 Cr"
                  : cr.criterion_id === "C2"
                  ? "e.g. Valid"
                  : "e.g. 3"
              }
              value={confirmedValue}
              onChange={(e) => setConfirmedValue(e.target.value)}
              className="bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
            />
            <input
              type="text"
              placeholder="Reviewer name"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              className="bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={submitting || !confirmedValue.trim() || !reviewerName.trim()}
            className="mt-3 w-full bg-amber-600 hover:bg-amber-500 disabled:bg-navy-700 disabled:text-slate-500 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting…
              </>
            ) : (
              "Submit Review"
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default function ExplanationPanel({ bidder, onUpdate }: Props) {
  return (
    <div className="bg-navy-800 border border-navy-700 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-navy-700">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Explanation — {bidder.bidder_name}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluated {new Date(bidder.evaluated_at).toLocaleString()}
          </p>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-xs font-bold border ${
            bidder.overall_decision === "PASS"
              ? "bg-green-500/15 text-green-400 border-green-500/30"
              : bidder.overall_decision === "FAIL"
              ? "bg-red-500/15 text-red-400 border-red-500/30"
              : "bg-amber-500/15 text-amber-400 border-amber-500/30"
          }`}
        >
          Overall: {bidder.overall_decision}
        </div>
      </div>

      <div className="p-6 grid gap-4">
        {bidder.criteria_results.map((cr) => (
          <CriterionRow key={cr.criterion_id} cr={cr} bidderId={bidder.bidder_id} onUpdate={onUpdate} />
        ))}
      </div>
    </div>
  );
}
