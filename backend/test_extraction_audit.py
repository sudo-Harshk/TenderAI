import os
import sys
import types
import unittest
from datetime import datetime

import audit
import extractor
from audit import add_to_audit, audit_log, reset_all, update_review
from models import BidderResult, CriterionResult, Decision


class ExtractionAuditTests(unittest.TestCase):
    def tearDown(self):
        reset_all()
        os.environ.pop("GROQ_API_KEY", None)
        os.environ.pop("MISTRAL_API_KEY", None)

    def test_review_appends_audit_entry_and_preserves_original(self):
        result = BidderResult(
            bidder_id="BID123",
            bidder_name="Acme Infra",
            overall_decision=Decision.FLAGGED,
            evaluated_at=datetime.utcnow(),
            criteria_results=[
                CriterionResult(
                    criterion_id="C1",
                    criterion_label="Annual Turnover >= 5 Crore",
                    extracted_value=None,
                    extracted_display="Not found",
                    required_value="₹5 Crore",
                    source_page=None,
                    confidence=0.30,
                    decision=Decision.FLAGGED,
                    explanation="Flagged for officer verification.",
                )
            ],
        )

        add_to_audit(result)
        updated = update_review("BID123", "C1", "6 Cr", "Officer A")

        self.assertIsNotNone(updated)
        self.assertEqual(len(audit_log), 2)
        self.assertEqual(audit_log[0].event_type, "EXTRACTED")
        self.assertEqual(audit_log[0].decision, Decision.FLAGGED)
        self.assertEqual(audit_log[0].confidence, 0.30)
        self.assertIsNone(audit_log[0].reviewed_by)
        self.assertEqual(audit_log[1].event_type, "REVIEWED")
        self.assertEqual(audit_log[1].decision, Decision.PASS)
        self.assertEqual(audit_log[1].reviewed_by, "Officer A")
        self.assertEqual(audit_log[1].override_value, "6 Cr")

    def test_turnover_conflict_returns_low_confidence_flag_signal(self):
        value, confidence, source = extractor.extract_turnover(
            "Annual turnover ₹3 Cr. Revised annual turnover ₹6 Cr.",
            is_ocr=False,
        )

        self.assertIsNone(value)
        self.assertEqual(confidence, extractor.CONFIDENCE_NOT_FOUND)
        self.assertEqual(source, "conflict: multiple turnover candidates")

    def test_gst_llm_fallback_can_find_registration_evidence(self):
        class FakeCompletions:
            def create(self, **_kwargs):
                message = types.SimpleNamespace(content="FOUND")
                choice = types.SimpleNamespace(message=message)
                return types.SimpleNamespace(choices=[choice])

        class FakeChat:
            completions = FakeCompletions()

        class FakeGroq:
            def __init__(self, api_key):
                self.api_key = api_key
                self.chat = FakeChat()

        fake_groq_module = types.ModuleType("groq")
        fake_groq_module.Groq = FakeGroq
        original_groq = sys.modules.get("groq")
        sys.modules["groq"] = fake_groq_module
        os.environ["GROQ_API_KEY"] = "test-key"

        try:
            value, confidence, source = extractor.extract_gst(
                "The bidder has submitted indirect tax registration evidence.",
                is_ocr=False,
            )
        finally:
            if original_groq is None:
                sys.modules.pop("groq", None)
            else:
                sys.modules["groq"] = original_groq

        self.assertTrue(value)
        self.assertEqual(confidence, extractor.CONFIDENCE_LLM)
        self.assertEqual(source, "LLM extraction")

    def test_mixed_pdf_triggers_ocr_when_text_doc_has_image_only_page(self):
        class FakePage:
            def __init__(self, text, images):
                self._text = text
                self._images = images

            def get_text(self):
                return self._text

            def get_images(self, full=True):
                return self._images

        class FakeDoc:
            pages = [FakePage("Tender text " * 80, []), FakePage("", [("image",)])]

            def __len__(self):
                return len(self.pages)

            def __getitem__(self, index):
                return self.pages[index]

            def close(self):
                pass

        fake_fitz_module = types.ModuleType("fitz")
        fake_fitz_module.open = lambda **_kwargs: FakeDoc()
        original_fitz = sys.modules.get("fitz")
        original_ocr = extractor._extract_text_mistral_ocr
        sys.modules["fitz"] = fake_fitz_module
        extractor._extract_text_mistral_ocr = lambda _pdf_bytes: "OCR TEXT"
        os.environ["MISTRAL_API_KEY"] = "test-key"

        try:
            text, is_ocr = extractor.extract_text_from_pdf(b"%PDF fake")
        finally:
            extractor._extract_text_mistral_ocr = original_ocr
            if original_fitz is None:
                sys.modules.pop("fitz", None)
            else:
                sys.modules["fitz"] = original_fitz

        self.assertEqual(text, "OCR TEXT")
        self.assertTrue(is_ocr)


if __name__ == "__main__":
    unittest.main()
