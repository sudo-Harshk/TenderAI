import type { AuditEntry, DecisionType } from "../types";

interface Props {
  entries: AuditEntry[];
}

function Badge({ decision }: { decision: DecisionType }) {
  if (decision === "PASS")
    return (
      <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-green-500/15 text-green-400">
        PASS
      </span>
    );
  if (decision === "FAIL")
    return (
      <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-red-500/15 text-red-400">
        FAIL
      </span>
    );
  return (
    <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-amber-500/15 text-amber-400">
      REVIEW
    </span>
  );
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function DecisionLog({ entries }: Props) {
  return (
    <div className="bg-navy-800 border border-navy-700 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-navy-700">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Decision Log
          <span className="ml-2 text-slate-500 font-normal normal-case tracking-normal">
            — {entries.length} entries
          </span>
        </h2>
      </div>

      <div className="overflow-x-auto max-h-80 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-navy-800/95 backdrop-blur-sm">
            <tr className="border-b border-navy-700">
              {["Time", "Bidder", "Criterion", "Value", "Confidence", "Decision", "Reviewed By"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {[...entries].reverse().map((entry, i) => (
              <tr
                key={i}
                className="border-b border-navy-700/30 hover:bg-navy-700/20 transition-colors"
              >
                <td className="px-4 py-2.5 text-slate-500 text-xs whitespace-nowrap font-mono">
                  {formatTime(entry.timestamp)}
                </td>
                <td className="px-4 py-2.5 text-slate-300 whitespace-nowrap">
                  {entry.bidder_name}
                </td>
                <td className="px-4 py-2.5 text-slate-400 text-xs whitespace-nowrap">
                  {entry.criterion_label}
                </td>
                <td className="px-4 py-2.5 text-slate-300 whitespace-nowrap">
                  {entry.extracted_value ?? "—"}
                </td>
                <td className="px-4 py-2.5 text-slate-400 text-xs">
                  {(entry.confidence * 100).toFixed(0)}%
                </td>
                <td className="px-4 py-2.5">
                  <Badge decision={entry.decision} />
                </td>
                <td className="px-4 py-2.5 text-slate-400 text-xs">
                  {entry.reviewed_by ? (
                    <span className="text-blue-400">{entry.reviewed_by}</span>
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
