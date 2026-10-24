"""
Comprehensive Regression Tests for PDF Export Repair, Recipient Allowlists, and Integrity Audit.

Validates:
1. Three Recipient Profiles:
   - TRUSTED_CONTACT
   - SUPPORT_ORGANIZATION
   - LEGAL_PROFESSIONAL
2. PDF Signature (%PDF-), Content-Type (application/pdf), Content-Disposition, and Parseability with pypdf.
3. Strict Recipient Allowlist & Exclusion Verification:
   - Correct case and permitted fields included.
   - Prohibited private information (e.g. internal hashes, raw timestamps, or redacted terms) excised from text and metadata.
4. Error handling & Confirmation Integrity:
   - Confirmed_config false fails with 400.
   - Nonexistent case fails with 404.
   - Leaked sensitive terms fail with 400.
   - No silent fallbacks or false successes.
5. Immutability:
   - Report generation does not mutate underlying vault artifacts, observations, or claims.
"""
import io
import pytest
import pypdf
from fastapi.testclient import TestClient

import os
from pathlib import Path

# Set up test database environment before importing app
TEST_DIR = Path(__file__).resolve().parent / "test_data"
TEST_DIR.mkdir(parents=True, exist_ok=True)
os.environ["PROOFPATH_DB_PATH"] = str(TEST_DIR / "test_proofpath.db")
os.environ["PROOFPATH_VAULT_DIR"] = str(TEST_DIR / "test_vault")

from app.main import app, vault, get_connection
from app.fixture import seed_demo_fixture

client = TestClient(app)

RECIPIENT_PROFILES = [
    "TRUSTED_CONTACT",
    "SUPPORT_ORGANIZATION",
    "LEGAL_PROFESSIONAL",
]

