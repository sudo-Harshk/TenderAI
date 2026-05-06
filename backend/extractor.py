import re
import os
import base64
from typing import List, Optional, Tuple

CONFIDENCE_REGEX_CLEAN = 0.95
CONFIDENCE_REGEX_OCR = 0.75
CONFIDENCE_LLM = 0.70
CONFIDENCE_LLM_AMBIGUOUS = 0.50
CONFIDENCE_NOT_FOUND = 0.30


def extract_text_from_pdf(pdf_bytes: bytes) -> Tuple[str, bool]:
    """Extract text using PyMuPDF. Falls back to Mistral OCR for scanned docs."""
    text = ""
    has_mixed_scanned_pages = False

    try:
        import fitz

        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        try:
            for page_num in range(min(15, len(doc))):
                page = doc[page_num]
                page_text = page.get_text()
                text += page_text

                low_text_page = len(page_text.strip()) < 50
                has_images = bool(page.get_images(full=True))
                if low_text_page and has_images:
                    has_mixed_scanned_pages = True
        finally:
            doc.close()

        if len(text.strip()) > 500 and not has_mixed_scanned_pages:
            return text, False
    except Exception as e:
        print(f"PyMuPDF failed: {e}")
        text = ""

    try:
        mistral_key = os.environ.get("MISTRAL_API_KEY", "")
        if mistral_key and mistral_key != "your_mistral_api_key_here":
            return _extract_text_mistral_ocr(pdf_bytes), True
    except Exception as e:
        print(f"Mistral OCR failed: {e}")

    if text.strip():
        return text, has_mixed_scanned_pages or len(text.strip()) <= 500

    return "", False


def _extract_text_mistral_ocr(pdf_bytes: bytes) -> str:
    from mistralai import Mistral

    client = Mistral(api_key=os.environ["MISTRAL_API_KEY"])
    pdf_b64 = base64.b64encode(pdf_bytes).decode()

    ocr_response = client.ocr.process(
        model="mistral-ocr-latest",
        document={
            "type": "document_url",
            "document_url": f"data:application/pdf;base64,{pdf_b64}",
        },
    )

    return "\n".join(page.markdown for page in ocr_response.pages)


def extract_company_name(text: str, filename: str) -> str:
    patterns = [
        r"M/s\.?\s+([A-Z][A-Za-z\s]+(?:Pvt\.?\s*Ltd\.?|Ltd\.?|LLP|Inc\.?))",
        r"(?:certify that|certified that|this is to certify that)\s+([A-Z][A-Za-z\s&]+?)(?:\s+has|\s+is|\s+with)",
        r"(?:name of firm|company name|bidder name)\s*[:\-]\s*([A-Z][A-Za-z\s]+)",
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            name = match.group(1).strip()
            if 3 < len(name) < 80:
                return name

    return (
        filename.replace(".pdf", "")
        .replace("_", " ")
        .replace("-", " ")
        .title()
    )


# ---------------------------------------------------------------------------
# Turnover extraction
# ---------------------------------------------------------------------------

def extract_turnover(text: str, is_ocr: bool) -> Tuple[Optional[float], float, Optional[str]]:
    text_norm = " ".join(text.lower().split())
    candidates = _find_turnover_candidates(text_norm)

    if _has_conflicting_turnover_candidates(candidates):
        return None, CONFIDENCE_NOT_FOUND, "conflict: multiple turnover candidates"

    if candidates:
        val, specificity, _, source = sorted(candidates, key=lambda c: (-c[1], c[2]))[0]
        conf = CONFIDENCE_REGEX_OCR if is_ocr else CONFIDENCE_REGEX_CLEAN
        if specificity == 1:
            conf *= 0.88
        return val, conf, source

    # LLM fallback
    return _extract_turnover_llm(text, is_ocr)


def _find_turnover_candidates(text_norm: str) -> List[Tuple[float, int, int, str]]:
    candidates: List[Tuple[float, int, int, str]] = []
    targeted_patterns = [
        (
            r"(?:annual|total|gross)?\s*turnover[^.]{0,60}?"
            r"(?:rs\.?\s*|inr\s*|₹\s*)?(\d+(?:\.\d+)?)\s*(?:crore?s?|cr)\b",
            5,
            10_000_000,
            "regex on text",
        ),
        (
            r"(?:rs\.?\s*|inr\s*|₹\s*)(\d+(?:\.\d+)?)\s*(?:crore?s?|cr)\b",
            4,
            10_000_000,
            "regex on text",
        ),
        (
            r"(?:annual|total|gross)?\s*turnover[^.]{0,60}?(\d+(?:\.\d+)?)\s*(?:lakhs?|lac)\b",
            5,
            100_000,
            "regex on text",
        ),
    ]

    for pattern, specificity, multiplier, source in targeted_patterns:
        for m in re.finditer(pattern, text_norm):
            candidates.append((float(m.group(1)) * multiplier, specificity, m.start(), source))

    indian_number_pattern = (
        r"turnover[\s\S]{0,120}?(?:rs\.?\s*|inr\s*|₹\s*)?"
        r"(\d{1,2},\d{2},\d{2},\d{3})\b"
    )
    for m in re.finditer(indian_number_pattern, text_norm):
        candidates.append((float(m.group(1).replace(",", "")), 5, m.start(), "regex on text"))

    # Only fall back to standalone crore values when no turnover-specific
    # candidate was found; this avoids confusing eligibility thresholds with turnover.
    if not candidates:
        for m in re.finditer(r"\b(\d+(?:\.\d+)?)\s*(?:crore?s?|cr)\b", text_norm):
            candidates.append(
                (float(m.group(1)) * 10_000_000, 1, m.start(), "regex on text (low specificity)")
            )

    return candidates


def _has_conflicting_turnover_candidates(candidates: List[Tuple[float, int, int, str]]) -> bool:
    distinct_values: List[float] = []
    for value, _, _, _ in candidates:
        if not any(_values_close(value, existing) for existing in distinct_values):
            distinct_values.append(value)

    if len(distinct_values) <= 1:
        return False

    smallest = min(distinct_values)
    largest = max(distinct_values)
    return not _values_close(smallest, largest)


def _values_close(left: float, right: float) -> bool:
    baseline = max(abs(left), abs(right), 1.0)
    return abs(left - right) / baseline <= 0.05


def _extract_turnover_llm(text: str, is_ocr: bool) -> Tuple[Optional[float], float, Optional[str]]:
    groq_key = os.environ.get("GROQ_API_KEY", "")
    if not groq_key or groq_key == "your_groq_api_key_here":
        return None, CONFIDENCE_NOT_FOUND, None

    try:
        from groq import Groq

        client = Groq(api_key=groq_key)
        prompt = (
            "Extract the annual turnover amount from the document below. "
            "Return ONLY a plain integer in Indian Rupees — no units, no text, no commas. "
            "Examples: '3.1 Crore' → 31000000 | '62 lakh' → 6200000 | '5 Cr' → 50000000. "
            "If not found or unclear, return exactly: NOT_FOUND\n\n"
            f"Document:\n{text[:3000]}\n\nTurnover in rupees:"
        )
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            max_tokens=30,
        )
        result = response.choices[0].message.content.strip()

        if "NOT_FOUND" in result.upper() or not result:
            return None, CONFIDENCE_NOT_FOUND, None

        val_str = re.sub(r"[^\d.]", "", result)
        if val_str:
            val = float(val_str)
            conf = CONFIDENCE_LLM_AMBIGUOUS if is_ocr else CONFIDENCE_LLM
            return val, conf, "LLM extraction"

    except Exception:
        pass

    return None, CONFIDENCE_NOT_FOUND, None


