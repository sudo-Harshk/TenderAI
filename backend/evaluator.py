import os
from datetime import datetime
from typing import List, Optional, Tuple
import uuid

from models import BidderResult, CriterionResult, Decision
from extractor import (
    extract_text_from_pdf,
    extract_turnover,
    extract_gst,
    extract_projects,
)

CRITERIA = {
    "turnover": {
        "id": "C1",
        "label": "Annual Turnover >= 5 Crore",
        "threshold": 50_000_000,
        "type": "numeric",
        "mandatory": True,
        "required_display": "₹5 Crore",
    },
    "gst": {
        "id": "C2",
        "label": "Valid GST Registration",
        "type": "boolean",
        "mandatory": True,
        "required_display": "Valid GST Registration",
    },
    "projects": {
        "id": "C3",
        "label": "Minimum 2 Similar Projects Completed",
        "threshold": 2,
        "type": "numeric",
        "mandatory": True,
        "required_display": "Minimum 2 Projects",
    },
}


def evaluate_criterion(criterion_key: str, extracted_value, confidence: float) -> Decision:
    """Pure if/else evaluation — no AI involved."""
    c = CRITERIA[criterion_key]

    if extracted_value is None or confidence < 0.75:
        return Decision.NEEDS_REVIEW

    if c["type"] == "boolean":
        return Decision.PASS if extracted_value else Decision.FAIL

    # numeric
    return Decision.PASS if extracted_value >= c["threshold"] else Decision.FAIL


def calculate_overall_decision(criteria_results: List[CriterionResult]) -> Decision:
    decisions = [r.decision for r in criteria_results]
    if Decision.FAIL in decisions:
        return Decision.FAIL
    if Decision.NEEDS_REVIEW in decisions:
        return Decision.NEEDS_REVIEW
    return Decision.PASS


def format_value_display(criterion_key: str, value) -> str:
    if value is None:
        return "Not found"
    if criterion_key == "turnover":
        crores = value / 10_000_000
        return f"₹{crores:.2f} Cr"
    if criterion_key == "gst":
        return "Valid" if value else "Not found"
    if criterion_key == "projects":
        return f"{int(value)} project{'s' if int(value) != 1 else ''}"
    return str(value)


def generate_explanation(
    criterion_key: str,
    criterion_label: str,
    extracted_value,
    confidence: float,
    decision: Decision,
    source_page: Optional[str] = None,
) -> str:
    groq_key = os.environ.get("GROQ_API_KEY", "")
    if groq_key and groq_key != "your_groq_api_key_here":
        try:
            from groq import Groq

            client = Groq(api_key=groq_key)
            value_str = format_value_display(criterion_key, extracted_value)
            c = CRITERIA[criterion_key]
            source_clause = f" ({source_page})" if source_page else ""

            prompt = (
                f"Write one short professional sentence (max 30 words) explaining this tender evaluation result.\n"
                f"Criterion: {criterion_label}\n"
                f"Value found: {value_str}{source_clause}\n"
                f"Required: {c['required_display']}\n"
                f"Confidence: {confidence:.2f}\n"
                f"Decision: {decision.value}\n\n"
                "Rules:\n"
                "- PASS: explain value found and why it qualifies\n"
                "- FAIL: explain value found and why it does not qualify\n"
                "- NEEDS REVIEW: state value was unclear/missing and requires human review\n"
                "- Use ₹ for monetary values\n"
                "One sentence:"
            )
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=80,
            )
            return response.choices[0].message.content.strip().strip('"')
        except Exception:
            pass

    # Deterministic fallback
    val = format_value_display(criterion_key, extracted_value)
    c = CRITERIA[criterion_key]
    if decision == Decision.PASS:
        return f"{criterion_label}: {val} meets the required {c['required_display']} — marked as PASS."
    if decision == Decision.FAIL:
        return f"{criterion_label}: {val} does not meet the required {c['required_display']} — marked as FAIL."
    return (
        f"{criterion_label}: value could not be read clearly "
        f"(confidence: {confidence:.2f}) — sent for human review."
    )


def evaluate_bidder(pdf_bytes: bytes, bidder_name: str) -> BidderResult:
    bidder_id = str(uuid.uuid4())[:8].upper()
    text, is_ocr = extract_text_from_pdf(pdf_bytes)

    # --- Turnover ---
    t_val, t_conf, t_page = extract_turnover(text, is_ocr)
    t_decision = evaluate_criterion("turnover", t_val, t_conf)
    t_explanation = generate_explanation("turnover", CRITERIA["turnover"]["label"], t_val, t_conf, t_decision, t_page)

    # --- GST ---
    g_val, g_conf, g_page = extract_gst(text, is_ocr)
    g_decision = evaluate_criterion("gst", g_val, g_conf)
    g_explanation = generate_explanation("gst", CRITERIA["gst"]["label"], g_val, g_conf, g_decision, g_page)

    # --- Projects ---
    p_val, p_conf, p_page = extract_projects(text, is_ocr)
    p_decision = evaluate_criterion("projects", p_val, p_conf)
    p_explanation = generate_explanation("projects", CRITERIA["projects"]["label"], p_val, p_conf, p_decision, p_page)

    criteria_results = [
        CriterionResult(
            criterion_id="C1",
            criterion_label=CRITERIA["turnover"]["label"],
            extracted_value=t_val,
            extracted_display=format_value_display("turnover", t_val),
            required_value=CRITERIA["turnover"]["required_display"],
            source_page=t_page,
            confidence=t_conf,
            decision=t_decision,
            explanation=t_explanation,
        ),
        CriterionResult(
            criterion_id="C2",
            criterion_label=CRITERIA["gst"]["label"],
            extracted_value=1.0 if g_val else 0.0,
            extracted_display=format_value_display("gst", g_val),
            required_value=CRITERIA["gst"]["required_display"],
            source_page=g_page,
            confidence=g_conf,
            decision=g_decision,
            explanation=g_explanation,
        ),
        CriterionResult(
            criterion_id="C3",
            criterion_label=CRITERIA["projects"]["label"],
            extracted_value=float(p_val) if p_val is not None else None,
            extracted_display=format_value_display("projects", p_val),
            required_value=CRITERIA["projects"]["required_display"],
            source_page=p_page,
            confidence=p_conf,
            decision=p_decision,
            explanation=p_explanation,
        ),
    ]

    overall = calculate_overall_decision(criteria_results)

    return BidderResult(
        bidder_id=bidder_id,
        bidder_name=bidder_name,
        overall_decision=overall,
        criteria_results=criteria_results,
        evaluated_at=datetime.utcnow(),
    )
