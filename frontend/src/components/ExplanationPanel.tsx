import { AlertTriangle, CheckCircle, ChevronDown, Flag, Loader2, XCircle } from "lucide-react";
import { useState } from "react";
import { submitReview } from "../api";
import type { BidderResult, CriterionResult, DecisionType } from "../types";

const DECISION_STYLES: Record<DecisionType, { bg: string; text: string; border: string; label: string; cardBg: string; cardBorder: string }> = {
  PASS:    { bg: "#e6f4ea", text: "#137333", border: "#ceead6", label: "PASS",    cardBg: "#f0faf4", cardBorder: "#ceead6" },
  FAIL:    { bg: "#fce8e6", text: "#c5221f", border: "#f5c6c4", label: "FAIL",    cardBg: "#fff8f7", cardBorder: "#f5c6c4" },
  FLAGGED: { bg: "#fef7e0", text: "#b06000", border: "#fde68a", label: "FLAGGED", cardBg: "#fffbf0", cardBorder: "#fde68a" },
};

function DecisionIcon({ decision }: { decision: DecisionType }) {
  if (decision === "PASS") return <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#34a853" }} />;
  if (decision === "FAIL") return <XCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#ea4335" }} />;
  return <Flag className="w-4 h-4 flex-shrink-0" style={{ color: "#fbbc04" }} />;
}

function DecisionBadge({ decision }: { decision: DecisionType }) {
  const s = DECISION_STYLES[decision];
  return (
    <span
      className="px-2.5 py-0.5 rounded-full text-xs font-semibold border flex-shrink-0"
      style={{ backgroundColor: s.bg, color: s.text, borderColor: s.border }}
    >
      {s.label}
    </span>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = value >= 0.9 ? "#34a853" : value >= 0.75 ? "#1a73e8" : value >= 0.5 ? "#fbbc04" : "#ea4335";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#e8eaed" }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-medium w-8 text-right" style={{ color: "#5f6368" }}>{pct}%</span>
    </div>
  );
}

