"""
Test suite for ProofPath Guardian Mode (Feature 13 MVP).
Validates:
1. Contact CRUD: creation, listing, updating, deletion.
2. Safety Session Lifecycle: start, active query, end.
3. Honest SOS Alert Status: records ATTEMPTED, never fake CONFIRMED delivery.
4. Session-to-Vault Evidence Import: event log artifact created with SHA-256 in Evidence Vault.
5. National Emergency Shortcut: provides verified 112 emergency routing.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db import get_connection, init_db, DB_PATH, VAULT_DIR
from app.vault import EvidenceVault

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_guardian_tables():
    init_db(DB_PATH)
    conn = get_connection()
    try:
        with conn:
            conn.execute("DELETE FROM guardian_alerts")
            conn.execute("DELETE FROM guardian_sessions")
            conn.execute("DELETE FROM guardian_contacts")
    finally:
        conn.close()

def test_guardian_contact_lifecycle():
    # 1. Create trusted contact
    res = client.post("/api/guardian/contacts", json={
        "name": "Sister Priya",
        "phone": "+919876543210",
        "relationship": "Sister"
    })
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["status"] == "success"
    contact_id = data["contact"]["id"]
    assert data["contact"]["name"] == "Sister Priya"

    # 2. List contacts
    list_res = client.get("/api/guardian/contacts")
    assert list_res.status_code == 200
    contacts = list_res.json()["contacts"]
    assert len(contacts) == 1
    assert contacts[0]["id"] == contact_id

    # 3. Update contact
    update_res = client.put(f"/api/guardian/contacts/{contact_id}", json={
        "phone": "+919876500000"
    })
    assert update_res.status_code == 200
    assert update_res.json()["contact"]["phone"] == "+919876500000"
    assert update_res.json()["contact"]["name"] == "Sister Priya"

    # 4. Delete contact
    del_res = client.delete(f"/api/guardian/contacts/{contact_id}")
    assert del_res.status_code == 200
    assert "removed" in del_res.json()["message"]

    # Verify deleted
    empty_list = client.get("/api/guardian/contacts").json()["contacts"]
    assert len(empty_list) == 0

def test_guardian_safety_session_and_sos_lifecycle():
    # Setup contact
    c_res = client.post("/api/guardian/contacts", json={
        "name": "Advocate Meera",
        "phone": "+919123456789",
        "relationship": "Legal Advocate"
    })
    contact_id = c_res.json()["contact"]["id"]

    # 1. Start safety session
    start_res = client.post("/api/guardian/sessions/start", json={
        "case_id": "case_demo_01",
        "incident_note": "Travelling home via unfamiliar cab route at night",
        "selected_contact_ids": [contact_id]
    })
    assert start_res.status_code == 200
    session_id = start_res.json()["session"]["id"]
    assert start_res.json()["session"]["status"] == "ACTIVE"

    # 2. Query active session
    active_res = client.get("/api/guardian/sessions/active")
    assert active_res.status_code == 200
    assert active_res.json()["status"] == "active"
    assert active_res.json()["session"]["id"] == session_id

    # 3. Trigger SOS Alert
    sos_res = client.post(f"/api/guardian/sessions/{session_id}/sos", json={
        "session_id": session_id,
        "contact_ids": [contact_id],
        "share_channel": "MANUAL_SHARE"
    })
    assert sos_res.status_code == 200
    sos_data = sos_res.json()
    assert sos_data["status"] == "success"
    assert "112" in sos_data["emergency_shortcut"]
    assert len(sos_data["alerts"]) == 1
    
    # Verify delivery status honesty (never fakes network delivery)
    alert = sos_data["alerts"][0]
    assert alert["delivery_status"] == "ATTEMPTED"
    assert "manual sharing" in alert["explanation"].lower()

    # 4. End safety session with vault import
    end_res = client.post(f"/api/guardian/sessions/{session_id}/end", json={
        "import_as_evidence": True
    })
    assert end_res.status_code == 200
    end_data = end_res.json()
    assert end_data["session_state"] == "ENDED"
    assert end_data["imported_as_evidence"] is True
    assert end_data["artifact"]["sha256"] is not None

    # 5. Check no active session remains
    no_active = client.get("/api/guardian/sessions/active")
    assert no_active.status_code == 200
    assert no_active.json()["status"] == "none"
