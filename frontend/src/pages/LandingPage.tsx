import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Bot,
  CheckCircle,
  ClipboardCheck,
  FileSearch,
  Gavel,
  LockKeyhole,
  SearchCheck,
  ShieldCheck,
  UploadCloud,
  UserCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ButtonLink } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { cn } from "../lib/utils";

const problemPoints = [
  "Tender requirements are spread across many formal, legally careful pages.",
  "Bidder evidence arrives as PDFs, scans, tables, certificates and photographs.",
  "Manual checks are slow, inconsistent and hard to defend during review.",
];

const solutionLayers = [
  {
    title: "AI-assisted extraction",
    text: "OCR and language models convert tenders and bid documents into criteria, values and evidence.",
    icon: FileSearch,
  },
  {
    title: "Deterministic core",
    text: "Eligibility decisions are made by transparent rules, not by a black-box model.",
    icon: Gavel,
  },
  {
    title: "Officer verification",
    text: "Low-confidence or ambiguous cases are flagged for officer verification with the reason and source.",
    icon: UserCheck,
  },
];

const trustItems = [
  {
    title: "Never silently disqualify",
    text: "Unclear evidence is routed to an officer instead of becoming an automatic fail.",
    icon: AlertTriangle,
  },
  {
    title: "Criterion-level evidence",
    text: "Every verdict names the requirement, document, extracted value and explanation.",
    icon: BadgeCheck,
  },
  {
    title: "Audit-ready trail",
    text: "Automated checks and human overrides are timestamped for formal procurement use.",
    icon: LockKeyhole,
  },
];

const workflowSteps = [
  { title: "Upload tender", text: "Capture eligibility rules and mandatory conditions.", icon: UploadCloud },
  { title: "Add bidders", text: "Parse typed PDFs, scans and supporting documents.", icon: Bot },
  { title: "Match evidence", text: "Map extracted values to each criterion.", icon: SearchCheck },
  { title: "Explain verdicts", text: "Show pass, fail or review with source references.", icon: ClipboardCheck },
  { title: "Officer sign-off", text: "Resolve uncertain cases and preserve the audit log.", icon: ShieldCheck },
];

