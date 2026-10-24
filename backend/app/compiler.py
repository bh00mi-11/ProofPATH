"""
Recipient-Aware Disclosure Compiler & Redaction Verification for ProofPath.
Generates an allowlisted, privacy-checked, multi-page PDF disclosure report.
Enforces:
1. Strict server-side field allowlists per Recipient Type:
   - TRUSTED_CONTACT: Summary view only (high-level categories, sanitized statements, no forensic metadata, no raw timestamps or internal IDs).
   - SUPPORT_ORGANIZATION: Contextual support view (incident categories, dates, support notes, observation summaries, no raw identifiers).
   - LEGAL_PROFESSIONAL: Formal timeline disclosure (full structured timeline, observation source types, cryptographic SHA-256 integrity proofs, link relations).
2. Raw image attachments are strictly excluded to prevent forensic visual leakage.
3. Flowable multi-page document layout using ReportLab SimpleDocTemplate, Paragraphs, and Spacers to prevent text clipping.
4. Privacy verification scanning extracted PDF text and PDF metadata against seeded sensitive identifiers and forbidden terms.
5. Immediate blocking of download if privacy check fails.
6. Clear distinctions between:
   - User-Reported Claims
   - Observed Evidence (derived from ingested artifacts)
   - Unresolved Conflicts / Review Required
7. Explicit disclaimer: Does not guarantee complete anonymity.
"""
import io
import re
from typing import Dict, List, Any, Optional, Set
from enum import Enum
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    KeepTogether
)
import pypdf

class RecipientType(str, Enum):
    TRUSTED_CONTACT = "TRUSTED_CONTACT"
    SUPPORT_ORGANIZATION = "SUPPORT_ORGANIZATION"
    LEGAL_PROFESSIONAL = "LEGAL_PROFESSIONAL"

# Server-side strict allowlists of approved fields per recipient type
RECIPIENT_FIELD_ALLOWLISTS: Dict[str, Set[str]] = {
    RecipientType.TRUSTED_CONTACT.value: {
        "case_title",
        "category",
        "claim_text",
        "verification_state",
        "summary_note"
    },
    RecipientType.SUPPORT_ORGANIZATION.value: {
        "case_title",
        "category",
        "incident_date",
        "claim_text",
        "verification_state",
        "summary_note",
        "observation_type_count"
    },
    RecipientType.LEGAL_PROFESSIONAL.value: {
        "case_title",
        "category",
        "incident_date",
        "incident_time",
        "claim_text",
        "claim_id",
        "verification_state",
        "summary_note",
        "observation_details",
        "evidence_sha256",
        "relation"
    }
}

RECIPIENT_WARNINGS: Dict[str, List[str]] = {
    RecipientType.TRUSTED_CONTACT.value: [
        "Sensitive forensic identifiers, exact timestamps, and artifact SHA-256 hashes are omitted for personal privacy.",
        "Raw evidence media attachments are excluded.",
        "Notice: This report facilitates emotional/personal support and is not formatted for evidentiary submission."
    ],
    RecipientType.SUPPORT_ORGANIZATION.value: [
        "Identities, exact hour timestamps, and cryptographic hashes are withheld.",
        "Raw evidence images are excluded.",
        "Notice: Report is tailored for counseling and advocacy intake."
    ],
    RecipientType.LEGAL_PROFESSIONAL.value: [
        "Full forensic timeline, observation sources, and SHA-256 cryptographic integrity hashes are included.",
        "Raw image attachments are excluded from the PDF document (available via secure evidence custody export).",
        "Notice: Document constitutes a structured case evidence disclosure for counsel review."
    ]
}

