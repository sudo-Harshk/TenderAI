import re
from datetime import datetime
from typing import Dict, List, Optional

from models import AuditEntry, BidderResult, Decision


audit_log: List[AuditEntry] = []
bidder_results: Dict[str, BidderResult] = {}


def add_to_audit(bidder_result: BidderResult) -> None:
    for cr in bidder_result.criteria_results:
        entry = AuditEntry(
            timestamp=bidder_result.evaluated_at,
            bidder_id=bidder_result.bidder_id,
            bidder_name=bidder_result.bidder_name,
            criterion_id=cr.criterion_id,
            criterion_label=cr.criterion_label,
            extracted_value=cr.extracted_display,
            required_value=cr.required_value,
            source_page=cr.source_page,
            decision=cr.decision,
            confidence=cr.confidence,
            explanation=cr.explanation,
        )
        audit_log.append(entry)

    bidder_results[bidder_result.bidder_id] = bidder_result


def update_review(
    bidder_id: str,
    criterion_id: str,
    confirmed_value: str,
    reviewer_name: str,
) -> Optional[BidderResult]:
    from evaluator import (
        CRITERIA,
        calculate_overall_decision,
        evaluate_criterion,
        format_value_display,
        generate_explanation,
    )

    if bidder_id not in bidder_results:
        return None

    result = bidder_results[bidder_id]

    # Identify criterion key
    criterion_key = next(
        (k for k, c in CRITERIA.items() if c["id"] == criterion_id), None
    )
    if not criterion_key:
        return None

    # Parse confirmed_value → typed Python value
    parsed: object = None
    if criterion_key == "turnover":
        m = re.search(r"(\d+(?:\.\d+)?)", confirmed_value)
        if m:
            num = float(m.group(1))
            parsed = num * 10_000_000 if num < 1_000 else num
    elif criterion_key == "gst":
        parsed = confirmed_value.strip().lower() in {"true", "yes", "valid", "1"}
    elif criterion_key == "projects":
        m = re.search(r"(\d+)", confirmed_value)
        if m:
            parsed = int(m.group(1))

    new_decision = evaluate_criterion(criterion_key, parsed, 1.0)
    new_display = format_value_display(criterion_key, parsed)
    new_explanation = generate_explanation(
        criterion_key,
        CRITERIA[criterion_key]["label"],
        parsed,
        1.0,
        new_decision,
    )

    # Mutate criterion result in-place (models have frozen=False)
    updated_criterion = None
    for cr in result.criteria_results:
        if cr.criterion_id == criterion_id:
            if criterion_key == "gst":
                cr.extracted_value = 1.0 if parsed else 0.0
            elif parsed is not None:
                cr.extracted_value = float(parsed)  # type: ignore[arg-type]
            cr.extracted_display = new_display
            cr.confidence = 1.0
            cr.decision = new_decision
            cr.explanation = new_explanation
            updated_criterion = cr
            break

    if updated_criterion is None:
        return None

    result.overall_decision = calculate_overall_decision(result.criteria_results)

    reviewed_at = datetime.utcnow()
    audit_log.append(
        AuditEntry(
            event_type="REVIEWED",
            timestamp=reviewed_at,
            bidder_id=result.bidder_id,
            bidder_name=result.bidder_name,
            criterion_id=updated_criterion.criterion_id,
            criterion_label=updated_criterion.criterion_label,
            extracted_value=new_display,
            required_value=updated_criterion.required_value,
            source_page=updated_criterion.source_page,
            decision=new_decision,
            confidence=1.0,
            explanation=new_explanation,
            reviewed_by=reviewer_name,
            reviewed_at=reviewed_at,
            override_value=confirmed_value,
        )
    )

    return result


def reset_all() -> None:
    audit_log.clear()
    bidder_results.clear()
