from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List
from enum import Enum


class Decision(str, Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    FLAGGED = "FLAGGED"


class CriterionResult(BaseModel):
    model_config = ConfigDict(frozen=False)

    criterion_id: str
    criterion_label: str
    extracted_value: Optional[float] = None
    extracted_display: Optional[str] = None
    required_value: str
    source_page: Optional[str] = None
    confidence: float
    decision: Decision
    explanation: str


class BidderResult(BaseModel):
    model_config = ConfigDict(frozen=False)

    bidder_id: str
    bidder_name: str
    overall_decision: Decision
    criteria_results: List[CriterionResult]
    evaluated_at: datetime


class AuditEntry(BaseModel):
    model_config = ConfigDict(frozen=False)

    event_type: str = "EXTRACTED"
    timestamp: datetime
    bidder_id: str
    bidder_name: str
    criterion_id: str
    criterion_label: str
    extracted_value: Optional[str] = None
    required_value: str
    source_page: Optional[str] = None
    decision: Decision
    confidence: float
    explanation: str
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    override_value: Optional[str] = None


class ReviewRequest(BaseModel):
    bidder_id: str
    criterion_id: str
    confirmed_value: str
    reviewer_name: str