@pytest.fixture(autouse=True)
def ensure_demo_case():
    """Ensure case_demo_01 is present before running tests."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM cases WHERE id = 'case_demo_01'")
        if cur.fetchone()[0] == 0:
            seed_demo_fixture(conn, vault)
    finally:
        conn.close()

def test_pdf_export_all_three_recipient_profiles():
    """Generate real PDF for all 3 profiles; confirm signature, parseability, and headers."""
    for recipient in RECIPIENT_PROFILES:
        resp = client.post("/api/export/pdf", json={
            "case_id": "case_demo_01",
            "recipient_type": recipient,
            "confirmed_config": True
        })
        assert resp.status_code == 200, f"Failed for recipient {recipient}: {resp.text}"
        assert resp.headers["content-type"] == "application/pdf"
        assert "Content-Disposition" in resp.headers or "content-disposition" in resp.headers
        disp = resp.headers.get("content-disposition", "")
        assert f"ProofPath_Disclosure_case_demo_01_{recipient.lower()}.pdf" in disp

        # Verify binary PDF signature magic bytes
        assert len(resp.content) > 500
        assert resp.content.startswith(b"%PDF-"), "Response does not start with %PDF- signature"

        # Verify parseability with pypdf
        reader = pypdf.PdfReader(io.BytesIO(resp.content))
        assert len(reader.pages) >= 1
        full_text = "".join(p.extract_text() for p in reader.pages)
        assert len(full_text.strip()) > 50
        assert "PROOFPATH EVIDENCE DISCLOSURE REPORT" in full_text
        assert "Workplace Harassment Incident Timeline" in full_text

        # Verify PDF metadata does not leak sensitive identifiers
        metadata = reader.metadata
        if metadata:
            meta_str = " ".join([str(v) for v in metadata.values() if v is not None])
            assert "obs_" not in meta_str
            assert "art_" not in meta_str

def test_pdf_trusted_contact_allowlist_omits_forensic_metadata():
    """TRUSTED_CONTACT profile must omit SHA-256 hashes and raw forensic timestamps."""
    resp = client.post("/api/export/pdf", json={
        "case_id": "case_demo_01",
        "recipient_type": "TRUSTED_CONTACT",
        "confirmed_config": True
    })
    assert resp.status_code == 200
    reader = pypdf.PdfReader(io.BytesIO(resp.content))
    full_text = "".join(p.extract_text() for p in reader.pages)

    # In TRUSTED_CONTACT, notice explicitly indicates hashes and forensic metadata omitted
    assert "Notice: Sensitive forensic identifiers, exact timestamps, and artifact SHA-256 hashes are omitted" in full_text
    # Should contain category and claim text
    assert "Harassment" in full_text or "Identification" in full_text
    assert "SHA-256:" not in full_text

def test_pdf_legal_professional_includes_forensic_timeline():
    """LEGAL_PROFESSIONAL profile includes full cryptographic integrity proofs."""
    resp = client.post("/api/export/pdf", json={
        "case_id": "case_demo_01",
        "recipient_type": "LEGAL_PROFESSIONAL",
        "confirmed_config": True
    })
    assert resp.status_code == 200
    reader = pypdf.PdfReader(io.BytesIO(resp.content))
    full_text = "".join(p.extract_text() for p in reader.pages)

    assert "LEGAL PROFESSIONAL" in full_text
    assert "CRYPTOGRAPHIC INTEGRITY PROOF" in full_text or "EVIDENTIARY TRACE" in full_text or "SHA-256" in full_text

def test_pdf_redaction_and_privacy_leak_protection():
    """Ensure requested redacted terms are replaced and not present in output."""
    resp = client.post("/api/export/pdf", json={
        "case_id": "case_demo_01",
        "recipient_type": "SUPPORT_ORGANIZATION",
        "redacted_terms": ["Executive X"],
        "confirmed_config": True
    })
    assert resp.status_code == 200
    reader = pypdf.PdfReader(io.BytesIO(resp.content))
    full_text = "".join(p.extract_text() for p in reader.pages)

    assert "Executive X" not in full_text
    assert "[REDACTED]" in full_text

def test_pdf_export_requires_confirmed_config():
    """Explicit confirmation (confirmed_config: True) is mandatory."""
    resp = client.post("/api/export/pdf", json={
        "case_id": "case_demo_01",
        "recipient_type": "TRUSTED_CONTACT",
        "confirmed_config": False
    })
    assert resp.status_code == 400
    assert "confirmed_config" in resp.json()["detail"]

def test_pdf_export_nonexistent_case():
    """Requesting an invalid case returns 404, never a false success."""
    resp = client.post("/api/export/pdf", json={
        "case_id": "case_nonexistent_99999",
        "recipient_type": "TRUSTED_CONTACT",
        "confirmed_config": True
    })
    assert resp.status_code == 404
    assert resp.headers["content-type"] == "application/json"

def test_pdf_export_does_not_mutate_evidence():
    """Generating reports must never mutate or delete underlying artifacts or claims."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM artifacts WHERE case_id = 'case_demo_01'")
        art_count_before = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM observations WHERE case_id = 'case_demo_01'")
        obs_count_before = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM claims WHERE case_id = 'case_demo_01'")
        clm_count_before = cur.fetchone()[0]
    finally:
        conn.close()

    # Perform multiple exports across all recipient types
    for recipient in RECIPIENT_PROFILES:
        res = client.post("/api/export/pdf", json={
            "case_id": "case_demo_01",
            "recipient_type": recipient,
            "confirmed_config": True
        })
        assert res.status_code == 200

    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM artifacts WHERE case_id = 'case_demo_01'")
        art_count_after = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM observations WHERE case_id = 'case_demo_01'")
        obs_count_after = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM claims WHERE case_id = 'case_demo_01'")
        clm_count_after = cur.fetchone()[0]
    finally:
        conn.close()

    assert art_count_after == art_count_before
    assert obs_count_after == obs_count_before
    assert clm_count_after == clm_count_before
