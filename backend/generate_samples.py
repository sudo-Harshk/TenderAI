from pathlib import Path

import fitz
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT_DIR = Path(__file__).resolve().parents[1]
SAMPLE_DIR = ROOT_DIR / "sample_data"


SAMPLES = [
    {
        "filename": "acme_constructions.pdf",
        "company": "Acme Constructions Pvt Ltd",
        "address": "45, Industrial Area, Phase II, New Delhi - 110020",
        "turnover": "Rs. 3,10,00,000",
        "turnover_words": "Rupees Three Crore Ten Lakhs Only",
        "year": "2023-24",
        "gstin": "07AABCA9603R1ZP",
        "pan": "AABCA9603R",
        "projects_count": "3",
        "projects": [
            "Construction of boundary wall, CRPF Camp, Gurgaon - 2022",
            "Civil works, Police Quarters, Delhi - 2023",
            "Renovation works, Government Office, Noida - 2024",
        ],
        "ca": "CA Rajesh Kumar",
        "membership": "123456",
        "date": "15-March-2024",
        "udin": "24123456AAAABB1234",
    },
    {
        "filename": "buildright.pdf",
        "company": "BuildRight Pvt Ltd",
        "address": "78, Connaught Place, New Delhi - 110001",
        "turnover": "Rs. 6,20,00,000",
        "turnover_words": "Rupees Six Crore Twenty Lakhs Only",
        "year": "2023-24",
        "gstin": "29AADCB2230M1ZP",
        "pan": "AADCB2230M",
        "projects_count": "4",
        "projects": [
            "Construction works, BSF Camp, Jodhpur - 2021",
            "Civil works, CRPF Headquarters, Delhi - 2022",
            "Infrastructure works, MHA Campus, Delhi - 2023",
            "Building construction, Paramilitary Quarters - 2024",
        ],
        "ca": "CA Suresh Mehta",
        "membership": "234567",
        "date": "20-March-2024",
        "udin": "24234567AAAABB5678",
    },
    {
        "filename": "sharma_enterprises.pdf",
        "company": "Sharma Enterprises",
        "address": "12, Lajpat Nagar, New Delhi - 110024",
        "turnover": "Rs. 6,2O,OO,OOO",
        "turnover_words": "amount as per enclosed balance sheet",
        "year": "2023-24",
        "gstin": "27AASCS1429B1Z5",
        "pan": "AASCS1429B",
        "projects_count": "2",
        "projects": [
            "Civil works, Government Office - 2023",
            "Construction, Police Station - 2024",
        ],
        "ca": "CA Amit Sharma",
        "membership": "345678",
        "date": "18-March-2024",
        "udin": "24345678AAAABB9012",
    },
]


def build_certificate(sample: dict[str, object]) -> None:
    SAMPLE_DIR.mkdir(parents=True, exist_ok=True)
    output_path = SAMPLE_DIR / str(sample["filename"])

    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=A4,
        rightMargin=22 * mm,
        leftMargin=22 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "CertificateTitle",
        parent=styles["Title"],
        alignment=TA_CENTER,
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=colors.black,
        spaceAfter=12,
    )
    header_style = ParagraphStyle(
        "GovernmentHeader",
        parent=styles["Heading2"],
        alignment=TA_CENTER,
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=15,
        textColor=colors.black,
        spaceAfter=4,
    )
    body_style = ParagraphStyle(
        "CertificateBody",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=10.5,
        leading=15,
        textColor=colors.black,
    )
    small_style = ParagraphStyle(
        "CertificateSmall",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=13,
        textColor=colors.black,
    )

    details = [
        ["Name of Firm", f"M/s {sample['company']}"],
        ["Registered Address", str(sample["address"])],
        ["Annual Turnover", str(sample["turnover"])],
        ["Amount in Words", f"({sample['turnover_words']})"],
        ["Financial Year", str(sample["year"])],
        ["GSTIN", str(sample["gstin"])],
        ["PAN", str(sample["pan"])],
        ["Similar Projects Completed in last 5 years", str(sample["projects_count"])],
    ]

    project_rows = [["S. No.", "Project Details"]]
    project_rows.extend(
        [str(index), project]
        for index, project in enumerate(sample["projects"], start=1)
    )

    story = [
        Paragraph("GOVERNMENT OF INDIA", header_style),
        Paragraph("Office of Procurement and Works Certification", small_style),
        Spacer(1, 8),
        Paragraph("ANNUAL TURNOVER CERTIFICATE", title_style),
        Paragraph(
            (
                f"This is to certify that M/s {sample['company']}, registered at "
                f"{sample['address']} has an annual turnover of {sample['turnover']} "
                f"({sample['turnover_words']}) for the financial year {sample['year']} "
                "as per audited balance sheet."
            ),
            body_style,
        ),
        Spacer(1, 12),
        Table(
            details,
            colWidths=[62 * mm, 96 * mm],
            style=[
                ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
                ("BACKGROUND", (0, 0), (0, -1), colors.whitesmoke),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 9.5),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ],
        ),
        Spacer(1, 12),
        Paragraph(
            f"Similar projects completed in last 5 years: {sample['projects_count']}",
            body_style,
        ),
        Spacer(1, 6),
        Table(
            project_rows,
            colWidths=[18 * mm, 140 * mm],
            style=[
                ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
                ("BACKGROUND", (0, 0), (-1, 0), colors.whitesmoke),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 9.5),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ],
        ),
        Spacer(1, 16),
        Paragraph(f"Certified by: {sample['ca']}", body_style),
        Paragraph(f"Membership No: {sample['membership']}", body_style),
        Paragraph(f"Date: {sample['date']}", body_style),
        Paragraph(f"UDIN: {sample['udin']}", body_style),
    ]

    doc.build(story, onFirstPage=draw_border, onLaterPages=draw_border)


def draw_border(canvas, doc) -> None:
    width, height = A4
    margin = 10 * mm
    canvas.saveState()
    canvas.setStrokeColor(colors.black)
    canvas.setLineWidth(1)
    canvas.rect(margin, margin, width - 2 * margin, height - 2 * margin)
    canvas.restoreState()


def print_extracted_text(pdf_path: Path) -> None:
    print(f"\n===== {pdf_path.name} =====")
    with fitz.open(pdf_path) as doc:
        text = ""
        for page_num in range(len(doc)):
            text += doc[page_num].get_text()
    print(text.strip())


def main() -> None:
    for sample in SAMPLES:
        build_certificate(sample)

    for pdf_path in sorted(SAMPLE_DIR.glob("*.pdf")):
        if pdf_path.name in {str(sample["filename"]) for sample in SAMPLES}:
            print_extracted_text(pdf_path)


if __name__ == "__main__":
    main()
