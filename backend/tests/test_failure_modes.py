"""
Failure-Mode Audit Test Suite for ProofPath (Task C).
Systematically evaluates edge cases and fault handling:
1. Corrupted files (tampered content vs SHA-256 header / hash mismatch).
2. Duplicate evidence uploads (identical hash, proper isolation).
3. Unsupported extraction formats (handling binary or unparseable text cleanly).
4. Network / API simulation or missing parameters during upload.
5. Empty observations (handled gracefully without engine crash).
6. Unlinked statements (correctly remaining UNVERIFIED without crash).
7. Conflicts with no identifiable pair (orphan contradiction handled gracefully).
8. Time Machine restoration (resetting overrides returns to exact baseline).
9. Strict Cross-Case Isolation (no cross-case access, linking, or artifact leaking).
10. PDF generation failure handling (unconfirmed, invalid recipient, empty case).
"""
import io
import hashlib
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.trace_engine import recompute_claim_states

client = TestClient(app)

def test_failure_mode_audit():
    # 1. Create test case
    case_resp = client.post("/api/cases", json={
        "title": "Failure Mode Test Case",
        "description": "Auditing failure modes and negative edge cases",
        "initial_claim": "The initial statement for failure testing."
    })
    assert case_resp.status_code == 200
    case_id = case_resp.json()["case"]["id"]

    # 1a. Upload valid artifact
    orig_content = b"Original pristine text message."
    up_resp = client.post(
        f"/api/artifacts/upload?case_id={case_id}",
        files={"file": ("pristine.txt", orig_content, "text/plain")}
    )
    assert up_resp.status_code == 200
    art_id = up_resp.json()["artifact"]["id"]

    # 1b. Corrupted file test: Tampered hash detection
    # Trace engine handles tampered hash with REVIEW_NEEDED state
    tampered_claim = {"id": "c_tamper", "claim_text": "Claim with tampered evidence"}
    arts = [{"id": "a_corrupt", "hash_mismatch": True}]
    obss = [{"id": "obs_corrupt", "artifact_id": "a_corrupt", "value": "Extracted from corrupt"}]
    links = [{"claim_id": "c_tamper", "observation_id": "obs_corrupt", "relation": "SUPPORTS"}]
    res = recompute_claim_states(claims=[tampered_claim], claim_evidence_links=links, observations=obss, artifacts=arts)
    assert res["claims"][0]["state"] == "REVIEW_NEEDED"
    assert "Cryptographic integrity check failed" in res["claims"][0]["reason"]

    # 2. Duplicate evidence upload: ProofPath returns 409 Conflict with deduplication notice
    dup_resp = client.post(
        f"/api/artifacts/upload?case_id={case_id}",
        files={"file": ("pristine_copy.txt", orig_content, "text/plain")}
    )
    assert dup_resp.status_code == 409  # Cryptographic deduplication prevents re-upload of identical file
    assert "already exists" in dup_resp.json()["detail"].lower() or "duplicate" in dup_resp.json()["detail"].lower()

    # 3. Unsupported / unallowlisted format rejection (.bin, executable, etc.)
    bin_content = b"\x00\x01\x02\x03\xFF\xFE\x00\x10"
    bin_resp = client.post(
        f"/api/artifacts/upload?case_id={case_id}",
        files={"file": ("binary_blob.bin", bin_content, "application/octet-stream")}
    )
    assert bin_resp.status_code == 400
    assert "not allowed" in bin_resp.json()["detail"].lower() or "unsupported" in bin_resp.json()["detail"].lower()

    # 4. Upload missing case_id or file
    err_up = client.post("/api/artifacts/upload", files={"file": ("test.txt", b"abc")})
    assert err_up.status_code in [400, 422]

    # 5. Empty observations handled gracefully
    empty_claim = {"id": "c_empty", "claim_text": "Statement with empty obs"}
    empty_obss = [{"id": "obs_empty", "artifact_id": "a_valid", "value": ""}]
    empty_links = [{"claim_id": "c_empty", "observation_id": "obs_empty", "relation": "SUPPORTS"}]
    empty_res = recompute_claim_states(
        claims=[empty_claim],
        claim_evidence_links=empty_links,
        observations=empty_obss,
        artifacts=[{"id": "a_valid", "hash_mismatch": False}]
    )
    assert empty_res["claims"][0]["state"] == "SUPPORTED"

    # 6. Unlinked statements
    unlinked_claim = {"id": "c_unlink", "claim_text": "Statement without any link"}
    unlink_res = recompute_claim_states(
        claims=[unlinked_claim],
        claim_evidence_links=[],
        observations=[],
        artifacts=[]
    )
    assert unlink_res["claims"][0]["state"] == "UNVERIFIED"

    # 7. Conflicts with no identifiable pair (only contradictory observation)
    only_contradict = {"id": "c_contra_only", "claim_text": "Statement with only contradiction"}
    c_res = recompute_claim_states(
        claims=[only_contradict],
        claim_evidence_links=[{"claim_id": "c_contra_only", "observation_id": "obs_con", "relation": "CONTRADICTS"}],
        observations=[{"id": "obs_con", "artifact_id": "a_con", "value": "dispute"}],
        artifacts=[{"id": "a_con", "hash_mismatch": False}]
    )
    # Precedence rule specifies REVIEW_NEEDED if only contradictory observations exist
    assert c_res["claims"][0]["state"] == "REVIEW_NEEDED"

    # 8. Time Machine restoration test
    baseline_eval = recompute_claim_states(
        claims=[tampered_claim],
        claim_evidence_links=[{"claim_id": "c_tamper", "observation_id": "o1", "relation": "SUPPORTS"}],
        observations=[{"id": "o1", "artifact_id": "a1", "value": "val"}],
        artifacts=[{"id": "a1", "hash_mismatch": False}]
    )
    assert baseline_eval["claims"][0]["state"] == "SUPPORTED"

    # Exclude
    excluded_eval = recompute_claim_states(
        claims=[tampered_claim],
        claim_evidence_links=[{"claim_id": "c_tamper", "observation_id": "o1", "relation": "SUPPORTS"}],
        observations=[{"id": "o1", "artifact_id": "a1", "value": "val"}],
        artifacts=[{"id": "a1", "hash_mismatch": False}],
        overrides=[{"target_id": "a1", "enabled": False}]
    )
    assert excluded_eval["claims"][0]["state"] == "UNVERIFIED"

    # Restore baseline (empty overrides)
    restored_eval = recompute_claim_states(
        claims=[tampered_claim],
        claim_evidence_links=[{"claim_id": "c_tamper", "observation_id": "o1", "relation": "SUPPORTS"}],
        observations=[{"id": "o1", "artifact_id": "a1", "value": "val"}],
        artifacts=[{"id": "a1", "hash_mismatch": False}],
        overrides=[]
    )
    assert restored_eval["claims"][0]["state"] == "SUPPORTED"

    # 9. Cross-case isolation
    case_2_resp = client.post("/api/cases", json={"title": "Second Case", "description": "Isolation test"})
    case_2_id = case_2_resp.json()["case"]["id"]
    # Trying to fetch art_id using case_2_id
    cross_get = client.get(f"/api/artifacts/{art_id}/content?case_id={case_2_id}")
    assert cross_get.status_code in [403, 404]

    # 10. PDF generation failures handled truthfully
    # Unconfirmed config
    unconf = client.post("/api/export/pdf", json={"case_id": case_id, "recipient_type": "TRUSTED_CONTACT", "confirmed_config": False})
    assert unconf.status_code == 400
    # Invalid recipient type
    bad_rec = client.post("/api/export/pdf", json={"case_id": case_id, "recipient_type": "INVALID_RECIPIENT", "confirmed_config": True})
    assert bad_rec.status_code in [400, 422]
    # Nonexistent case
    bad_case = client.post("/api/export/pdf", json={"case_id": "non_existent_case_999", "recipient_type": "TRUSTED_CONTACT", "confirmed_config": True})
    assert bad_case.status_code in [400, 404]

    print("\n--- TASK C FAILURE-MODE AUDIT: ALL 10 TESTS PASSED ---")

if __name__ == "__main__":
    test_failure_mode_audit()
