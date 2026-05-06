# TenderAI - AI Powered Tender Evaluation System

## What This Does

TenderAI is an explainable AI decision-support system for government tender evaluation.
It extracts eligibility data from bidder PDFs, runs a deterministic evaluation engine,
and routes uncertain cases to a human reviewer with a full, timestamped audit trail
for every decision.

## Tech Stack

**Backend**
- Python 3.10+ · FastAPI · Uvicorn
- PyMuPDF - clean PDF text extraction
- Mistral OCR (`mistral-ocr-latest`) - fallback for scanned documents
- Groq LLM (`llama-3.3-70b-versatile`) - extraction fallback + explanation generation

**Frontend**
- Vite · React 18 · TypeScript
- Tailwind CSS · Plus Jakarta Sans
- Lucide React icons
- React Router for landing/demo routes

## Project Structure

```
TenderAI/
├── backend/
│   ├── main.py          # FastAPI endpoints
│   ├── extractor.py     # PDF text + value extraction
│   ├── evaluator.py     # Deterministic evaluation engine
│   ├── models.py        # Pydantic data models
│   ├── audit.py         # In-memory audit log + review handler
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/  # UploadSection, ResultsTable, ExplanationPanel, DecisionLog
│   │   ├── pages/       # LandingPage
│   │   ├── App.tsx
│   │   ├── api.ts       # Backend API client
│   │   └── types.ts     # Shared TypeScript types
│   ├── package.json
│   └── vite.config.ts
├── sample_data/
├── .env.example
└── README.md
```

## Setup Instructions

### Prerequisites

- Python 3.10+
- Node.js 18+
- Mistral API Key - free at [console.mistral.ai](https://console.mistral.ai)
- Groq API Key - free at [console.groq.com](https://console.groq.com)

### Step 1 - Clone and Configure

```bash
git clone <repo-url>
cd TenderAI
cp .env.example .env
# Open .env and add your MISTRAL_API_KEY and GROQ_API_KEY
```

### Step 2 - Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Step 3 - Frontend Setup

```bash
cd frontend
npm install
npm run dev
# Landing page opens at http://localhost:5173
# Demo app opens at http://localhost:5173/app
```

### Step 4 - Demo

1. Open [http://localhost:5173](http://localhost:5173) to view the hackathon landing page
2. Click **Open Demo** or go directly to [http://localhost:5173/app](http://localhost:5173/app)
3. Upload any PDF as the tender document (criteria are pre-configured)
4. Upload a bidder PDF + enter bidder name → click **Run Evaluation**
5. Click any row in the results table to see per-criterion explanations
6. For **NEEDS REVIEW** rows → enter the confirmed value + reviewer name → **Submit Review**
7. Check the **Decision Log** panel at the bottom for the full audit trail

## Landing Page

The root route (`/`) presents TenderAI for the AI for Bharat hackathon with a concise procurement-focused story:

- The problem: slow manual checks, inconsistent interpretation and difficult auditability
- The solution: AI-assisted extraction, deterministic eligibility logic and human review
- The trust model: criterion-level evidence, confidence-gated review and immutable audit logging
- The workflow: upload tender, add bidders, match evidence, explain verdicts and complete officer sign-off

The working evaluation interface remains at `/app`.

## Demo Flow

| Bidder | Turnover | GST | Projects | Overall |
|--------|----------|-----|----------|---------|
| Acme Constructions | ₹3.1 Cr → **FAIL** | PASS | PASS | **FAIL** |
| BuildRight Pvt Ltd | ₹6.2 Cr → **PASS** | PASS | PASS | **PASS** |
| Sharma Enterprises | Unclear → **REVIEW** | PASS | PASS | **REVIEW** → human enters ₹6.2 Cr → **PASS** |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Layer 1 — AI-Assisted Extraction                   │
│  PyMuPDF → Regex → Mistral OCR → Groq LLM fallback  │
├─────────────────────────────────────────────────────┤
│  Layer 2 — Deterministic Core (pure if/else)        │
│  Threshold checks · Confidence gating               │
│  PASS / FAIL / NEEDS REVIEW — no AI in decisions    │
├─────────────────────────────────────────────────────┤
│  Layer 3 — Human-in-the-Loop                        │
│  Officer reviews uncertain cases · Override logged  │
│  Full audit trail with timestamps                   │
└─────────────────────────────────────────────────────┘
```

**Confidence model:**

| Source | Confidence |
|--------|-----------|
| Regex on clean PDF | 0.95 |
| Regex on OCR text | 0.75 |
| LLM extraction | 0.70 |
| LLM on ambiguous text | 0.50 |
| Value not found | 0.30 |

If confidence < 0.75 → decision = **NEEDS REVIEW** (never auto-fail on uncertainty)

## Future Roadmap

- Dynamic criteria extraction from tender PDF
- Integration with GeM / NIC eProcurement portal
- Multi-language support
- Role-based access control
- Full audit export to PDF
