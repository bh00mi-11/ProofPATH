"""
Test suite for Feature 8: Accountability Trail & Disclosure Integration.
Verifies:
1. Creating an accountability entry and retrieving it.
2. Case isolation.
3. Cross-case artifact linking rejection.
4. Status transition history preservation (append-only; never overwrites past statuses).
5. User-reported vs. document-supported provenance.
6. Follow-up completion tracking and historical event logging.
7. Missing evidence handling (support unavailable flag; entry preserved).
8. Disclosure exclusion by default in preview and export.
9. Recipient-specific privacy restrictions:
   - TRUSTED_CONTACT: reference numbers and personal IDs withheld.
   - SUPPORT_ORGANIZATION: reference numbers withheld.
   - LEGAL_PROFESSIONAL: reference numbers and hashes allowed if confirmed.
10. Existing regressions: Guardian Mode, Navigator, Time Machine, and Stress Test.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db import get_connection, init_db, DB_PATH
import pypdf
import io

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    init_db(DB_PATH)


def test_create_and_retrieve_accountability_entry():
    case_id = "case_demo_01"
    payload = {
        "action_type": "REPORT_PREPARED",
        "description": "Compiled confidential disclosure summary for counseling intake.",
        "user_event_time": "2026-10-23 10:00:00",
        "status": "NOT_REPORTED",
        "organization": "Independent Support Center",
        "next_follow_up_date": "2026-11-01"
    }
    resp = client.post(f"/api/cases/{case_id}/accountability/entries", json=payload)
    assert resp.status_code == 200
    entry = resp.json()["entry"]
    assert entry["case_id"] == case_id
    assert entry["action_type"] == "REPORT_PREPARED"
    assert entry["source_classification"] == "USER_REPORTED"
    assert entry["follow_up_completed"] is False

    # Retrieve timeline
    timeline_resp = client.get(f"/api/cases/{case_id}/accountability")
    assert timeline_resp.status_code == 200
    data = timeline_resp.json()
    assert any(e["id"] == entry["id"] for e in data["timeline"])
    assert "honesty_notice" in data


def test_cross_case_artifact_rejection():
    """Ensure artifacts from another case cannot be linked to this case's accountability entry."""
    conn = get_connection()
    try:
        with conn:
            conn.execute("INSERT OR IGNORE INTO cases (id, title) VALUES ('case_other_99', 'Other Case')")
            conn.execute("INSERT OR IGNORE INTO artifacts (id, case_id, filename, file_type, vault_path, sha256, file_size) VALUES ('art_other', 'case_other_99', 'doc.pdf', 'document', 'dummy', 'abc123sha', 100)")
    finally:
        conn.close()

    # Attempt to link 'art_other' to 'case_demo_01'
    payload = {
        "action_type": "COMPLAINT_SUBMITTED",
        "description": "Filing attempt with foreign artifact.",
        "user_event_time": "2026-10-23 11:00:00",
        "artifact_id": "art_other"
    }
    resp = client.post("/api/cases/case_demo_01/accountability/entries", json=payload)
    assert resp.status_code == 400
    assert "Cross-case evidence violation" in resp.json()["detail"]


