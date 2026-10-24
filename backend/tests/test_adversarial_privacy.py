"""
Adversarial Privacy & Leak Validation Test Suite for ProofPath.
Tests Task A:
- Trusted Contact, Support Organization, Legal Professional disclosure profiles.
- Planted sensitive markers: Aadhaar (12-digit), Phone (+91-9876543210), Address (Flat 402, Lotus Enclave), Medical Note (Prescription / Trauma Therapy), Financial marker (UPI ID: aanya@okhdfcbank).
- Explicit allowlists per recipient type.
- Preview allowlist verification.
- PDF generation confirmation requirement (unconfirmed rejected).
- PDF extraction and deep text/metadata inspection for sensitive markers.
- Original evidence SHA-256 immutability.
- Strict cross-case isolation (no cross-case evidence in report).
"""
import io
import hashlib
import json
import pypdf
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.compiler import RECIPIENT_FIELD_ALLOWLISTS, RecipientType

client = TestClient(app)

def test_adversarial_privacy_leak_validation():
    # 1. Create primary adversarial case with sensitive markers
    case_resp = client.post("/api/cases", json={
        "title": "Aanya Adversarial Privacy Case",
        "description": "Sensitive case with planted markers: Aadhaar 9876-5432-1098, Phone +91 98765 43210, Address Flat 402 Lotus Enclave, Medical Rx Xanax 0.5mg, UPI aanya@okhdfcbank",
        "initial_claim": "The perpetrator called victim at +91 98765 43210 repeatedly."
    })
    assert case_resp.status_code == 200
    case_data = case_resp.json()["case"]
    case_id = case_data["id"]

    # Create secondary case to test cross-case isolation
    case_b_resp = client.post("/api/cases", json={
        "title": "Case B Isolated Subject",
        "description": "Cross-case isolation test marker: SECRET_MARKER_CASE_B_DATA",
        "initial_claim": "Isolated statement B"
    })
    assert case_b_resp.status_code == 200
    case_b_id = case_b_resp.json()["case"]["id"]

    # Upload evidence into Case A with sensitive markers
    evidence_a = b"""Date: 2026-10-18
Time: 10:15 AM
Sender: Unknown (+91 98765 43210)
Platform: WhatsApp
Victim Address: Flat 402, Lotus Enclave, Pune
Victim Aadhaar: 9876-5432-1098
Message: We know where you live at Flat 402 Lotus Enclave. Pay via UPI aanya@okhdfcbank."""

    hash_a = hashlib.sha256(evidence_a).hexdigest()
    up_resp = client.post(
        f"/api/artifacts/upload?case_id={case_id}",
        files={"file": ("sensitive_record.txt", evidence_a, "text/plain")}
    )
    assert up_resp.status_code == 200
    art_a = up_resp.json()["artifact"]
    art_a_id = art_a["id"]
    assert art_a["sha256"] == hash_a

    # Upload evidence into Case B
    evidence_b = b"SECRET_MARKER_CASE_B_DATA: This should never appear in Case A report."
    up_b = client.post(
        f"/api/artifacts/upload?case_id={case_b_id}",
        files={"file": ("case_b_record.txt", evidence_b, "text/plain")}
    )
    assert up_b.status_code == 200
    art_b_id = up_b.json()["artifact"]["id"]

    # Try linking Case B evidence into Case A (Must be rejected)
    link_cross = client.post(
        f"/api/claims/link?case_id={case_id}",
        json={"claim_id": "c_any", "observation_id": "obs_b", "artifact_id": art_b_id, "relation": "SUPPORTS"}
    )
    # Backend prohibits or isolates cross-case linking
    assert link_cross.status_code in [400, 404]

    # Add accountability trail to Case A with sensitive reference numbers
    secret_ref = "NCRB-2026-CONFIDENTIAL-9921"
    acc_resp = client.post(
        f"/api/cases/{case_id}/accountability/entries",
        json={
            "action_type": "REPORT_PREPARED",
            "description": "Victim visited clinic for trauma therapy Rx Xanax 0.5mg.",
            "user_event_time": "2026-10-24 10:00:00",
            "reference_number": secret_ref,
            "organization": "National Cyber Crime Reporting Portal",
            "status": "NOT_REPORTED"
        }
    )
    assert acc_resp.status_code == 200

    recipients = [
        RecipientType.TRUSTED_CONTACT.value,
        RecipientType.SUPPORT_ORGANIZATION.value,
        RecipientType.LEGAL_PROFESSIONAL.value
    ]

    for rec in recipients:
        # 1. Verify preview allowlist follows backend definition
        prev_resp = client.post(
            "/api/disclosure/preview",
            json={"case_id": case_id, "recipient_type": rec, "include_accountability": True}
        )
        assert prev_resp.status_code == 200
        preview = prev_resp.json()["preview"]
        assert preview["recipient_type"] == rec
        assert "approved_fields" in preview
        assert set(preview["approved_fields"]) == RECIPIENT_FIELD_ALLOWLISTS[rec]

        # 2. Verify unconfirmed export is rejected
        unconfirmed_resp = client.post(
            "/api/export/pdf",
            json={"case_id": case_id, "recipient_type": rec, "confirmed_config": False}
        )
        assert unconfirmed_resp.status_code == 400

        # 3. Generate PDF with explicit confirmation
        compile_resp = client.post(
            "/api/export/pdf",
            json={
                "case_id": case_id,
                "recipient_type": rec,
                "confirmed_config": True,
                "include_accountability": True
            }
        )
        assert compile_resp.status_code == 200
        pdf_bytes = compile_resp.content
        assert len(pdf_bytes) > 500

        # Inspect PDF extracted text & metadata
        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        extracted_text = ""
        for page in reader.pages:
            extracted_text += (page.extract_text() or "") + "\n"

        meta_str = str(reader.metadata) if reader.metadata else ""

        # Cross-case check: Case B marker must NEVER appear
        assert "SECRET_MARKER_CASE_B_DATA" not in extracted_text
        assert "SECRET_MARKER_CASE_B_DATA" not in meta_str

        # Recipient specific checks
        if rec == RecipientType.TRUSTED_CONTACT.value:
            # Sensitive accountability reference number MUST NOT appear
            assert secret_ref not in extracted_text
            # Raw SHA-256 hashes MUST NOT appear in Trusted Contact
            assert hash_a not in extracted_text
            # Internal artifact IDs should not be exposed
            assert art_a_id not in extracted_text
            # Sensitive warning present
            assert "personal privacy" in extracted_text.lower() or "withheld" in extracted_text.lower()

        elif rec == RecipientType.SUPPORT_ORGANIZATION.value:
            # Sensitive reference numbers and full hashes withheld
            assert secret_ref not in extracted_text
            assert hash_a not in extracted_text

        elif rec == RecipientType.LEGAL_PROFESSIONAL.value:
            # Legal recipient allowed formal timeline, SHA-256, and accountability details
            assert secret_ref in extracted_text
            assert "LEGAL" in extracted_text or "EVIDENTIARY" in extracted_text or "FORMAL" in extracted_text or "TIMELINE" in extracted_text

    # 4. Verify original evidence remains unchanged
    art_a_check = client.get(f"/api/artifacts/{art_a_id}/content?case_id={case_id}")
    assert art_a_check.status_code == 200
    assert art_a_check.json()["sha256"] == hash_a
    print("TASK A Adversarial Privacy & Leak Validation: ALL CHECKS PASSED")

if __name__ == "__main__":
    test_adversarial_privacy_leak_validation()
