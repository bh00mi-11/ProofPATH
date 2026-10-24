import pytest
import os
import io
from fastapi.testclient import TestClient
from pathlib import Path

# Set up test database environment before importing app
TEST_DIR = Path(__file__).resolve().parent / "test_data"
TEST_DIR.mkdir(parents=True, exist_ok=True)
os.environ["PROOFPATH_DB_PATH"] = str(TEST_DIR / "test_proofpath.db")
os.environ["PROOFPATH_VAULT_DIR"] = str(TEST_DIR / "test_vault")

from app.main import app, vault, get_connection
from app.fixture import seed_demo_fixture
from app.trace_engine import recompute_claim_states

@pytest.fixture(autouse=True)
def setup_test_db():
    conn = get_connection()
    seed_demo_fixture(conn, vault)
    conn.close()
    yield

client = TestClient(app)

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_get_case_baseline_and_conflict():
    response = client.get("/api/cases/case_demo_01")
    assert response.status_code == 200
    data = response.json()
    assert data["case"]["id"] == "case_demo_01"
    assert len(data["artifacts"]) == 4
    assert len(data["claims"]) == 5
    
    # Claim 5 has contradictory timestamps (21:45 vs 18:00) so it must be CONFLICTED in baseline
    claim5 = next(c for c in data["claims"] if c["id"] == "claim_05")
    assert claim5["state"] == "CONFLICTED"

def test_time_machine_scenario_simulation():
    # What-If: Exclude the manual conflicting observation obs_06_manual
    payload = {
        "case_id": "case_demo_01",
        "scenario_name": "Resolve planted conflict",
        "overrides": [
            {
                "target_id": "obs_06_manual",
                "enabled": False,
                "reason": "Excluding conflicting manual unverified entry"
            }
        ]
    }
    response = client.post("/api/scenarios/simulate", json=payload)
    assert response.status_code == 200
    claims = response.json()["claims"]
    
    claim5 = next(c for c in claims if c["id"] == "claim_05")
    # Now that the conflict is excluded, claim 5 becomes SUPPORTED
    assert claim5["state"] == "SUPPORTED"

def test_what_if_exclude_evidence_turns_claims_unverified():
    # Exclude threat screenshot obs_01 and chat obs_04
    payload = {
        "case_id": "case_demo_01",
        "scenario_name": "What if no harassment message?",
        "overrides": [
            {"target_id": "obs_01", "enabled": False},
            {"target_id": "obs_04", "enabled": False}
        ]
    }
    response = client.post("/api/scenarios/simulate", json=payload)
    assert response.status_code == 200
    claims = response.json()["claims"]
    
    claim1 = next(c for c in claims if c["id"] == "claim_01")
    assert claim1["state"] == "UNVERIFIED"

def test_stress_test_detects_planted_timestamp_conflict():
    response = client.get("/api/cases/case_demo_01/stress-test")
    assert response.status_code == 200
    res = response.json()
    assert res["status"] in ["WARNINGS_FOUND", "FAILED"]
    rules_triggered = [i["rule"] for i in res["issues"]]
    assert "CONTRADICTORY_TIMESTAMPS" in rules_triggered

def test_pdf_export_and_privacy_redaction():
    payload = {
        "case_id": "case_demo_01",
        "redacted_terms": ["Executive X"],
        "include_unverified": True
    }
    response = client.post("/api/export/pdf", json=payload)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert len(response.content) > 0