def generate_disclosure_preview(
    recipient_type: str,
    case_title: str,
    claims: List[Dict[str, Any]],
    observations: List[Dict[str, Any]],
    artifacts: List[Dict[str, Any]],
    redacted_terms: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Returns disclosure preview containing included fields, excluded fields,
    applicable recipient warnings, and item count summaries.
    """
    rec_type = recipient_type.upper()
    if rec_type not in RECIPIENT_FIELD_ALLOWLISTS:
        raise ValueError(f"Invalid recipient_type '{recipient_type}'. Must be one of {[e.value for e in RecipientType]}")

    approved_fields = RECIPIENT_FIELD_ALLOWLISTS[rec_type]
    all_possible_fields = RECIPIENT_FIELD_ALLOWLISTS[RecipientType.LEGAL_PROFESSIONAL.value]
    excluded_fields = sorted(list(all_possible_fields - approved_fields))

    return {
        "recipient_type": rec_type,
        "approved_fields": sorted(list(approved_fields)),
        "excluded_fields": excluded_fields,
        "warnings": RECIPIENT_WARNINGS.get(rec_type, []),
        "included_claims_count": len(claims),
        "raw_images_excluded": True,
        "redacted_terms_count": len(redacted_terms or []),
        "disclaimer": "Notice: ProofPath provides deterministic integrity and structured disclosure; it does not promise absolute anonymity."
    }

def compile_disclosure_pdf(
    case_title: str,
    claims: List[Dict[str, Any]],
    observations: Optional[List[Dict[str, Any]]] = None,
    artifacts: Optional[List[Dict[str, Any]]] = None,
    recipient_type: str = RecipientType.LEGAL_PROFESSIONAL.value,
    redacted_terms: Optional[List[str]] = None,
    include_unverified: bool = True
) -> bytes:
    """
    Compiles a robust, multi-page, recipient-filtered PDF report.
    Applies the server-side field allowlist based on recipient_type.
    """
    rec_type = recipient_type.upper()
    if rec_type not in RECIPIENT_FIELD_ALLOWLISTS:
        raise ValueError(f"Invalid recipient_type '{recipient_type}'. Must be one of {[e.value for e in RecipientType]}")

    approved_fields = RECIPIENT_FIELD_ALLOWLISTS[rec_type]
    redacted_terms = [t.strip() for t in (redacted_terms or []) if t.strip()]

    def sanitize(text: Optional[str]) -> str:
        if not text:
            return ""
        res = str(text)
        for term in redacted_terms:
            pattern = re.escape(term)
            res = re.sub(pattern, "[REDACTED]", res, flags=re.IGNORECASE)
        return res

    obs_map = {o["id"]: o for o in (observations or [])}
    art_map = {a["id"]: a for a in (artifacts or [])}

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0f172a'),
        spaceAfter=6
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#475569'),
        spaceAfter=12
    )
    badge_style = ParagraphStyle(
        'RecipientBadge',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#1e40af'),
        backColor=colors.HexColor('#dbeafe'),
        borderPadding=4,
        spaceAfter=14
    )
    claim_header_style = ParagraphStyle(
        'ClaimHeader',
        parent=styles['Heading3'],
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#0f172a'),
        spaceAfter=4
    )
    body_style = ParagraphStyle(
        'ReportBody',
        parent=styles['Normal'],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#1e293b'),
        spaceAfter=4
    )
    meta_style = ParagraphStyle(
        'ReportMeta',
        parent=styles['Normal'],
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#64748b'),
        spaceAfter=3
    )
    warning_style = ParagraphStyle(
        'NoticeWarning',
        parent=styles['Normal'],
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#991b1b'),
        backColor=colors.HexColor('#fef2f2'),
        borderPadding=5,
        spaceAfter=8
    )

    story = []

    # Document Header
    story.append(Paragraph("PROOFPATH EVIDENCE DISCLOSURE REPORT", title_style))
    story.append(Paragraph(f"<b>Case:</b> {sanitize(case_title)} | <b>Generated:</b> Deterministic Trace Engine", subtitle_style))
    story.append(Paragraph(f"<b>Recipient Profile:</b> {rec_type.replace('_', ' ')} (Server-Side Allowlist Applied)", badge_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#cbd5e1'), spaceAfter=12))

    # Recipient Warnings & Disclaimer
    warnings = RECIPIENT_WARNINGS.get(rec_type, [])
    for w in warnings:
        story.append(Paragraph(f"<b>Notice:</b> {w}", warning_style))
    story.append(Paragraph("<b>Privacy Disclaimer:</b> ProofPath enforces field allowlists and cryptographic hashing; it does not guarantee absolute anonymity.", meta_style))
    story.append(Spacer(1, 12))

    # Claims & Evidence Section
    story.append(Paragraph("<b>Structured Timeline & Disclosure Items:</b>", styles['Heading2']))
    story.append(Spacer(1, 6))

    displayed_count = 0
    for idx, c in enumerate(claims, 1):
        state = c.get("state", "UNVERIFIED")
        if not include_unverified and state == "UNVERIFIED":
            continue

        displayed_count += 1
        claim_elements = []

        # Verification state label mapping
        state_label_map = {
            "SUPPORTED": "SUPPORTED (Active Observations Corroborate)",
            "CONFLICTED": "CONFLICTED (Contradictory Evidence or Timestamps Detected)",
            "UNVERIFIED": "USER-REPORTED CLAIM (Uncorroborated / No Active Evidence)",
            "REVIEW_NEEDED": "REVIEW REQUIRED (Contradiction Only or Integrity Issue Detected)"
        }
        state_display = state_label_map.get(state, state)

        # Build claim header
        header_parts = [f"Item {idx}: [{state_display}]"]
        if "incident_date" in approved_fields:
            raw_time = c.get("incident_time") or "N/A"
            # In SUPPORT_ORGANIZATION, display only date part
            if rec_type == RecipientType.SUPPORT_ORGANIZATION.value and " " in raw_time:
                date_part = raw_time.split(" ")[0]
                header_parts.append(f"Date: {date_part}")
            elif "incident_time" in approved_fields:
                header_parts.append(f"Time: {raw_time}")
            else:
                date_part = raw_time.split(" ")[0] if " " in raw_time else raw_time
                header_parts.append(f"Date: {date_part}")
        
        if "category" in approved_fields and c.get("category"):
            header_parts.append(f"Category: {c.get('category')}")

        claim_elements.append(Paragraph(" | ".join(header_parts), claim_header_style))

        # Statement Text
        if "claim_text" in approved_fields:
            claim_elements.append(Paragraph(f"<b>User Statement:</b> {sanitize(c.get('claim_text', ''))}", body_style))

        # Status / Evaluation Note
        if "summary_note" in approved_fields:
            claim_elements.append(Paragraph(f"<b>Evaluation Status:</b> {sanitize(c.get('reason', ''))}", meta_style))

        # Forensic Observation Details (if approved for recipient)
        if "observation_details" in approved_fields:
            supporting_ids = c.get("supporting_observations", [])
            contradicting_ids = c.get("contradicting_observations", [])

            if supporting_ids or contradicting_ids:
                obs_lines = []
                for oid in supporting_ids:
                    o = obs_map.get(oid, {})
                    art = art_map.get(o.get("artifact_id"), {})
                    sha_str = f" [SHA-256: {art.get('sha256', 'N/A')[:16]}...]" if "evidence_sha256" in approved_fields and art.get("sha256") else ""
                    obs_lines.append(f"• <b>Observed Evidence ({o.get('source_type', 'record')}):</b> {sanitize(o.get('field', ''))} = '{sanitize(o.get('value', ''))}' (Relation: SUPPORTS){sha_str}")

                for oid in contradicting_ids:
                    o = obs_map.get(oid, {})
                    art = art_map.get(o.get("artifact_id"), {})
                    sha_str = f" [SHA-256: {art.get('sha256', 'N/A')[:16]}...]" if "evidence_sha256" in approved_fields and art.get("sha256") else ""
                    obs_lines.append(f"• <b>Contradicting Observation ({o.get('source_type', 'record')}):</b> {sanitize(o.get('field', ''))} = '{sanitize(o.get('value', ''))}' (Relation: CONTRADICTS){sha_str}")

                for line in obs_lines:
                    claim_elements.append(Paragraph(line, meta_style))

        elif "observation_type_count" in approved_fields:
            # High level count for support organizations
            sup_count = len(c.get("supporting_observations", []))
            con_count = len(c.get("contradicting_observations", []))
            claim_elements.append(Paragraph(f"<b>Evidence Corroboration:</b> {sup_count} supporting source(s), {con_count} conflicting source(s). Raw details withheld.", meta_style))

        claim_elements.append(Spacer(1, 8))
        story.append(KeepTogether(claim_elements))

    if displayed_count == 0:
        story.append(Paragraph("No claims matching disclosure criteria.", body_style))

    story.append(Spacer(1, 16))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#e2e8f0'), spaceAfter=8))
    story.append(Paragraph("<b>End of Disclosure Report</b> — Generated strictly via ProofPath recipient allowlist policy. Raw images excluded.", meta_style))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()

def verify_pdf_privacy_leakage(
    pdf_bytes: bytes,
    forbidden_terms: List[str]
) -> Dict[str, Any]:
    """
    Deeply extracts text and document metadata from generated PDF bytes
    and scans for leaked forbidden terms or seeded PII identifiers.
    Blocks export if any forbidden term appears in body text or metadata.
    """
    reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
    
    extracted_text = ""
    for page in reader.pages:
        extracted_text += (page.extract_text() or "") + "\n"

    # Also extract document metadata
    metadata_text = ""
    if reader.metadata:
        for k, v in reader.metadata.items():
            metadata_text += f"{k}: {v}\n"

    full_scanned_text = extracted_text + "\n" + metadata_text

    leaks = []
    for term in forbidden_terms:
        clean_term = term.strip()
        if clean_term and re.search(re.escape(clean_term), full_scanned_text, flags=re.IGNORECASE):
            leaks.append(clean_term)

    return {
        "passed": len(leaks) == 0,
        "leaked_terms": leaks,
        "checked_terms_count": len(forbidden_terms),
        "total_extracted_characters": len(full_scanned_text)
    }