/* ── Officer Verification Section ── */
function VerificationSection({
  cr,
  bidderId,
  onUpdate,
}: {
  cr: CriterionResult;
  bidderId: string;
  onUpdate: (updated: BidderResult) => void;
}) {
  const [action, setAction] = useState<"confirm" | "override">("confirm");
  const [overrideValue, setOverrideValue] = useState("");
  const [officerName, setOfficerName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [selectOpen, setSelectOpen] = useState(false);

  const canSubmit =
    !submitting &&
    !!officerName.trim() &&
    (action === "confirm" || !!overrideValue.trim());

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setErr(null);
    try {
      const confirmedValue =
        action === "confirm" ? (cr.extracted_display ?? "") : overrideValue.trim();
      const updated = await submitReview({
        bidder_id: bidderId,
        criterion_id: cr.criterion_id,
        confirmed_value: confirmedValue,
        reviewer_name: officerName.trim(),
      });
      onUpdate(updated);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setSubmitting(false);
    }
  };

  const overridePlaceholder =
    cr.criterion_id === "C1" ? "e.g. 6.2 Cr" : cr.criterion_id === "C2" ? "Valid" : "e.g. 3";

  return (
    <div
      className="mt-4 pt-4 border-t rounded-b-lg"
      style={{ borderColor: "#fde68a" }}
    >
      {/* Banner */}
      <div className="flex items-start gap-2 mb-4 p-3 rounded-lg" style={{ backgroundColor: "#fef3c7", border: "1px solid #fde68a" }}>
        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#b06000" }} />
        <div>
          <p className="text-xs font-semibold" style={{ color: "#92400e" }}>Officer Verification Required</p>
          <p className="text-xs mt-0.5" style={{ color: "#b06000" }}>
            The system could not extract this value with sufficient confidence. Please review the source document and confirm or correct the extracted value.
          </p>
        </div>
      </div>

      {/* AI result summary */}
      <div className="flex items-center justify-between mb-4 px-1">
        <span className="text-xs font-medium" style={{ color: "#5f6368" }}>AI extracted</span>
        <span className="text-sm font-semibold" style={{ color: "#202124" }}>
          {cr.extracted_display ?? "Not found"}&nbsp;
          <span className="text-xs font-normal" style={{ color: "#9aa0a6" }}>
            ({Math.round(cr.confidence * 100)}% confidence)
          </span>
        </span>
      </div>

      {/* Action selector */}
      <div className="mb-3">
        <label className="text-xs font-medium block mb-1.5" style={{ color: "#5f6368" }}>Your Decision</label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setSelectOpen((v) => !v)}
            className="w-full flex items-center justify-between border rounded-lg px-3 py-2.5 text-sm transition-all duration-150"
            style={{ borderColor: "#dadce0", backgroundColor: "#fff", color: "#202124" }}
          >
            <span>
              {action === "confirm"
                ? `Confirm — extracted value is correct (${cr.extracted_display ?? "Not found"})`
                : "Override — provide the correct value"}
            </span>
            <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: "#5f6368" }} />
          </button>
          {selectOpen && (
            <div
              className="absolute z-10 w-full mt-1 border rounded-lg overflow-hidden text-sm"
              style={{ backgroundColor: "#fff", borderColor: "#dadce0", boxShadow: "0 4px 12px rgba(0,0,0,0.12)" }}
            >
              <button
                type="button"
                className="w-full text-left px-3 py-2.5 hover:bg-[#f8f9fa] transition-colors"
                style={{ color: "#202124" }}
                onClick={() => { setAction("confirm"); setSelectOpen(false); }}
              >
                <span className="font-medium">Confirm</span>
                <span className="text-[#5f6368]"> — extracted value is correct ({cr.extracted_display ?? "Not found"})</span>
              </button>
              <button
                type="button"
                className="w-full text-left px-3 py-2.5 hover:bg-[#f8f9fa] border-t transition-colors"
                style={{ color: "#202124", borderColor: "#f1f3f4" }}
                onClick={() => { setAction("override"); setSelectOpen(false); }}
              >
                <span className="font-medium">Override</span>
                <span className="text-[#5f6368]"> — provide the correct value from the document</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Override value input */}
      {action === "override" && (
        <div className="mb-3">
          <label className="text-xs font-medium block mb-1.5" style={{ color: "#5f6368" }}>Correct Value</label>
          <FocusInput
            value={overrideValue}
            onChange={(e) => setOverrideValue(e.target.value)}
            placeholder={overridePlaceholder}
          />
        </div>
      )}

      {/* Officer name */}
      <div className="mb-3">
        <label className="text-xs font-medium block mb-1.5" style={{ color: "#5f6368" }}>Officer Name</label>
        <FocusInput
          value={officerName}
          onChange={(e) => setOfficerName(e.target.value)}
          placeholder="Enter your name"
        />
      </div>

      {err && <p className="text-xs mb-2" style={{ color: "#c5221f" }}>{err}</p>}

      {/* Submit */}
      <VerifyButton onClick={handleSubmit} disabled={!canSubmit} loading={submitting} />
    </div>
  );
}

/* ── Criterion card ── */
function CriterionCard({
  cr,
  bidderId,
  onUpdate,
}: {
  cr: CriterionResult;
  bidderId: string;
  onUpdate: (updated: BidderResult) => void;
}) {
  const s = DECISION_STYLES[cr.decision];
  return (
    <div
      className="rounded-lg p-5 border"
      style={{ backgroundColor: s.cardBg, borderColor: s.cardBorder }}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <DecisionIcon decision={cr.decision} />
          <span className="font-semibold text-sm text-[#202124]">{cr.criterion_label}</span>
        </div>
        <DecisionBadge decision={cr.decision} />
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm mb-4">
        <DataField label="Extracted" value={cr.extracted_display ?? "Not found"} />
        <DataField label="Required" value={cr.required_value} />
        {cr.source_page && <DataField label="Source" value={cr.source_page} small />}
        <div>
          <span className="text-xs font-medium uppercase tracking-wide block mb-1.5" style={{ color: "#5f6368" }}>
            Confidence
          </span>
          <ConfidenceBar value={cr.confidence} />
        </div>
      </div>

      <p className="text-xs leading-relaxed border-t pt-3" style={{ color: "#5f6368", borderColor: "rgba(0,0,0,0.08)" }}>
        {cr.explanation}
      </p>

      {cr.decision === "FLAGGED" && (
        <VerificationSection cr={cr} bidderId={bidderId} onUpdate={onUpdate} />
      )}
    </div>
  );
}

