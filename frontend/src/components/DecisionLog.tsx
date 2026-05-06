import { CheckCircle, Flag, Shield, XCircle } from "lucide-react";
import type { AuditEntry, DecisionType } from "../types";

interface Props {
  entries: AuditEntry[];
}

function DecisionIcon({ decision }: { decision: DecisionType }) {
  if (decision === "PASS")    return <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#34a853" }} />;
  if (decision === "FAIL")    return <XCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#ea4335" }} />;
  return <Flag className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#fbbc04" }} />;
}

const BADGE: Record<DecisionType, { bg: string; text: string; label: string }> = {
  PASS:    { bg: "#e6f4ea", text: "#137333", label: "Pass" },
  FAIL:    { bg: "#fce8e6", text: "#c5221f", label: "Fail" },
  FLAGGED: { bg: "#fef7e0", text: "#b06000", label: "Flagged" },
};

function parseUtc(iso: string) {
  // Backend returns naive UTC strings without 'Z'; append it so the browser converts to local time correctly
  return new Date(iso.endsWith("Z") || iso.includes("+") ? iso : iso + "Z");
}

function formatDateTime(iso: string) {
  const d = parseUtc(iso);
  return {
    date: d.toLocaleDateString([], { month: "short", day: "numeric" }),
    time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
}

export default function DecisionLog({ entries }: Props) {
  const sorted = [...entries].reverse();
  const passCount = entries.filter((e) => e.decision === "PASS").length;
  const failCount = entries.filter((e) => e.decision === "FAIL").length;
  const flagCount = entries.filter((e) => e.decision === "FLAGGED").length;

  return (
    <div
      className="bg-white border border-[#dadce0] rounded-lg overflow-hidden"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-6 py-4 border-b border-[#dadce0]">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" style={{ color: "#1a73e8" }} />
            <h2 className="text-sm font-semibold text-[#202124]">Audit Trail</h2>
          </div>
          <p className="text-xs text-[#5f6368] mt-0.5">Immutable record of all evaluation decisions</p>
        </div>
        {/* Summary pills */}
        <div className="flex items-center gap-2">
          <Pill count={passCount} label="Pass" bg="#e6f4ea" text="#137333" />
          <Pill count={failCount} label="Fail" bg="#fce8e6" text="#c5221f" />
          {flagCount > 0 && <Pill count={flagCount} label="Flagged" bg="#fef7e0" text="#b06000" />}
        </div>
      </div>

      {/* Entry list */}
      <div className="divide-y divide-[#f1f3f4] max-h-80 overflow-y-auto">
        {sorted.map((entry, i) => {
          const { date, time } = formatDateTime(entry.timestamp);
          const b = BADGE[entry.decision];
          return (
            <div
              key={i}
              className="flex items-center gap-4 px-6 py-3 hover:bg-[#f8f9fa] transition-colors duration-100"
            >
              {/* Time */}
              <div className="flex-shrink-0 text-right w-16">
                <div className="text-xs font-mono font-medium" style={{ color: "#202124" }}>{time}</div>
                <div className="text-xs" style={{ color: "#9aa0a6" }}>{date}</div>
              </div>

              {/* Divider dot */}
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: "#dadce0" }} />

              {/* Main content */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[#202124] truncate">{entry.bidder_name}</div>
                <div className="text-xs text-[#5f6368] truncate">{entry.criterion_label}</div>
              </div>

              {/* Extracted value */}
              <div className="text-sm font-medium flex-shrink-0" style={{ color: "#202124" }}>
                {entry.extracted_value ?? "—"}
              </div>

              {/* Decision badge */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <DecisionIcon decision={entry.decision} />
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: b.bg, color: b.text }}
                >
                  {b.label}
                </span>
              </div>

              {/* Verified by */}
              <div className="flex-shrink-0 w-24 text-right">
                {entry.reviewed_by ? (
                  <span className="text-xs font-medium" style={{ color: "#1a73e8" }}>
                    {entry.reviewed_by}
                  </span>
                ) : (
                  <span className="text-xs" style={{ color: "#dadce0" }}>—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer legend */}
      <div
        className="px-6 py-2.5 border-t flex items-center gap-1.5 text-xs"
        style={{ borderColor: "#f1f3f4", color: "#9aa0a6", backgroundColor: "#fafafa" }}
      >
        <Shield className="w-3 h-3" />
        {entries.length} entr{entries.length === 1 ? "y" : "ies"} · append-only log
      </div>
    </div>
  );
}

function Pill({ count, label, bg, text }: { count: number; label: string; bg: string; text: string }) {
  if (count === 0) return null;
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: bg, color: text }}>
      {count} {label}
    </span>
  );
}
