"""
Disclosure Compiler & Redaction Verification for ProofPath.
Generates an allowlisted, privacy-checked PDF.
Scans compiled document text for leaked private strings.
"""
import io
import re
from typing import Dict, List, Any, Optional
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import pypdf

def compile_disclosure_pdf(
    case_title: str,
    claims: List[Dict[str, Any]],
    redacted_terms: Optional[List[str]] = None,
    include_unverified: bool = True
) -> bytes:
    redacted_terms = [t.strip() for t in (redacted_terms or []) if t.strip()]
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    
    p.setFont("Helvetica-Bold", 16)
    p.drawString(50, 750, f"PROOFPATH EVIDENCE DISCLOSURE REPORT")
    
    p.setFont("Helvetica", 10)
    p.drawString(50, 730, f"Case: {case_title}")
    p.drawString(50, 715, "Generated via ProofPath Deterministic Trace Engine")
    p.line(50, 705, 550, 705)
    
    y = 680
    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, y, "Verified Claims & Evidence Summary:")
    y -= 25

    def sanitize(text: str) -> str:
        res = text
        for term in redacted_terms:
            pattern = re.escape(term)
            res = re.sub(pattern, "[REDACTED]", res, flags=re.IGNORECASE)
        return res

    for idx, c in enumerate(claims, 1):
        if not include_unverified and c.get("state") == "UNVERIFIED":
            continue
            
        state = c.get("state", "UNVERIFIED")
        claim_text = sanitize(c.get("claim_text", ""))
        reason = sanitize(c.get("reason", ""))
        
        p.setFont("Helvetica-Bold", 10)
        p.drawString(50, y, f"{idx}. [{state}] {c.get('incident_time', 'N/A')}")
        y -= 15
        
        p.setFont("Helvetica", 10)
        p.drawString(70, y, f"Statement: {claim_text}")
        y -= 15
        
        p.setFont("Helvetica-Oblique", 9)
        p.drawString(70, y, f"Status note: {reason}")
        y -= 25
        
        if y < 80:
            p.showPage()
            y = 750

    p.setFont("Helvetica-Bold", 9)
    p.drawString(50, 40, "CONFIDENTIAL - RESTRICTED RECIPIENT ACCESS ONLY")
    p.save()
    
    buffer.seek(0)
    return buffer.getvalue()

def verify_pdf_privacy_leakage(pdf_bytes: bytes, forbidden_terms: List[str]) -> Dict[str, Any]:
    """
    Extracts text from generated PDF and inspects for forbidden terms/PII.
    Blocks export if any forbidden term appears.
    """
    reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
    full_text = ""
    for page in reader.pages:
        full_text += page.extract_text() or ""
        
    leaks = []
    for term in forbidden_terms:
        term = term.strip()
        if term and re.search(re.escape(term), full_text, flags=re.IGNORECASE):
            leaks.append(term)
            
    return {
        "passed": len(leaks) == 0,
        "leaked_terms": leaks,
        "checked_terms_count": len(forbidden_terms)
    }
