import { CheckCircle, FileText, Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";

interface Props {
  onTenderUploaded: (filename: string) => void;
  onEvaluate: (file: File, bidderName: string) => Promise<void>;
  evaluating: boolean;
  tenderFilename: string | null;
}

export default function UploadSection({
  onTenderUploaded,
  onEvaluate,
  evaluating,
  tenderFilename,
}: Props) {
  const tenderRef = useRef<HTMLInputElement>(null);
  const bidderRef = useRef<HTMLInputElement>(null);
  const [bidderName, setBidderName] = useState("");
  const [bidderFile, setBidderFile] = useState<File | null>(null);
  const [tenderLoading, setTenderLoading] = useState(false);

  const handleTenderChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTenderLoading(true);
    try {
      const { uploadTender } = await import("../api");
      await uploadTender(file);
      onTenderUploaded(file.name);
    } catch {
      onTenderUploaded(file.name); // still mark uploaded for demo
    } finally {
      setTenderLoading(false);
    }
  };

  const handleEvaluate = async () => {
    if (!bidderFile || !bidderName.trim()) return;
    await onEvaluate(bidderFile, bidderName.trim());
    setBidderFile(null);
    setBidderName("");
    if (bidderRef.current) bidderRef.current.value = "";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Tender Upload */}
      <div className="bg-navy-800 border border-navy-700 rounded-xl p-6">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
          Step 1 — Tender Document
        </h2>
        <button
          onClick={() => tenderRef.current?.click()}
          disabled={tenderLoading}
          className="w-full border-2 border-dashed border-navy-600 hover:border-slate-500 rounded-lg p-8 flex flex-col items-center gap-3 transition-colors cursor-pointer disabled:opacity-50"
        >
          {tenderLoading ? (
            <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
          ) : tenderFilename ? (
            <CheckCircle className="w-8 h-8 text-green-500" />
          ) : (
            <Upload className="w-8 h-8 text-slate-500" />
          )}
          <span className="text-sm text-slate-400">
            {tenderLoading
              ? "Uploading…"
              : tenderFilename
              ? tenderFilename
              : "Click to upload Tender PDF"}
          </span>
        </button>
        <input
          ref={tenderRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleTenderChange}
        />
        {tenderFilename && (
          <p className="mt-3 text-xs text-slate-500">
            Criteria pre-configured: Turnover ≥ ₹5 Cr · GST Valid · Projects ≥ 2
          </p>
        )}
      </div>

      {/* Bidder Evaluate */}
      <div className="bg-navy-800 border border-navy-700 rounded-xl p-6">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
          Step 2 — Evaluate Bidder
        </h2>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Bidder / Company Name"
            value={bidderName}
            onChange={(e) => setBidderName(e.target.value)}
            className="w-full bg-navy-900 border border-navy-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button
            onClick={() => bidderRef.current?.click()}
            className="w-full border-2 border-dashed border-navy-600 hover:border-slate-500 rounded-lg p-5 flex items-center gap-3 transition-colors cursor-pointer"
          >
            <FileText className="w-5 h-5 text-slate-500 flex-shrink-0" />
            <span className="text-sm text-slate-400 truncate">
              {bidderFile ? bidderFile.name : "Upload Bidder Document (PDF)"}
            </span>
          </button>
          <input
            ref={bidderRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => setBidderFile(e.target.files?.[0] ?? null)}
          />
          <button
            onClick={handleEvaluate}
            disabled={evaluating || !bidderFile || !bidderName.trim()}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-navy-700 disabled:text-slate-500 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
          >
            {evaluating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Evaluating…
              </>
            ) : (
              "Run Evaluation"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
