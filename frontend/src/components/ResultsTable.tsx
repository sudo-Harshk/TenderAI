import { Flag, RotateCcw } from "lucide-react";
import { useState } from "react";
import type { BidderResult, CriterionResult, DecisionType } from "../types";

interface Props {
  results: BidderResult[];
  selectedId: string | null;
  onSelect: (result: BidderResult) => void;
  onReset: () => void;
}

function DecisionBadge({ decision }: { decision: DecisionType }) {
  const styles: Record<DecisionType, { bg: string; text: string; border: string; label: string }> = {
    PASS:    { bg: "#e6f4ea", text: "#137333", border: "#ceead6", label: "PASS" },
    FAIL:    { bg: "#fce8e6", text: "#c5221f", border: "#f5c6c4", label: "FAIL" },
    FLAGGED: { bg: "#fef7e0", text: "#b06000", border: "#fde68a", label: "FLAGGED" },
  };
  const s = styles[decision];
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border"
      style={{ backgroundColor: s.bg, color: s.text, borderColor: s.border }}
    >
      {s.label}
    </span>
  );
}

function CriterionCell({ cr }: { cr?: CriterionResult }) {
  return (
    <div className="flex flex-col gap-1.5 items-start">
      <span className="text-sm text-[#202124] font-medium">{cr?.extracted_display ?? "—"}</span>
      <DecisionBadge decision={cr?.decision ?? "FLAGGED"} />
    </div>
  );
}

export default function ResultsTable({ results, selectedId, onSelect, onReset }: Props) {
  const [resetHovered, setResetHovered] = useState(false);
  const flaggedCount = results.filter((r) => r.overall_decision === "FLAGGED").length;

  return (
    <div
      className="bg-white border border-[#dadce0] rounded-lg overflow-hidden"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#dadce0]">
        <div>
          <h2 className="text-sm font-semibold text-[#202124]">Evaluation Results</h2>
          <p className="text-xs text-[#5f6368] mt-0.5">
            {results.length} bidder{results.length !== 1 ? "s" : ""} evaluated
            {flaggedCount > 0 && (
              <span className="ml-2 font-medium" style={{ color: "#b06000" }}>
                · {flaggedCount} require{flaggedCount === 1 ? "s" : ""} verification
              </span>
            )}
          </p>
        </div>
        <button
          onClick={onReset}
          onMouseEnter={() => setResetHovered(true)}
          onMouseLeave={() => setResetHovered(false)}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-150"
          style={{
            color: resetHovered ? "#c5221f" : "#5f6368",
            backgroundColor: resetHovered ? "#fce8e6" : "transparent",
          }}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#dadce0]" style={{ backgroundColor: "#f8f9fa" }}>
              {["Bidder", "Turnover (≥₹5Cr)", "GST Valid", "Projects (≥2)", "Overall"].map((h) => (
                <th
                  key={h}
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#5f6368" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((r) => {
              const turnover = r.criteria_results.find((c) => c.criterion_id === "C1");
              const gst = r.criteria_results.find((c) => c.criterion_id === "C2");
              const projects = r.criteria_results.find((c) => c.criterion_id === "C3");
              return (
                <ResultRow
                  key={r.bidder_id}
                  r={r}
                  turnover={turnover}
                  gst={gst}
                  projects={projects}
                  isSelected={r.bidder_id === selectedId}
                  onSelect={onSelect}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ResultRow({
  r, turnover, gst, projects, isSelected, onSelect,
}: {
  r: BidderResult;
  turnover?: CriterionResult;
  gst?: CriterionResult;
  projects?: CriterionResult;
  isSelected: boolean;
  onSelect: (r: BidderResult) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const isFlagged = r.overall_decision === "FLAGGED";

  const accentLeft = isSelected ? "#1a73e8" : isFlagged ? "#fbbc04" : "transparent";
  const bg = isSelected ? "#e8f0fe" : hovered ? "#f8f9fa" : "transparent";

  return (
    <tr
      onClick={() => onSelect(r)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="border-b border-[#f1f3f4] cursor-pointer transition-colors duration-100"
      style={{ backgroundColor: bg, borderLeft: `3px solid ${accentLeft}` }}
    >
      <td className="px-6 py-4" style={{ paddingLeft: isSelected || isFlagged ? "21px" : "24px" }}>
        <div className="font-semibold text-[#202124] text-sm">{r.bidder_name}</div>
        <div className="text-xs text-[#9aa0a6] mt-0.5 font-mono">{r.bidder_id}</div>
      </td>
      <td className="px-6 py-4"><CriterionCell cr={turnover} /></td>
      <td className="px-6 py-4"><CriterionCell cr={gst} /></td>
      <td className="px-6 py-4"><CriterionCell cr={projects} /></td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <DecisionBadge decision={r.overall_decision} />
          {isFlagged && (
            <span
              className="flex items-center gap-1 text-xs font-medium"
              style={{ color: "#b06000" }}
            >
              <Flag className="w-3 h-3" />
              Verify
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}