const stackItems = ["React", "FastAPI", "Tailwind", "OCR", "LLM fallback", "Rule engine"];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-2 text-[#202124]">
      <header className="sticky top-0 z-20 border-b border-border bg-white/90 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
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
                aria-hidden="true"
              >
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <span className="text-[17px] font-bold tracking-tight text-[#202124]">TenderAI</span>
            <span className="ml-1 hidden border-l border-border pl-3 text-xs text-[#5f6368] sm:inline">
              Explainable Evaluation System
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="#workflow"
              className="hidden rounded-pill px-4 py-2 text-sm font-semibold text-[#5f6368] transition-colors hover:bg-primary-bg hover:text-primary sm:inline-flex"
            >
              How it works
            </a>
            <ButtonLink to="/app" className="px-4 py-2">
              Open Demo
            </ButtonLink>
          </div>
        </nav>
      </header>

      <main>
        <section className="relative overflow-hidden bg-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(26,115,232,0.12),transparent_36%),linear-gradient(180deg,#ffffff_0%,#f8f9fa_100%)]" />
          <div className="relative mx-auto grid min-h-[calc(100svh-4rem)] max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:py-20">
            <div className="max-w-2xl animate-fade-slide-up">
              <p className="mb-4 inline-flex rounded-pill border border-primary/20 bg-primary-bg px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-primary">
                AI for Bharat hackathon
              </p>
              <h1 className="text-4xl font-bold tracking-[-0.04em] text-[#202124] sm:text-5xl lg:text-6xl">
                Explainable tender evaluation for government procurement.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-[#5f6368] sm:text-lg">
                TenderAI helps procurement officers extract eligibility criteria, evaluate bidder evidence and
                produce audit-ready decisions without letting AI silently reject anyone.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <ButtonLink to="/app">
                  Open Demo <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </ButtonLink>
                <a
                  href="#workflow"
                  className="inline-flex items-center justify-center rounded-pill border border-border bg-white px-5 py-3 text-sm font-semibold text-[#202124] transition-all duration-150 hover:-translate-y-0.5 hover:border-primary hover:text-primary hover:shadow-card focus:outline-none focus:ring-4 focus:ring-[rgba(26,115,232,0.16)]"
                >
                  See workflow
                </a>
              </div>
              <div className="mt-8 grid gap-3 text-sm text-[#5f6368] sm:grid-cols-3">
                {["Criterion-level proof", "Confidence-gated review", "Immutable audit log"].map((item) => (
                  <span key={item} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-[#34a853]" aria-hidden="true" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="animate-fade-slide-up stagger-1">
              <ProductPreview />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">The procurement reality</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#202124]">
                The challenge is not just reading documents. It is defending decisions.
              </h2>
            </div>
            <div className="grid gap-3">
              {problemPoints.map((point) => (
                <div key={point} className="flex gap-3 border-b border-border pb-4 last:border-b-0">
                  <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                  <p className="text-sm leading-6 text-[#5f6368]">{point}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="solution" className="border-y border-border bg-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
            <SectionIntro
              eyebrow="Solution model"
              title="AI extracts. Rules decide. Officers review."
              text="The platform separates document understanding from eligibility decisions so procurement logic remains explainable and auditable."
            />
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {solutionLayers.map((layer) => (
                <Card key={layer.title} className="p-6 transition-all duration-150 hover:-translate-y-1 hover:shadow-card-hover">
                  <layer.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                  <h3 className="mt-5 text-base font-bold text-[#202124]">{layer.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#5f6368]">{layer.text}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <SectionIntro
              eyebrow="Trust controls"
              title="Designed around the hackathon non-negotiables."
              text="Every outcome is explainable at criterion level, and uncertainty is treated as a formal review path rather than a hidden failure."
            />
            <div className="grid gap-4">
              {trustItems.map((item) => (
                <TrustRow key={item.title} {...item} />
              ))}
            </div>
          </div>
        </section>

        <section id="workflow" className="bg-[#202124] text-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
            <SectionIntro
              eyebrow="Workflow"
              title="From upload to officer sign-off."
              text="A short operational flow gives judges and users a clear path from document intake to report-ready evidence."
              inverted
            />
            <div className="mt-10 grid gap-4 md:grid-cols-5">
              {workflowSteps.map((step, index) => (
                <WorkflowStep key={step.title} index={index + 1} {...step} />
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="grid gap-8 rounded-[28px] border border-border bg-white p-6 shadow-card sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Built for AI for Bharat</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#202124]">
                Practical AI for public procurement teams.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5f6368]">
                Co-presented by PAN IIT Bangalore Alumni Association and the Government of Karnataka, this project
                focuses on a deployable workflow: useful AI, human accountability and measurable review speed.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {stackItems.map((item) => (
                  <span
                    key={item}
                    className="rounded-pill border border-border bg-surface-2 px-3 py-1 text-xs font-semibold text-[#5f6368]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <ButtonLink to="/app" className="w-full sm:w-auto">
              Try the demo <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-[#5f6368] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span className="font-semibold text-[#202124]">TenderAI</span>
          <span>Explainable eligibility analysis for CRPF-style government procurement workflows.</span>
        </div>
      </footer>
    </div>
  );
}

function SectionIntro({
  eyebrow,
  title,
  text,
  inverted,
}: {
  eyebrow: string;
  title: string;
  text: string;
  inverted?: boolean;
}) {
  return (
    <div className="max-w-3xl">
      <p className={cn("text-xs font-bold uppercase tracking-[0.22em]", inverted ? "text-[#8ab4f8]" : "text-primary")}>
        {eyebrow}
      </p>
      <h2 className={cn("mt-3 text-3xl font-bold tracking-tight", inverted ? "text-white" : "text-[#202124]")}>
        {title}
      </h2>
      <p className={cn("mt-3 text-sm leading-6", inverted ? "text-white/70" : "text-[#5f6368]")}>{text}</p>
    </div>
  );
}

function TrustRow({
  title,
  text,
  icon: Icon,
}: {
  title: string;
  text: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex gap-4 rounded-lg border border-border bg-white p-5 shadow-card">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-bg text-primary">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-[#202124]">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-[#5f6368]">{text}</p>
      </div>
    </div>
  );
}

function WorkflowStep({
  index,
  title,
  text,
  icon: Icon,
}: {
  index: number;
  title: string;
  text: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-5 transition-all duration-150 hover:-translate-y-1 hover:bg-white/10">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-white/40">0{index}</span>
        <Icon className="h-5 w-5 text-[#8ab4f8]" aria-hidden="true" />
      </div>
      <h3 className="mt-5 text-sm font-bold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-white/65">{text}</p>
    </div>
  );
}

function ProductPreview() {
  const rows = [
    { bidder: "BuildRight Pvt Ltd", status: "PASS", color: "pass" },
    { bidder: "Acme Constructions", status: "FAIL", color: "fail" },
    { bidder: "Sharma Enterprises", status: "REVIEW", color: "review" },
  ];

  return (
    <div className="relative">
      <div className="absolute -inset-4 rounded-[32px] bg-primary/10 blur-2xl" />
      <div className="relative overflow-hidden rounded-[28px] border border-border bg-white shadow-card-hover">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-sm font-bold text-[#202124]">Evaluation workspace</p>
            <p className="text-xs text-[#5f6368]">Criterion-by-criterion evidence review</p>
          </div>
          <span className="rounded-pill bg-[#e6f4ea] px-3 py-1 text-xs font-bold text-[#137333]">
            Deterministic core
          </span>
        </div>
        <div className="grid gap-4 p-5 lg:grid-cols-[1fr_0.85fr]">
          <div className="space-y-3">
            {rows.map((row) => (
              <div key={row.bidder} className="rounded-lg border border-[#f1f3f4] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-[#202124]">{row.bidder}</p>
                  <StatusPill color={row.color}>{row.status}</StatusPill>
                </div>
                <div className="mt-3 h-2 rounded-full bg-surface-3">
                  <div
                    className={cn(
                      "h-2 rounded-full",
                      row.color === "pass" && "w-[92%] bg-[#34a853]",
                      row.color === "fail" && "w-[48%] bg-[#ea4335]",
                      row.color === "review" && "w-[68%] bg-[#fbbc04]"
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-[#fde68a] bg-[#fffbf0] p-5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[#fbbc04]" aria-hidden="true" />
              <p className="text-sm font-bold text-[#202124]">Needs manual review</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#5f6368]">
              Turnover certificate is scanned and OCR confidence is below threshold. Officer confirmation required
              before verdict.
            </p>
            <div className="mt-5 rounded-lg bg-white p-4 text-xs text-[#5f6368]">
              Source: Financial statement, page 3
              <br />
              Confidence: 68%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ children, color }: { children: string; color: string }) {
  const classes = {
    pass: "border-[#ceead6] bg-[#e6f4ea] text-[#137333]",
    fail: "border-[#f5c6c4] bg-[#fce8e6] text-[#c5221f]",
    review: "border-[#fde68a] bg-[#fef7e0] text-[#b06000]",
  };

  return (
    <span className={cn("rounded-pill border px-2.5 py-0.5 text-xs font-bold", classes[color as keyof typeof classes])}>
      {children}
    </span>
  );
}
