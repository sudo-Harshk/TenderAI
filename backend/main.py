from typing import List

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from audit import add_to_audit, audit_log, bidder_results, reset_all, update_review
from evaluator import CRITERIA, evaluate_bidder
from extractor import extract_company_name, extract_text_from_pdf
from models import AuditEntry, BidderResult, ReviewRequest

app = FastAPI(title="TenderAI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000","*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/upload-tender")
async def upload_tender(file: UploadFile = File(...)):
    await file.read()  # consume the bytes
    return {
        "message": "Tender uploaded. Evaluation criteria are pre-configured for this demo.",
        "filename": file.filename,
        "criteria": {k: {"id": v["id"], "label": v["label"]} for k, v in CRITERIA.items()},
    }


@app.post("/evaluate-bidder", response_model=BidderResult)
async def evaluate_bidder_endpoint(
    file: UploadFile = File(...),
    bidder_name: str = Form(""),
) -> BidderResult:
    try:
        pdf_bytes = await file.read()

        try:
            import fitz

            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            doc.close()
        except Exception as e:
            print(f"PDF validation failed: {e}")
            raise HTTPException(
                status_code=422,
                detail="Could not read PDF file. Please ensure the file is a valid PDF.",
            ) from e

        final_bidder_name = bidder_name.strip()
        if not final_bidder_name:
            text, _ = extract_text_from_pdf(pdf_bytes)
            final_bidder_name = extract_company_name(text, file.filename or "bidder.pdf")

        result = evaluate_bidder(pdf_bytes, final_bidder_name)
        add_to_audit(result)
        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"Evaluate bidder failed: {e}")
        raise HTTPException(
            status_code=422,
            detail="Could not read PDF file. Please ensure the file is a valid PDF.",
        ) from e


@app.get("/results", response_model=List[BidderResult])
async def get_results() -> List[BidderResult]:
    return list(bidder_results.values())


@app.post("/review", response_model=BidderResult)
async def submit_review(review: ReviewRequest) -> BidderResult:
    result = update_review(
        review.bidder_id,
        review.criterion_id,
        review.confirmed_value,
        review.reviewer_name,
    )
    if result is None:
        raise HTTPException(status_code=404, detail="Bidder or criterion not found")
    return result


@app.get("/audit-log", response_model=List[AuditEntry])
async def get_audit_log() -> List[AuditEntry]:
    return audit_log


@app.delete("/reset")
async def reset_demo():
    reset_all()
    return {"message": "Demo reset successful"}