# ---------------------------------------------------------------------------
# GST extraction
# ---------------------------------------------------------------------------

def extract_gst(text: str, is_ocr: bool) -> Tuple[Optional[bool], float, Optional[str]]:
    patterns = [
        # Full GSTIN format: 07AABCU9603R1ZV
        r"\b\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b",
        r"gstin\s*[:=]?\s*\w+",
        r"gst\s*(?:no|number|reg(?:istration)?)\s*[:=]",
        r"gst\s*certificate",
        r"registered\s+under\s+gst",
    ]

    for pat in patterns:
        if re.search(pat, text, re.IGNORECASE):
            conf = CONFIDENCE_REGEX_OCR if is_ocr else CONFIDENCE_REGEX_CLEAN
            return True, conf, "keyword/pattern match"

    return _extract_gst_llm(text, is_ocr)


def _extract_gst_llm(text: str, is_ocr: bool) -> Tuple[Optional[bool], float, Optional[str]]:
    groq_key = os.environ.get("GROQ_API_KEY", "")
    if not groq_key or groq_key == "your_groq_api_key_here":
        return False, CONFIDENCE_NOT_FOUND, None

    try:
        from groq import Groq

        client = Groq(api_key=groq_key)
        prompt = (
            "Determine whether this bidder document contains evidence of valid GST registration. "
            "Return ONLY FOUND or NOT_FOUND. Treat a GSTIN, GST registration number, GST certificate, "
            "or explicit statement that the firm is registered under GST as FOUND.\n\n"
            f"Document:\n{text[:3000]}\n\nGST registration evidence:"
        )
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            max_tokens=20,
        )
        result = response.choices[0].message.content.strip().upper()

        if "NOT_FOUND" in result or not result:
            return False, CONFIDENCE_NOT_FOUND, None

        if "FOUND" in result or re.search(
            r"\b\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b",
            result,
            re.IGNORECASE,
        ):
            conf = CONFIDENCE_LLM_AMBIGUOUS if is_ocr else CONFIDENCE_LLM
            return True, conf, "LLM extraction"

    except Exception:
        pass

    return False, CONFIDENCE_NOT_FOUND, None


# ---------------------------------------------------------------------------
# Projects extraction
# ---------------------------------------------------------------------------

def extract_projects(text: str, is_ocr: bool) -> Tuple[Optional[int], float, Optional[str]]:
    patterns = [
        r"(\d+)\s*(?:similar\s+)?(?:projects?|works?|contracts?)\s*(?:completed|executed|finished|undertaken)",
        r"(?:completed|executed|finished|undertaken)\s*(\d+)\s*(?:similar\s+)?(?:projects?|works?|contracts?)",
        r"(?:experience\s+of|having\s+completed?)\s*(\d+)\s*(?:projects?|works?|contracts?)",
        r"(\d+)\s*(?:nos?\.?\s+)?(?:similar\s+)?(?:projects?|works?)",
    ]

    for pat in patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            count = int(m.group(1))
            if 0 < count < 100:
                conf = CONFIDENCE_REGEX_OCR if is_ocr else CONFIDENCE_REGEX_CLEAN
                return count, conf, "regex on text"

    # Looser: any number near project/contract keywords
    for line in text.lower().split("\n"):
        if any(kw in line for kw in ["project", "work", "contract"]):
            nums = re.findall(r"\b(\d+)\b", line)
            for n in nums:
                val = int(n)
                if 1 <= val <= 50:
                    conf = (CONFIDENCE_REGEX_OCR if is_ocr else CONFIDENCE_REGEX_CLEAN) * 0.85
                    return val, conf, "inferred from context"

    return None, CONFIDENCE_NOT_FOUND, None
