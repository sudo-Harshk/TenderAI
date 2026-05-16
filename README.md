<div align="center">

# TenderAI

### AI-Assisted Tender Evaluation for Government Procurement

[![Python](https://img.shields.io/badge/Python-3.10%2B-3776ab?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06b6d4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

**Explainable · Auditable · Human-in-the-Loop**

[Live Demo](https://neon-dodol-3d56d3.netlify.app) · [API Docs](https://neon-dodol-3d56d3.netlify.app/docs) · [Report an Issue](https://github.com/sudo-Harshk/tender-ai/issues)

</div>

---

## Overview

TenderAI is a full-stack decision-support system that automates the eligibility screening phase of government tender evaluation. It extracts structured data from bidder PDFs, applies deterministic pass/fail logic, and routes uncertain cases to a human procurement officer  with every decision timestamped and logged for compliance.

**The core guarantee:** AI is used only for data extraction and natural-language explanation generation. Pass, Fail, and Needs Review verdicts are always produced by deterministic if/else logic - never by an AI model.

### The Problem

Government procurement officers in India manually verify dozens of bidder documents per tender. Each document must be checked against criteria like annual turnover thresholds, GST registration, and prior project experience. This process is:

- **Slow** — hours of manual PDF reading per evaluation cycle
- **Inconsistent** — subjective interpretation of ambiguous text
- **Hard to audit** — paper trails are incomplete or scattered

### The Solution

TenderAI handles the extraction and first-pass evaluation automatically, surfacing only genuinely ambiguous cases for human review. Every decision — automated or human - is recorded in an immutable audit log.

---

## Architecture

### System Overview

```mermaid
graph TB
    subgraph Client["Frontend — React / TypeScript"]
        LP[Landing Page<br/>/]
        APP[Evaluation Interface<br/>/app]
        UP[Upload Section]
        RT[Results Table]
        EP[Explanation Panel]
        DL[Decision Log]
    end

    subgraph API["Backend — FastAPI"]
        R1[POST /upload-tender]
        R2[POST /evaluate-bidder]
        R3[POST /review]
        R4[GET /results]
        R5[GET /audit-log]
        R6[DELETE /reset]
    end

    subgraph Core["Evaluation Core"]
        EXT[Extractor<br/>extractor.py]
        EVL[Evaluator<br/>evaluator.py]
        AUD[Audit Store<br/>audit.py]
        MDL[Models<br/>models.py]
    end

    subgraph AI["AI Services — Optional"]
        OCR[Mistral OCR<br/>mistral-ocr-latest]
        LLM[Groq LLM<br/>llama-3.3-70b-versatile]
    end

    APP --> R2
    APP --> R3
    APP --> R4
    APP --> R5
    R2 --> EXT
    EXT --> OCR
    EXT --> LLM
    EXT --> EVL
    EVL --> LLM
    EVL --> AUD
    R3 --> AUD
    AUD --> MDL
```

### Three-Layer Evaluation Pipeline

```mermaid
flowchart TD
    PDF[/"Bidder PDF"/]

    subgraph L1["Layer 1 — AI-Assisted Extraction"]
        direction TB
        A1["PyMuPDF\nClean text extraction\nConfidence: 0.95"]
        A2["Regex patterns\nTurnover · GST · Projects"]
        A3["Mistral OCR\nScanned document fallback\nConfidence: 0.75"]
        A4["Groq LLM\nStructured extraction fallback\nConfidence: 0.70"]
        A5["Ambiguous LLM pass\nLow-signal documents\nConfidence: 0.50"]
        A1 --> A2 --> A3 --> A4 --> A5
    end

    subgraph L2["Layer 2 — Deterministic Evaluation Engine"]
        direction LR
        B1{"Confidence\n≥ 0.75?"}
        B2{"Value meets\nthreshold?"}
        PASS["✅ PASS"]
        FAIL["❌ FAIL"]
        FLAG["🔍 NEEDS REVIEW"]
        B1 -- No --> FLAG
        B1 -- Yes --> B2
        B2 -- Yes --> PASS
        B2 -- No --> FAIL
    end

    subgraph L3["Layer 3 — Human-in-the-Loop"]
        direction TB
        C1[Officer reviews\nflagged criteria]
        C2[Confirmed value\nentered manually]
        C3[Decision re-evaluated\nat confidence 1.0]
        C4[("Immutable\nAudit Log")]
        C1 --> C2 --> C3 --> C4
    end

    PDF --> L1 --> L2
    L2 -- NEEDS REVIEW --> L3
    L2 -- PASS / FAIL --> C4
```

### Extraction Fallback Chain

```mermaid
flowchart LR
    PDF[/"PDF Bytes"/]
    FITZ["PyMuPDF\nExtract text"]
    CHECK{"Text > 500 chars\n& no scanned pages?"}
    REGEX["Regex patterns\non clean text\nconf = 0.95"]
    MISTRAL["Mistral OCR\nmistral-ocr-latest\nconf = 0.75"]
    REGEX2["Regex patterns\non OCR markdown\nconf = 0.75"]
    GROQ["Groq LLM\nllama-3.3-70b-versatile\nconf = 0.70"]
    AMB["LLM on ambiguous\ntext snippet\nconf = 0.50"]
    NOTFOUND["Not Found\nconf = 0.30"]

    PDF --> FITZ --> CHECK
    CHECK -- Yes --> REGEX
    CHECK -- No --> MISTRAL --> REGEX2
    REGEX -- match --> DONE(["Value + Confidence"])
    REGEX2 -- match --> DONE
    REGEX -- no match --> GROQ
    REGEX2 -- no match --> GROQ
    GROQ -- found --> DONE
    GROQ -- NOT_FOUND --> AMB
    AMB -- found --> DONE
    AMB -- NOT_FOUND --> NOTFOUND --> DONE
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **API Framework** | FastAPI 0.111 + Uvicorn |
| **PDF Extraction** | PyMuPDF (fitz) |
| **OCR** | Mistral AI `mistral-ocr-latest` |
| **LLM** | Groq `llama-3.3-70b-versatile` |
| **Frontend** | React 18 + Vite + TypeScript |
| **Styling** | Tailwind CSS 3 + IBM Plex Sans |
| **Icons** | Lucide React |
| **Routing** | React Router v6 |
| **Data Validation** | Pydantic v2 |
| **Environment** | python-dotenv |

Both AI services are **optional** - the system falls back to deterministic logic when API keys are absent.

---

## Evaluation Criteria

The demo is pre-configured with three standard eligibility criteria for government construction tenders:

| ID | Criterion | Threshold | Mandatory |
|----|-----------|-----------|-----------|
| C1 | Annual Turnover | ≥ ₹5 Crore | Yes |
| C2 | Valid GST Registration | Present | Yes |
| C3 | Similar Projects Completed | ≥ 2 | Yes |

### Confidence Model

| Extraction Method | Confidence Score |
|---|---|
| Regex on clean PDF text | `0.95` |
| Regex on Mistral OCR output | `0.75` |
| Groq LLM structured extraction | `0.70` |
| LLM on ambiguous/low-signal text | `0.50` |
| Value not found | `0.30` |

**Confidence gate:** Any criterion with confidence `< 0.75` receives `NEEDS REVIEW` instead of `FAIL`. This prevents valid bidders from being wrongly rejected when a document is poorly scanned or ambiguously formatted.

---

## Project Structure

```
tender-ai/
├── backend/
│   ├── main.py              # FastAPI app + route definitions
│   ├── extractor.py         # PDF text extraction + value extraction (fallback chain)
│   ├── evaluator.py         # Deterministic evaluation engine + explanation generation
│   ├── audit.py             # In-memory audit log + human review handler
│   ├── models.py            # Pydantic models: BidderResult, CriterionResult, AuditEntry
│   ├── generate_samples.py  # Sample PDF generator for demos
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── UploadSection.tsx    # Tender upload + bidder name input
│   │   │   ├── ResultsTable.tsx     # Evaluated bidder results table
│   │   │   ├── ExplanationPanel.tsx # Per-criterion breakdown + review form
│   │   │   ├── DecisionLog.tsx      # Immutable audit trail table
│   │   │   └── ui/                  # Reusable Button, Card primitives
│   │   ├── pages/
│   │   │   └── LandingPage.tsx      # Hackathon landing / product story
│   │   ├── App.tsx          # Root state + layout
│   │   ├── api.ts           # Typed fetch wrappers for all backend routes
│   │   └── types.ts         # TypeScript types mirroring backend Pydantic models
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── package.json
├── sample_data/             # Drop test PDFs here (.gitkeep preserves directory)
├── .env.example
└── README.md
```

---

## Getting Started

### Prerequisites

| Requirement | Version |
|---|---|
| Python | 3.10+ |
| Node.js | 18+ |
| Mistral API Key | Optional — [console.mistral.ai](https://console.mistral.ai) |
| Groq API Key | Optional — [console.groq.com](https://console.groq.com) |

Both API keys are free-tier. Without them, the system still works using regex extraction and deterministic fallback explanations.

### Step 1 — Clone and Configure

```bash
git clone https://github.com/sudo-Harshk/tender-ai.git
cd tender-ai
cp .env.example .env
```

Edit `.env` and add your keys:

```env
MISTRAL_API_KEY=your_mistral_api_key_here
GROQ_API_KEY=your_groq_api_key_here
```

### Step 2 — Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS / Linux

pip install -r requirements.txt

# Start the API server
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`. Interactive documentation is at `http://localhost:8000/docs`.

### Step 3 — Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The application will open at `http://localhost:5173`.

| Route | Description |
|---|---|
| `/` | Product landing page |
| `/app` | Evaluation interface |

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/upload-tender` | Upload a tender PDF; returns pre-configured criteria |
| `POST` | `/evaluate-bidder` | Upload a bidder PDF + name; returns full `BidderResult` |
| `GET` | `/results` | All evaluated bidders in the current session |
| `POST` | `/review` | Submit human review for a `NEEDS REVIEW` criterion |
| `GET` | `/audit-log` | Full timestamped audit trail |
| `DELETE` | `/reset` | Clear in-memory session data |

### Example: Evaluate a Bidder

```bash
curl -X POST http://localhost:8000/evaluate-bidder \
  -F "file=@acme_constructions.pdf" \
  -F "bidder_name=Acme Constructions"
```

**Response:**

```json
{
  "bidder_id": "A3F2B1C8",
  "bidder_name": "Acme Constructions",
  "overall_decision": "FAIL",
  "evaluated_at": "2025-05-17T10:30:00Z",
  "criteria_results": [
    {
      "criterion_id": "C1",
      "criterion_label": "Annual Turnover >= 5 Crore",
      "extracted_value": 31000000,
      "extracted_display": "₹3.10 Cr",
      "required_value": "₹5 Crore",
      "confidence": 0.95,
      "decision": "FAIL",
      "explanation": "Turnover of ₹3.10 Cr falls below the required ₹5 Crore threshold — marked as FAIL."
    }
  ]
}
```

### Example: Submit a Human Review

```bash
curl -X POST http://localhost:8000/review \
  -H "Content-Type: application/json" \
  -d '{
    "bidder_id": "A3F2B1C8",
    "criterion_id": "C1",
    "confirmed_value": "6.2 Crore",
    "reviewer_name": "Officer Sharma"
  }'
```

---

## Demo Walkthrough

The included sample PDFs demonstrate all three evaluation outcomes:

| Bidder | Turnover | GST | Projects | Outcome |
|--------|----------|-----|----------|---------|
| Acme Constructions | ₹3.1 Cr | Valid | 3 | **FAIL** - turnover below threshold |
| BuildRight Pvt Ltd | ₹6.2 Cr | Valid | 5 | **PASS** - all criteria met |
| Sharma Enterprises | Unclear | Valid | 4 | **NEEDS REVIEW** → Officer enters ₹6.2 Cr → **PASS** |

### How to Run It

1. Open `http://localhost:5173/app`
2. Upload any PDF as the tender document (criteria are pre-configured)
3. Upload a bidder PDF and enter the bidder name → **Run Evaluation**
4. Click any row in the results table to expand the per-criterion breakdown
5. For **NEEDS REVIEW** rows — enter the confirmed value and your name → **Submit Review**
6. The **Decision Log** panel shows the full timestamped audit trail for every action

---

## Design Principles

**AI is never the decision-maker.**
Pass, Fail, and Needs Review outcomes are produced entirely by deterministic threshold comparisons (`evaluator.py`). AI models handle only two tasks: value extraction from unstructured text, and natural-language explanation generation.

**Confidence gating prevents false rejections.**
A low-confidence extraction (ambiguous scan, missing data) escalates to `NEEDS REVIEW`, not `FAIL`. This ensures a valid bidder with a poorly scanned document is never automatically excluded.

**The audit log is append-only.**
Every automated decision and every human override appends a new `AuditEntry`. Nothing is deleted or modified in the log, providing a complete compliance trail.

**Graceful degradation.**
Both Mistral OCR and Groq LLM are optional. If either key is missing or a call fails, the system silently falls back to the next method in the chain without surfacing errors to the user.

---

## Roadmap

- [ ] Dynamic criteria extraction from the tender PDF itself
- [ ] Integration with GeM / NIC eProcurement portals
- [ ] Multi-language document support (Hindi, regional languages)
- [ ] Role-based access control with officer authentication
- [ ] Persistent storage — PostgreSQL or SQLite backend
- [ ] Audit export to signed PDF for regulatory submission
- [ ] Batch evaluation — process all bidders from a ZIP upload

---

## License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

Built for the **AI for Bharat Hackathon** by [Harsha K](https://github.com/sudo-Harshk)

</div>
