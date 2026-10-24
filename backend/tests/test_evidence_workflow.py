import pytest
from fastapi.testclient import TestClient
import hashlib
import os

from pathlib import Path

TEST_DIR = Path(__file__).resolve().parent / "test_data"
TEST_DIR.mkdir(parents=True, exist_ok=True)
os.environ["PROOFPATH_DB_PATH"] = str(TEST_DIR / "test_proofpath.db")
os.environ["PROOFPATH_VAULT_DIR"] = str(TEST_DIR / "test_vault")

from app.main import app, get_connection

client = TestClient(app)

def test_aanya_case_fact_extraction_and_trace_engine_lifecycle():
    """
    E2E Verification of Task 4 & Task 5:
    1. Create a fresh case with initial claim: 'The sender continued contacting Aanya after she asked them to stop.'
    2. Upload 4 synthetic text files:
       - 01_initial_message.txt
       - 02_stop_request.txt
       - 03_followup_message.txt
       - 04_conflicting_record.txt
    3. Verify file content endpoint and SHA-256 immutability.
    4. Deterministically propose observations for text files.
    5. Propose & create observations for stop request (Oct 18) and followup message (Oct 19).
    6. Link them as SUPPORTS to the initial claim -> evaluate Trace Engine -> claim becomes SUPPORTED.
    7. Propose & create observation for conflicting record (Oct 17 conflicting timestamp for same followup).
    8. Link it as CONTRADICTS or conflicting timestamp -> evaluate Trace Engine -> claim becomes CONFLICTED.
    9. In Time Machine, exclude the conflicting record artifact -> Trace Engine recalculates -> claim returns to SUPPORTED.
    10. Exclude the followup message artifact in Time Machine -> Trace Engine recalculates -> claim drops to UNVERIFIED.
    11. Restore baseline -> Verify original claim status and SHA-256 integrity remains unchanged.
    12. Verify cross-case linking isolation is strictly enforced (prohibits linking artifact or observation from other cases).
    """
    # 1. Create a fresh case
    case_resp = client.post("/api/cases", json={
        "title": "Aanya Harassment Investigation",
        "description": "Investigation into persistent unwanted contact after explicit stop request",
        "initial_claim": "The sender continued contacting Aanya after she asked them to stop."
    })
    assert case_resp.status_code == 200, case_resp.text
    case_data = case_resp.json()["case"]
    case_id = case_data["id"]

    # Fetch case data and initial claim
    case_resp_data = client.get(f"/api/cases/{case_id}")
    assert case_resp_data.status_code == 200
    claims = case_resp_data.json()["claims"]
    assert len(claims) >= 1
    target_claim = claims[0]
    claim_id = target_claim["id"]
    assert target_claim["state"] == "UNVERIFIED"

    # 2. Upload the 4 synthetic text files
    files_data = [
        ("01_initial_message.txt", b"Date: 2026-10-18\nTime: 10:15 AM\nSender: Unknown (+91 98765 43210)\nPlatform: WhatsApp\nMessage: Why are you ignoring me? Reply."),
        ("02_stop_request.txt", b"Date: 2026-10-18\nTime: 10:20 AM\nSender: Aanya\nPlatform: WhatsApp\nMessage: Please do not contact me again. I do not want to speak with you."),
        ("03_followup_message.txt", b"Date: 2026-10-19\nTime: 08:40 PM\nSender: Unknown (+91 98765 43210)\nPlatform: WhatsApp\nMessage: Blocking me won't stop me from contacting you."),
        ("04_conflicting_record.txt", b"Date: 2026-10-17\nTime: 08:40 PM\nSender: Unknown (+91 98765 43210)\nPlatform: WhatsApp\nMessage: Blocking me won't stop me from contacting you. Note: Conflicting recorded date for the same message.")
    ]

    artifacts = {}
    original_hashes = {}

    for fname, content in files_data:
        expected_hash = hashlib.sha256(content).hexdigest()
        original_hashes[fname] = expected_hash
        upload_resp = client.post(
            f"/api/artifacts/upload?case_id={case_id}",
            files={"file": (fname, content, "text/plain")}
        )
        assert upload_resp.status_code == 200, upload_resp.text
        art = upload_resp.json()["artifact"]
        artifacts[fname] = art
        assert art["sha256"] == expected_hash

    # 3. Verify content endpoint for text artifacts
    for fname, content in files_data:
        art_id = artifacts[fname]["id"]
        content_resp = client.get(f"/api/artifacts/{art_id}/content?case_id={case_id}")
        assert content_resp.status_code == 200
        data = content_resp.json()
        assert data["is_text"] is True
        assert data["content"] == content.decode("utf-8")
        assert data["sha256"] == original_hashes[fname]

    # 4. Deterministic proposal extraction
    stop_art_id = artifacts["02_stop_request.txt"]["id"]
    prop_resp = client.get(f"/api/artifacts/{stop_art_id}/propose-observations?case_id={case_id}")
    assert prop_resp.status_code == 200
    prop_data = prop_resp.json()
    assert prop_data["status"] in ["success", "ok"]
    proposed = {p["field"]: p["value"] for p in prop_data["proposed"]}
    assert "date" in proposed or "timestamp" in proposed
    assert "sender" in proposed
    assert "message_content" in proposed
    assert "Aanya" in proposed.get("sender", "")

    # 5. Create observations from stop request & followup message and link to claim
    # Observation 1: Stop request sent Oct 18
    obs1_resp = client.post("/api/observations", json={
        "case_id": case_id,
        "artifact_id": stop_art_id,
        "field": "timestamp",
        "value": "2026-10-18 10:20 AM",
        "source_type": "DOCUMENT"
    })
    assert obs1_resp.status_code == 200
    obs1_id = obs1_resp.json()["observation"]["id"]

    # Link obs1 as SUPPORTS
    link1_resp = client.post("/api/claim-links", json={
        "case_id": case_id,
        "claim_id": claim_id,
        "observation_id": obs1_id,
        "relation": "SUPPORTS"
    })
    assert link1_resp.status_code == 200

    # Observation 2: Followup contact on Oct 19 (after stop request)
    followup_art_id = artifacts["03_followup_message.txt"]["id"]
    obs2_resp = client.post("/api/observations", json={
        "case_id": case_id,
        "artifact_id": followup_art_id,
        "field": "timestamp",
        "value": "2026-10-19 08:40 PM",
        "source_type": "DOCUMENT"
    })
    assert obs2_resp.status_code == 200
    obs2_id = obs2_resp.json()["observation"]["id"]

    link2_resp = client.post("/api/claim-links", json={
        "case_id": case_id,
        "claim_id": claim_id,
        "observation_id": obs2_id,
        "relation": "SUPPORTS"
    })
    assert link2_resp.status_code == 200

    # 6. Evaluate Trace Engine -> Claim is now SUPPORTED
    case_get_sup = client.get(f"/api/cases/{case_id}")
    assert case_get_sup.status_code == 200
    claims_sup = case_get_sup.json()["claims"]
    c_sup = next(c for c in claims_sup if c["id"] == claim_id)
    assert c_sup["state"] == "SUPPORTED"
    assert obs1_id in c_sup["supporting_observations"]
    assert obs2_id in c_sup["supporting_observations"]

    # 7. Add Conflicting Record (dated Oct 17 instead of Oct 19 for same message)
    conflict_art_id = artifacts["04_conflicting_record.txt"]["id"]
    obs3_resp = client.post("/api/observations", json={
        "case_id": case_id,
        "artifact_id": conflict_art_id,
        "field": "timestamp",
        "value": "2026-10-17 08:40 PM",
        "source_type": "DOCUMENT"
    })
    assert obs3_resp.status_code == 200
    obs3_id = obs3_resp.json()["observation"]["id"]

    # Link as CONTRADICTS
    link3_resp = client.post("/api/claim-links", json={
        "case_id": case_id,
        "claim_id": claim_id,
        "observation_id": obs3_id,
        "relation": "CONTRADICTS"
    })
    assert link3_resp.status_code == 200

    # 8. Evaluate Trace Engine -> Claim is now CONFLICTED
    case_get_conf = client.get(f"/api/cases/{case_id}")
    assert case_get_conf.status_code == 200
    claims_conf = case_get_conf.json()["claims"]
    c_conf = next(c for c in claims_conf if c["id"] == claim_id)
    assert c_conf["state"] == "CONFLICTED"
    assert obs3_id in c_conf["contradicting_observations"]

    # 9. Time Machine: Exclude the conflicting record artifact -> Should recalculate to SUPPORTED
    tm_resp = client.post("/api/scenarios/simulate", json={
        "case_id": case_id,
        "scenario_name": "Exclude conflicting record",
        "overrides": [{"target_id": conflict_art_id, "target_type": "evidence", "enabled": False}]
    })
    assert tm_resp.status_code == 200
    tm_data = tm_resp.json()
    assert tm_data["status"] == "success"
    # Find change for our claim
    claim_change = next(c for c in tm_data["changes"] if c["claim_id"] == claim_id)
    assert claim_change["baseline_state"] == "CONFLICTED"
    assert claim_change["scenario_state"] == "SUPPORTED"

    # 10. Time Machine: Exclude all supporting artifacts -> Drops to UNVERIFIED
    tm_resp_unverified = client.post("/api/scenarios/simulate", json={
        "case_id": case_id,
        "scenario_name": "Exclude all supporting artifacts",
        "overrides": [
            {"target_id": conflict_art_id, "target_type": "evidence", "enabled": False},
            {"target_id": followup_art_id, "target_type": "evidence", "enabled": False},
            {"target_id": stop_art_id, "target_type": "evidence", "enabled": False}
        ]
    })
    assert tm_resp_unverified.status_code == 200
    change_unverified = next(c for c in tm_resp_unverified.json()["changes"] if c["claim_id"] == claim_id)
    assert change_unverified["scenario_state"] == "UNVERIFIED"

    # 11. Baseline preservation and file immutability
    case_get_base = client.get(f"/api/cases/{case_id}")
    assert case_get_base.status_code == 200
    c_base = next(c for c in case_get_base.json()["claims"] if c["id"] == claim_id)
    assert c_base["state"] == "CONFLICTED"

    for fname, expected_hash in original_hashes.items():
        art_id = artifacts[fname]["id"]
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT sha256, vault_path FROM artifacts WHERE id = ?", (art_id,))
        row = cur.fetchone()
        conn.close()
        assert row[0] == expected_hash
        assert os.path.exists(row[1])
        with open(row[1], "rb") as f:
            disk_hash = hashlib.sha256(f.read()).hexdigest()
            assert disk_hash == expected_hash

    # 12. Cross-case isolation validation
    # Create a second independent case
    case2_resp = client.post("/api/cases", json={
        "title": "Unrelated Case",
        "description": "Completely separate person's case"
    })
    case2_id = case2_resp.json()["case"]["id"]

    # Try to link artifact from case1 to case2 claim -> Must fail with 400
    claim2_resp = client.post("/api/claims", json={
        "case_id": case2_id,
        "claim_text": "Some claim in second case"
    })
    claim2_id = claim2_resp.json()["claim"]["id"]

    cross_link_resp = client.post("/api/claim-links", json={
        "case_id": case2_id,
        "claim_id": claim2_id,
        "observation_id": obs1_id, # from case 1
        "relation": "SUPPORTS"
    })
    assert cross_link_resp.status_code == 400
    assert "cross-case linking prohibited" in cross_link_resp.text.lower()

    # Try to create observation in case2 using artifact from case1 -> Must fail with 400
    cross_obs_resp = client.post("/api/observations", json={
        "case_id": case2_id,
        "artifact_id": stop_art_id, # from case 1
        "field": "timestamp",
        "value": "2026-10-18 10:20 AM"
    })
    assert cross_obs_resp.status_code == 400
    assert "cross-case linking prohibited" in cross_obs_resp.text.lower()
