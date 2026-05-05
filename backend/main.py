from typing import List

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from audit import add_to_audit, audit_log, bidder_results, reset_all, update_review
from evaluator import CRITERIA, evaluate_bidder
from models import AuditEntry, BidderResult, ReviewRequest

app = FastAPI(title="TenderAI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
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
    bidder_name: str = Form(...),
) -> BidderResult:
    pdf_bytes = await file.read()
    result = evaluate_bidder(pdf_bytes, bidder_name)
    add_to_audit(result)
    return result


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