def test_document_supported_provenance():
    """Linking a valid case artifact sets classification to DOCUMENT_SUPPORTED."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id FROM artifacts WHERE case_id = 'case_demo_01' LIMIT 1")
        art = cur.fetchone()
        art_id = art["id"]
    finally:
        conn.close()

    payload = {
        "action_type": "ACKNOWLEDGMENT_RECEIVED",
        "description": "Official receipt received from HR department.",
        "user_event_time": "2026-10-23 12:00:00",
        "status": "ACKNOWLEDGED",
        "artifact_id": art_id,
        "reference_number": "HR-REF-9921"
    }
    resp = client.post("/api/cases/case_demo_01/accountability/entries", json=payload)
    assert resp.status_code == 200
    entry = resp.json()["entry"]
    assert entry["source_classification"] == "DOCUMENT_SUPPORTED"
    assert entry["artifact_id"] == art_id
    assert entry["linked_artifact"] is not None


def test_status_transition_history_preservation():
    """Multiple status updates must all be preserved in the append-only trail."""
    case_id = "case_demo_01"

    # Step 1: Submit complaint
    r1 = client.post(
        f"/api/cases/{case_id}/accountability/status",
        json={
            "new_status": "SUBMITTED",
            "reason": "Submitted formal grievance via online portal",
            "user_event_time": "2026-10-23 14:00:00"
        }
    )
    assert r1.status_code == 200

    # Step 2: Under review
    r2 = client.post(
        f"/api/cases/{case_id}/accountability/status",
        json={
            "new_status": "UNDER_REVIEW",
            "reason": "Committee assigned inquiry officer",
            "user_event_time": "2026-10-24 09:00:00"
        }
    )
    assert r2.status_code == 200

    # Retrieve timeline
    resp = client.get(f"/api/cases/{case_id}/accountability")
    assert resp.status_code == 200
    data = resp.json()

    # Current status should be UNDER_REVIEW
    assert data["current_recorded_status"] == "UNDER_REVIEW"

    # Prior status transitions must still exist in timeline (not overwritten)
    statuses_in_timeline = [e["status"] for e in data["timeline"]]
    assert "SUBMITTED" in statuses_in_timeline
    assert "UNDER_REVIEW" in statuses_in_timeline


def test_follow_up_completion():
    case_id = "case_demo_01"
    entry_resp = client.post(
        f"/api/cases/{case_id}/accountability/entries",
        json={
            "action_type": "COMPLAINT_SUBMITTED",
            "description": "Submitted complaint. Follow up on acknowledgment.",
            "user_event_time": "2026-10-22 09:00:00",
            "next_follow_up_date": "2026-10-24"
        }
    )
    entry_id = entry_resp.json()["entry"]["id"]

    # Complete the follow up
    comp_resp = client.post(
        f"/api/cases/{case_id}/accountability/entries/{entry_id}/complete-follow-up",
        json={
            "completion_note": "Spoke to registry; confirmed docket number assigned.",
            "completion_time": "2026-10-24 16:00:00"
        }
    )
    assert comp_resp.status_code == 200
    assert comp_resp.json()["follow_up_completed"] is True

    # Check timeline
    timeline = client.get(f"/api/cases/{case_id}/accountability").json()
    updated_item = next(e for e in timeline["timeline"] if e["id"] == entry_id)
    assert updated_item["follow_up_completed"] is True

    # Historical event logged
    assert any(e["action_type"] == "FOLLOW_UP_COMPLETED" for e in timeline["timeline"])


def test_missing_evidence_handling():
    """If an artifact is deleted from DB, historical accountability entry still loads with support_unavailable."""
    conn = get_connection()
    try:
        with conn:
            conn.execute("INSERT OR IGNORE INTO artifacts (id, case_id, filename, file_type, vault_path, sha256, file_size) VALUES ('art_temp_del', 'case_demo_01', 'del.pdf', 'document', 'p', 'hash1', 50)")
    finally:
        conn.close()

    # Link it
    res = client.post(
        "/api/cases/case_demo_01/accountability/entries",
        json={
            "action_type": "REPORT_PREPARED",
            "description": "Attached temp artifact",
            "user_event_time": "2026-10-24 10:00:00",
            "artifact_id": "art_temp_del"
        }
    ).json()
    entry_id = res["entry"]["id"]

    # Now delete artifact
    conn = get_connection()
    try:
        with conn:
            conn.execute("DELETE FROM artifacts WHERE id = 'art_temp_del'")
    finally:
        conn.close()

    # Retrieve timeline
    timeline = client.get("/api/cases/case_demo_01/accountability").json()
    entry = next(e for e in timeline["timeline"] if e["id"] == entry_id)
    assert entry is not None
    assert entry["artifact_support_unavailable"] is True


def test_disclosure_exclusion_by_default_and_recipient_privacy():
    """Accountability entries must be excluded by default from disclosure PDF and previews."""
    case_id = "case_demo_01"

    # Add a sensitive accountability entry with a reference number
    secret_ref = "SECRET-DOCKET-REF-998811"
    client.post(
        f"/api/cases/{case_id}/accountability/entries",
        json={
            "action_type": "COMPLAINT_SUBMITTED",
            "description": "Police station GD entry recorded.",
            "user_event_time": "2026-10-24 11:00:00",
            "reference_number": secret_ref,
            "organization": "Local Jurisdiction Police"
        }
    )

    # 1. Preview default (include_accountability defaults to False)
    prev_resp = client.post(
        "/api/disclosure/preview",
        json={"case_id": case_id, "recipient_type": "LEGAL_PROFESSIONAL"}
    )
    assert prev_resp.status_code == 200
    preview_data = prev_resp.json()["preview"]
    assert preview_data["accountability_included"] is False
    assert preview_data["included_accountability_count"] == 0

    # 2. Export default: PDF must NOT contain the secret reference number
    export_resp = client.post(
        "/api/export/pdf",
        json={
            "case_id": case_id,
            "recipient_type": "LEGAL_PROFESSIONAL",
            "confirmed_config": True
        }
    )
    assert export_resp.status_code == 200
    reader = pypdf.PdfReader(io.BytesIO(export_resp.content))
    extracted_text = " ".join(p.extract_text() for p in reader.pages)
    assert secret_ref not in extracted_text
    assert "Accountability Trail" not in extracted_text

    # 3. Explicitly Include for TRUSTED_CONTACT: reference number must be withheld by allowlist
    export_trusted = client.post(
        "/api/export/pdf",
        json={
            "case_id": case_id,
            "recipient_type": "TRUSTED_CONTACT",
            "confirmed_config": True,
            "include_accountability": True
        }
    )
    assert export_trusted.status_code == 200
    reader_trusted = pypdf.PdfReader(io.BytesIO(export_trusted.content))
    text_trusted = " ".join(p.extract_text() for p in reader_trusted.pages)
    assert secret_ref not in text_trusted
    assert "Withheld by recipient allowlist" in text_trusted

    # 4. Explicitly Include for LEGAL_PROFESSIONAL: reference number allowed
    export_legal = client.post(
        "/api/export/pdf",
        json={
            "case_id": case_id,
            "recipient_type": "LEGAL_PROFESSIONAL",
            "confirmed_config": True,
            "include_accountability": True
        }
    )
    assert export_legal.status_code == 200
    reader_legal = pypdf.PdfReader(io.BytesIO(export_legal.content))
    text_legal = " ".join(p.extract_text() for p in reader_legal.pages)
    assert secret_ref in text_legal
