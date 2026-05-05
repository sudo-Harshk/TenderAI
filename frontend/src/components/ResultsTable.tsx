import { RotateCcw } from "lucide-react";
import type { BidderResult, CriterionResult, DecisionType } from "../types";

interface Props {
  results: BidderResult[];
  selectedId: string | null;
  onSelect: (result: BidderResult) => void;
  onReset: () => void;
}

function DecisionBadge({ decision }: { decision: DecisionType }) {
  if (decision === "PASS")
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-500/15 text-green-400 border border-green-500/30">
        PASS
      </span>
    );
  if (decision === "FAIL")
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30">
        FAIL
      </span>
    );
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
      REVIEW
    </span>
  );
}

function CriterionCell({ cr }: { cr: CriterionResult }) {
  return (
    <div className="flex flex-col gap-1 items-start">
      <span className="text-sm text-slate-300">{cr.extracted_display ?? "—"}</span>
      <DecisionBadge decision={cr.decision} />
    </div>
  );
}

export default function ResultsTable({ results, selectedId, onSelect, onReset }: Props) {
  return (
    <div className="bg-navy-800 border border-navy-700 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-navy-700">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Evaluation Results
          <span className="ml-2 text-slate-500 normal-case font-normal tracking-normal text-xs">
            — click a row for details
          </span>
        </h2>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Demo
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-navy-700 text-left">
              {["Bidder", "Turnover (≥₹5Cr)", "GST Valid", "Projects (≥2)", "Overall"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {results.map((r) => {
              const [turnover, gst, projects] = r.criteria_results;
              const isSelected = r.bidder_id === selectedId;
              return (
                <tr
                  key={r.bidder_id}
                  onClick={() => onSelect(r)}
                  className={`border-b border-navy-700/50 cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-blue-600/10 border-l-2 border-l-blue-500"
                      : "hover:bg-navy-700/40"
                  } ${r.overall_decision === "NEEDS REVIEW" ? "border-l-2 border-l-amber-500/60" : ""}`}
                >
                  <td className="px-6 py-4">
                    <div className="font-semibold text-white text-sm">{r.bidder_name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">ID: {r.bidder_id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <CriterionCell cr={turnover} />
                  </td>
                  <td className="px-6 py-4">
                    <CriterionCell cr={gst} />
                  </td>
                  <td className="px-6 py-4">
                    <CriterionCell cr={projects} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <DecisionBadge decision={r.overall_decision} />
                      {r.overall_decision === "NEEDS REVIEW" && (
                        <span className="text-xs text-amber-400 font-medium">↗ Review</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
