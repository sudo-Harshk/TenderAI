import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { evaluateBidder, getAuditLog, resetDemo } from "./api";
import DecisionLog from "./components/DecisionLog";
import ExplanationPanel from "./components/ExplanationPanel";
import ResultsTable from "./components/ResultsTable";
import UploadSection from "./components/UploadSection";
import type { AuditEntry, BidderResult } from "./types";

export default function App() {
  const [tenderFilename, setTenderFilename] = useState<string | null>(null);
  const [results, setResults] = useState<BidderResult[]>([]);
  const [selectedBidder, setSelectedBidder] = useState<BidderResult | null>(null);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshAuditLog = async () => {
    try {
      const log = await getAuditLog();
      setAuditLog(log);
    } catch {
      // non-critical
    }
  };

  useEffect(() => {
    if (results.length > 0) refreshAuditLog();
  }, [results]);

  const handleEvaluate = async (file: File, bidderName: string) => {
    setEvaluating(true);
    setError(null);
    try {
      const result = await evaluateBidder(file, bidderName);
      setResults((prev) => {
        const idx = prev.findIndex((r) => r.bidder_id === result.bidder_id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = result;
          return next;
        }
        return [...prev, result];
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Evaluation failed. Is the backend running?");
    } finally {
      setEvaluating(false);
    }
  };

  const handleUpdate = (updated: BidderResult) => {
    setResults((prev) => prev.map((r) => (r.bidder_id === updated.bidder_id ? updated : r)));
    setSelectedBidder(updated);
    refreshAuditLog();
  };

  const handleReset = async () => {
    try {
      await resetDemo();
    } catch {
      // ignore
    }
    setResults([]);
    setSelectedBidder(null);
    setAuditLog([]);
    setTenderFilename(null);
    setError(null);
  };

  const handleSelectBidder = (r: BidderResult) => {
    setSelectedBidder((prev) => (prev?.bidder_id === r.bidder_id ? null : r));
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#202124]">
      {/* ── Navbar ── */}
      <header
        className="bg-white sticky top-0 z-10 border-b border-[#dadce0]"
        style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.06)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            aria-label="Go to home"
            className="flex items-center gap-3 rounded-md focus:outline-none focus:ring-4 focus:ring-[rgba(26,115,232,0.16)]"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "#1a73e8" }}
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <span className="font-bold text-[17px] tracking-tight text-[#202124]">TenderAI</span>
            <span className="hidden sm:inline text-xs text-[#5f6368] border-l border-[#dadce0] pl-3 ml-1">
              Explainable Evaluation System
            </span>
          </Link>

          {/* Status pill */}
          <div
            className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full"
            style={{ backgroundColor: "#e6f4ea", color: "#137333" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#34a853] animate-pulse inline-block" />
            <span className="hidden sm:inline">Deterministic Core · AI-Assisted</span>
            <span className="sm:hidden">Online</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Upload */}
        <div className="animate-fade-slide-up">
          <UploadSection
            onTenderUploaded={setTenderFilename}
            onEvaluate={handleEvaluate}
            evaluating={evaluating}
            tenderFilename={tenderFilename}
          />
        </div>

        {/* Evaluation progress */}
        {evaluating && (
          <div
            className="animate-fade-in bg-white border border-[#dadce0] rounded-lg px-6 py-5"
            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-5 h-5 border-2 border-[#1a73e8] border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <span className="text-sm font-semibold text-[#202124]">Evaluating bidder…</span>
            </div>
            <div className="space-y-3">
              {[
                { label: "Parsing PDF and extracting text", done: true },
                { label: "Analysing turnover, GST & project criteria", done: true },
                { label: "Applying evaluation rules", done: false },
                { label: "Generating decision report", done: false },
              ].map(({ label, done }, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="relative w-4 h-4 flex-shrink-0">
                    {done ? (
                      <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                        <circle cx="8" cy="8" r="8" fill="#e6f4ea" />
                        <path d="M4.5 8l2.5 2.5 4-4" stroke="#34a853" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <div className="w-4 h-4 rounded-full skeleton" />
                    )}
                  </div>
                  <span className="text-sm" style={{ color: done ? "#5f6368" : "#202124" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div
            className="animate-fade-in flex items-start gap-3 rounded-lg px-5 py-3 text-sm border"
            style={{
              backgroundColor: "#fce8e6",
              borderColor: "rgba(217,48,37,0.2)",
              color: "#c5221f",
            }}
          >
            <svg
              className="flex-shrink-0 mt-0.5"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            {error}
          </div>
        )}

        {/* Results table */}
        {results.length > 0 && (
          <div className="animate-fade-slide-up stagger-1">
            <ResultsTable
              results={results}
              selectedId={selectedBidder?.bidder_id ?? null}
              onSelect={handleSelectBidder}
              onReset={handleReset}
            />
          </div>
        )}

        {/* Explanation panel */}
        {selectedBidder && (
          <div className="animate-fade-slide-up stagger-2">
            <ExplanationPanel bidder={selectedBidder} onUpdate={handleUpdate} />
          </div>
        )}

        {/* Audit log */}
        {auditLog.length > 0 && (
          <div className="animate-fade-slide-up stagger-3">
            <DecisionLog entries={auditLog} />
          </div>
        )}

        {/* Empty state */}
        {results.length === 0 && !evaluating && !error && (
          <div className="text-center py-24 animate-fade-in">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ backgroundColor: "#e8f0fe" }}
            >
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1a73e8"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-[#202124]">No evaluations yet</p>
            <p className="text-sm mt-1 text-[#5f6368] max-w-xs mx-auto">
              Upload a tender document above, then add bidders to begin AI-assisted evaluation
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
