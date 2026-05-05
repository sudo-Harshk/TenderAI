import { useEffect, useState } from "react";
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
    if (results.length > 0) {
      refreshAuditLog();
    }
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
    <div className="min-h-screen bg-navy-900 text-white">
      {/* Header */}
      <header className="border-b border-navy-700 bg-navy-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <span className="font-bold text-lg tracking-tight text-white">TenderAI</span>
            <span className="ml-3 text-xs text-slate-500 font-medium tracking-widest uppercase">
              Explainable Evaluation System
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse" />
            Deterministic Core · AI-Assisted Extraction · Human Review
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Panel 1: Upload */}
        <UploadSection
          onTenderUploaded={setTenderFilename}
          onEvaluate={handleEvaluate}
          evaluating={evaluating}
          tenderFilename={tenderFilename}
        />

        {/* Error banner */}
        {error && (
          <div className="bg-red-900/30 border border-red-500/40 text-red-300 rounded-lg px-5 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Panel 2: Results Table */}
        {results.length > 0 && (
          <ResultsTable
            results={results}
            selectedId={selectedBidder?.bidder_id ?? null}
            onSelect={handleSelectBidder}
            onReset={handleReset}
          />
        )}

        {/* Panel 3: Explanation */}
        {selectedBidder && (
          <ExplanationPanel bidder={selectedBidder} onUpdate={handleUpdate} />
        )}

        {/* Panel 4: Decision Log */}
        {auditLog.length > 0 && <DecisionLog entries={auditLog} />}

        {/* Empty state */}
        {results.length === 0 && !evaluating && !error && (
          <div className="text-center py-20 text-slate-600">
            <p className="text-4xl mb-4">📋</p>
            <p className="text-lg font-medium text-slate-500">No evaluations yet</p>
            <p className="text-sm mt-1">Upload a tender document, then add bidders to evaluate</p>
          </div>
        )}
      </main>
    </div>
  );
}
