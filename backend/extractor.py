import re
import os
import base64
from typing import Optional, Tuple

CONFIDENCE_REGEX_CLEAN = 0.95
CONFIDENCE_REGEX_OCR = 0.75
CONFIDENCE_LLM = 0.70
CONFIDENCE_LLM_AMBIGUOUS = 0.50
CONFIDENCE_NOT_FOUND = 0.30


def extract_text_from_pdf(pdf_bytes: bytes) -> Tuple[str, bool]:
    """Extract text using PyMuPDF. Falls back to Mistral OCR for scanned docs."""
    text = ""

    try:
        import fitz

        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        try:
            for page_num in range(min(15, len(doc))):
                text += doc[page_num].get_text()
        finally:
            doc.close()

        if len(text.strip()) > 500:
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
        return text, True

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

    # Pattern 1: "turnover ... X crore/Cr"
    m = re.search(
        r"(?:annual|total|gross)?\s*turnover[^.]{0,60}?"
        r"(?:rs\.?\s*|inr\s*|₹\s*)?(\d+(?:\.\d+)?)\s*(?:crore?s?|cr)\b",
        text_norm,
    )
    if m:
        val = float(m.group(1)) * 10_000_000
        return val, CONFIDENCE_REGEX_OCR if is_ocr else CONFIDENCE_REGEX_CLEAN, "regex on text"

    # Pattern 2: "Rs./₹ X Cr" or "INR X Cr"
    m = re.search(
        r"(?:rs\.?\s*|inr\s*|₹\s*)(\d+(?:\.\d+)?)\s*(?:crore?s?|cr)\b",
        text_norm,
    )
    if m:
        val = float(m.group(1)) * 10_000_000
        return val, CONFIDENCE_REGEX_OCR if is_ocr else CONFIDENCE_REGEX_CLEAN, "regex on text"

    # Pattern 3: "turnover ... X lakh"
    m = re.search(
        r"(?:annual|total|gross)?\s*turnover[^.]{0,60}?(\d+(?:\.\d+)?)\s*(?:lakhs?|lac)\b",
        text_norm,
    )
    if m:
        val = float(m.group(1)) * 100_000
        return val, CONFIDENCE_REGEX_OCR if is_ocr else CONFIDENCE_REGEX_CLEAN, "regex on text"

    # Pattern 4: Indian number format near turnover keyword (e.g. Rs. 3,10,00,000)
    m = re.search(
        r"turnover[\s\S]{0,120}?(?:rs\.?\s*|inr\s*|₹\s*)?(\d{1,2},\d{2},\d{2},\d{3})\b",
        text_norm,
    )
    if m:
        val = float(m.group(1).replace(",", ""))
        return val, CONFIDENCE_REGEX_OCR if is_ocr else CONFIDENCE_REGEX_CLEAN, "regex on text"

    # Pattern 5: any standalone "X Cr/Crore" in the document
    m = re.search(r"\b(\d+(?:\.\d+)?)\s*(?:crore?s?|cr)\b", text_norm)
    if m:
        val = float(m.group(1)) * 10_000_000
        conf = (CONFIDENCE_REGEX_OCR if is_ocr else CONFIDENCE_REGEX_CLEAN) * 0.88
        return val, conf, "regex on text (low specificity)"

    # LLM fallback
    return _extract_turnover_llm(text, is_ocr)


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
