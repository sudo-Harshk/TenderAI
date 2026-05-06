import { CheckCircle, FileText, Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";

interface Props {
  onTenderUploaded: (filename: string) => void;
  onEvaluate: (file: File, bidderName: string) => Promise<void>;
  evaluating: boolean;
  tenderFilename: string | null;
}

export default function UploadSection({ onTenderUploaded, onEvaluate, evaluating, tenderFilename }: Props) {
  const tenderRef = useRef<HTMLInputElement>(null);
  const bidderRef = useRef<HTMLInputElement>(null);
  const [bidderFile, setBidderFile] = useState<File | null>(null);
  const [tenderLoading, setTenderLoading] = useState(false);
  const [tenderError, setTenderError] = useState<string | null>(null);

  const handleTenderChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTenderError(null);
    setTenderLoading(true);
    try {
      const { uploadTender } = await import("../api");
      await uploadTender(file);
      onTenderUploaded(file.name);
    } catch (error) {
      console.error(error);
      setTenderError("Could not connect to backend. Is the server running on port 8000?");
      setTenderLoading(false);
      return;
    } finally {
      setTenderLoading(false);
    }
  };

  const handleEvaluate = async () => {
    if (!bidderFile) return;
    await onEvaluate(bidderFile, "");
    setBidderFile(null);
    if (bidderRef.current) bidderRef.current.value = "";
  };

  const canEvaluate = !evaluating && !!bidderFile;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* ── Step 1: Tender ── */}
      <div
        className="bg-white rounded-lg border border-[#dadce0] p-6"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
      >
        <div className="flex items-center gap-2 mb-1">
          <span
            className="w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold flex-shrink-0"
            style={{ backgroundColor: "#1a73e8" }}
          >
            1
          </span>
          <h2 className="text-sm font-semibold text-[#202124]">Tender Document</h2>
        </div>
        <p className="text-xs text-[#5f6368] mb-4 ml-7">Upload the government tender specification PDF</p>

        <DropZone
          onClick={() => tenderRef.current?.click()}
          disabled={tenderLoading}
          active={!!tenderFilename}
          activeColor="green"
        >
          {tenderLoading ? (
            <Loader2 className="w-7 h-7 text-[#1a73e8] animate-spin" />
          ) : tenderFilename ? (
            <CheckCircle className="w-7 h-7" style={{ color: "#34a853" }} />
          ) : (
            <Upload className="w-7 h-7 text-[#9aa0a6]" />
          )}
          <span
            className="text-sm font-medium"
            style={{ color: tenderFilename ? "#137333" : "#5f6368" }}
          >
            {tenderLoading ? "Uploading…" : tenderFilename ? tenderFilename : "Click to upload Tender PDF"}
          </span>
          {!tenderFilename && !tenderLoading && (
            <span className="text-xs text-[#9aa0a6]">PDF files only</span>
          )}
        </DropZone>

        <input ref={tenderRef} type="file" accept=".pdf" className="hidden" onChange={handleTenderChange} />

        {tenderError && (
          <div className="mt-3 text-xs font-medium" style={{ color: "#c5221f" }}>
            {tenderError}
          </div>
        )}

        {tenderFilename && (
          <div className="mt-3 flex items-center gap-1.5 text-xs" style={{ color: "#137333" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            </svg>
            Criteria: Turnover ≥ ₹5 Cr · GST Valid · Projects ≥ 2
          </div>
        )}
      </div>

      {/* ── Step 2: Bidder ── */}
      <div
        className="bg-white rounded-lg border border-[#dadce0] p-6"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
      >
        <div className="flex items-center gap-2 mb-1">
          <span
            className="w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold flex-shrink-0"
            style={{ backgroundColor: "#1a73e8" }}
          >
            2
          </span>
          <h2 className="text-sm font-semibold text-[#202124]">Evaluate Bidder</h2>
        </div>
        <p className="text-xs text-[#5f6368] mb-4 ml-7">Add a bidder's document for AI-assisted evaluation</p>

        <div className="space-y-3">
          {/* Bidder PDF */}
          <div>
            <label className="text-xs font-medium text-[#5f6368] mb-1 block">Bidder Document</label>
            <DropZone
              onClick={() => bidderRef.current?.click()}
              compact
              active={!!bidderFile}
              activeColor="blue"
            >
              <FileText
                className="w-5 h-5 flex-shrink-0"
                style={{ color: bidderFile ? "#1a73e8" : "#9aa0a6" }}
              />
              <span
                className="text-sm truncate"
                style={{ color: bidderFile ? "#1a73e8" : "#5f6368" }}
              >
                {bidderFile ? bidderFile.name : "Upload Bidder PDF"}
              </span>
            </DropZone>
            <input
              ref={bidderRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => setBidderFile(e.target.files?.[0] ?? null)}
            />
          </div>

          {/* CTA */}
          <PrimaryButton onClick={handleEvaluate} disabled={!canEvaluate} loading={evaluating}>
            {evaluating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Evaluating…
              </>
            ) : (
              "Run Evaluation"
            )}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

/* ── Shared sub-components ── */

function DropZone({
  children,
  onClick,
  disabled,
  compact,
  active,
  activeColor,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  compact?: boolean;
  active?: boolean;
  activeColor?: "green" | "blue";
}) {
  const [hovered, setHovered] = useState(false);

  const borderColor = active
    ? activeColor === "green"
      ? "#34a853"
      : "#1a73e8"
    : hovered
    ? "#1a73e8"
    : "#dadce0";

  const bg = active
    ? activeColor === "green"
      ? "#f0faf4"
      : "#e8f0fe"
    : hovered
    ? "#e8f0fe"
    : "#f8f9fa";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`w-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all duration-200 ${compact ? "p-4 flex-row justify-start" : "p-8"}`}
      style={{ borderColor, backgroundColor: bg }}
    >
      {children}
    </button>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
  loading,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const active = !disabled && !loading;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => active && setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => active && setPressed(true)}
      onMouseUp={() => setPressed(false)}
      className="w-full font-semibold py-3 text-sm flex items-center justify-center gap-2 transition-all duration-150"
      style={{
        borderRadius: "100px",
        backgroundColor: active ? "#1a73e8" : "#f1f3f4",
        color: active ? "#ffffff" : "#9aa0a6",
        cursor: active ? "pointer" : "not-allowed",
        transform: pressed ? "scale(0.97)" : hovered ? "translateY(-1px)" : "none",
        boxShadow: hovered && active ? "0 4px 12px rgba(26,115,232,0.30)" : "none",
      }}
    >
      {children}
    </button>
  );
}