/* ── Panel ── */
export default function ExplanationPanel({ bidder, onUpdate }: { bidder: BidderResult; onUpdate: (updated: BidderResult) => void }) {
  const s = DECISION_STYLES[bidder.overall_decision];
  const flaggedCount = bidder.criteria_results.filter((c) => c.decision === "FLAGGED").length;

  return (
    <div
      className="bg-white border border-[#dadce0] rounded-lg overflow-hidden"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
    >
      {/* Panel header */}
      <div className="flex items-start justify-between px-6 py-4 border-b border-[#dadce0]">
        <div>
          <h2 className="text-sm font-semibold text-[#202124]">{bidder.bidder_name}</h2>
          <p className="text-xs text-[#5f6368] mt-0.5">
            Evaluated {new Date(bidder.evaluated_at.endsWith("Z") || bidder.evaluated_at.includes("+") ? bidder.evaluated_at : bidder.evaluated_at + "Z").toLocaleString()}
          </p>
          {flaggedCount > 0 && (
            <p className="text-xs mt-1 font-medium flex items-center gap-1" style={{ color: "#b06000" }}>
              <Flag className="w-3 h-3" />
              {flaggedCount} criterion{flaggedCount > 1 ? "a" : ""} require officer verification
            </p>
          )}
        </div>
        <span
          className="px-3 py-1 rounded-full text-xs font-bold border"
          style={{ backgroundColor: s.bg, color: s.text, borderColor: s.border }}
        >
          Overall: {s.label}
        </span>
      </div>

      <div className="p-6 grid gap-4">
        {bidder.criteria_results.map((cr) => (
          <CriterionCard key={cr.criterion_id} cr={cr} bidderId={bidder.bidder_id} onUpdate={onUpdate} />
        ))}
      </div>
    </div>
  );
}

/* ── Helpers ── */
function DataField({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div>
      <span className="text-xs font-medium uppercase tracking-wide block mb-0.5" style={{ color: "#5f6368" }}>{label}</span>
      <div className={small ? "text-xs" : "text-sm font-medium"} style={{ color: small ? "#5f6368" : "#202124" }}>
        {value}
      </div>
    </div>
  );
}

function FocusInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      className="w-full border rounded-lg px-3 py-2 text-sm outline-none transition-all duration-150 placeholder-[#9aa0a6]"
      style={{
        borderColor: focused ? "#fbbc04" : "#dadce0",
        boxShadow: focused ? "0 0 0 3px rgba(251,188,4,0.15)" : "none",
        backgroundColor: "#fff",
        color: "#202124",
      }}
      onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
      onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
    />
  );
}

function VerifyButton({ onClick, disabled, loading }: { onClick: () => void; disabled?: boolean; loading?: boolean }) {
  const [hovered, setHovered] = useState(false);
  const active = !disabled && !loading;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => active && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full font-semibold py-2.5 text-sm flex items-center justify-center gap-2 transition-all duration-150"
      style={{
        borderRadius: "100px",
        backgroundColor: active ? "#f29900" : "#f1f3f4",
        color: active ? "#fff" : "#9aa0a6",
        cursor: active ? "pointer" : "not-allowed",
        transform: hovered && active ? "translateY(-1px)" : "none",
        boxShadow: hovered && active ? "0 4px 10px rgba(242,153,0,0.35)" : "none",
      }}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Submitting…
        </>
      ) : (
        <>
          <CheckCircle className="w-4 h-4" />
          Submit Verification
        </>
      )}
    </button>
  );
}
