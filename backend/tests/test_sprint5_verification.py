"""
Sprint 5 Phase A - Comprehensive Verification Test Suite
Includes:
1. End-to-End API Workflow Verification (Seed -> Get Case -> Upload -> Simulate Time Machine -> Stress Test -> Preview -> PDF Export)
2. Deterministic Synthetic Performance & Scale Benchmarks (Large-scale claims, observation sets, and time measurement)
3. Security Regression Tests (Path traversal, file injection, forbidden origin CORS, credential isolation, PII leakage blocks)
4. Demo Fixture Rigorous Integrity Validation (Checking planted conflicts, 5 dependent claims, 4 artifacts, hash integrity)
5. API Contract Schema Compliance Tests (Validating exact keys and responses against API_CONTRACT.md)
"""
import pytest
import os
import io
import time
import pypdf
from fastapi.testclient import TestClient
from pathlib import Path

TEST_DIR = Path(__file__).resolve().parent / "test_data"
TEST_DIR.mkdir(parents=True, exist_ok=True)
os.environ["PROOFPATH_DB_PATH"] = str(TEST_DIR / "test_proofpath.db")
os.environ["PROOFPATH_VAULT_DIR"] = str(TEST_DIR / "test_vault")
os.environ["PROOFPATH_MAX_UPLOAD_SIZE"] = "1048576"  # 1 MB

from app.main import app, vault, get_connection
from app.fixture import seed_demo_fixture
from app.trace_engine import recompute_claim_states, compare_scenario_with_baseline

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_test_db():
    conn = get_connection()
    seed_demo_fixture(conn, vault)
    conn.close()
    yield

# ==============================================================================
# 1. END-TO-END API LIFECYCLE WORKFLOW
# ==============================================================================

def test_e2e_full_intake_to_disclosure_lifecycle():
    """
    Simulates a full user session from intake to safe disclosure:
    1. Check system health
    2. Reset & Seed demo fixture
    3. Retrieve case baseline
    4. Ingest new evidence artifact
    5. Run Time Machine scenario simulation
    6. Run Record Stress Test
    7. Generate Disclosure Preview for Legal Counsel
    8. Compile Verified PDF Export
    """
    # 1. Health
    health_res = client.get("/api/health")
    assert health_res.status_code == 200
    assert health_res.json()["status"] == "ok"

    # 2. Seed
    seed_res = client.post("/api/seed")
    assert seed_res.status_code == 200
    case_id = seed_res.json()["case_id"]
    assert case_id == "case_demo_01"

    # 3. Baseline Case Details
    case_res = client.get(f"/api/cases/{case_id}")
    assert case_res.status_code == 200
    case_data = case_res.json()
    assert len(case_data["artifacts"]) == 4
    assert len(case_data["claims"]) == 5

    # 4. Ingest New Artifact
    png_bytes = b"\x89PNG\r\n\x1a\n" + b"E2E_SYNTHETIC_SCREENSHOT_CORROBORATION"
    upload_res = client.post(
        f"/api/artifacts/upload?case_id={case_id}",
        files={"file": ("incident_surveillance.png", io.BytesIO(png_bytes), "image/png")}
    )
    assert upload_res.status_code == 200
    new_art = upload_res.json()["artifact"]
    assert "vault_path" not in new_art
    assert new_art["file_type"] == "png"

    # 5. Time Machine Scenario Simulation
    # Exclude conflicting manual observation obs_06_manual
    sim_res = client.post("/api/scenarios/simulate", json={
        "case_id": case_id,
        "scenario_name": "Resolve planted time discrepancy",
        "overrides": [{"target_id": "obs_06_manual", "enabled": False}]
    })
    assert sim_res.status_code == 200
    sim_data = sim_res.json()
    claim5 = next(c for c in sim_data["claims"] if c["id"] == "claim_05")
    assert claim5["state"] == "SUPPORTED"
    assert sim_data["affected_claims_count"] == 1
    assert "claim_05" in sim_data["affected_claim_ids"]

    # 6. Stress Test
    stress_res = client.get(f"/api/cases/{case_id}/stress-test")
    assert stress_res.status_code == 200
    assert stress_res.json()["status"] in ["WARNINGS_FOUND", "PASSED"]

    # 7. Disclosure Preview
    prev_res = client.post("/api/disclosure/preview", json={
        "case_id": case_id,
        "recipient_type": "LEGAL_PROFESSIONAL",
        "redacted_terms": ["Executive X"]
    })
    assert prev_res.status_code == 200
    prev_data = prev_res.json()["preview"]
    assert "evidence_sha256" in prev_data["approved_fields"]
    assert prev_data["raw_images_excluded"] is True

    # 8. Verified PDF Export
    pdf_res = client.post("/api/export/pdf", json={
        "case_id": case_id,
        "recipient_type": "LEGAL_PROFESSIONAL",
        "redacted_terms": ["Executive X"],
        "confirmed_config": True
    })
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    
    # Verify PDF content integrity
    reader = pypdf.PdfReader(io.BytesIO(pdf_res.content))
    extracted = "".join([p.extract_text() for p in reader.pages])
    assert "Executive X" not in extracted
    assert "[REDACTED]" in extracted
    assert "PROOFPATH EVIDENCE DISCLOSURE REPORT" in extracted

# ==============================================================================
# 2. DETERMINISTIC PERFORMANCE & SCALE BENCHMARKS
# ==============================================================================

def test_benchmark_time_machine_recalculation_latency():
    """
    Benchmark test: Scale up to 100 synthetic claims and 200 observation links.
    Measures engine recomputation latency to ensure sub-50ms execution.
    """
    claims = [
        {"id": f"bench_claim_{i}", "claim_text": f"Benchmark incident statement number {i}", "incident_time": "2026-10-24 10:00"}
        for i in range(100)
    ]
    artifacts = [
        {"id": f"bench_art_{j}", "hash_mismatch": False}
        for j in range(20)
    ]
    observations = [
        {"id": f"bench_obs_{k}", "artifact_id": f"bench_art_{k % 20}", "field": "timestamp", "value": f"2026-10-24 10:0{k%5}"}
        for k in range(150)
    ]
    links = [
        {"claim_id": f"bench_claim_{i}", "observation_id": f"bench_obs_{i % 150}", "relation": "SUPPORTS" if i % 10 != 0 else "CONTRADICTS"}
        for i in range(200)
    ]

    # Benchmark baseline comparison
    t0 = time.perf_counter()
    res = compare_scenario_with_baseline(
        claims=claims,
        claim_evidence_links=links,
        observations=observations,
        artifacts=artifacts,
        overrides=[{"target_id": "bench_art_0", "enabled": False}]
    )
    elapsed_ms = (time.perf_counter() - t0) * 1000

    # Ensure deterministic correctness and strict performance (< 50ms for 100 claims)
    assert len(res["baseline_claims"]) == 100
    assert len(res["scenario_claims"]) == 100
    assert elapsed_ms < 50.0, f"Engine recalculation took {elapsed_ms:.2f}ms (threshold 50ms)"

# ==============================================================================
# 3. SECURITY REGRESSION TESTS
# ==============================================================================

def test_security_path_traversal_sanitization():
    """
    Upload filename containing malicious path traversal directory escapes.
    Must sanitize filename to prevent vault breakout.
    """
    valid_png = b"\x89PNG\r\n\x1a\n" + b"TRAVERSAL_PAYLOAD_TEST"
    files = {"file": ("../../../../etc/passwd.png", io.BytesIO(valid_png), "image/png")}
    res = client.post("/api/artifacts/upload?case_id=case_demo_01", files=files)
    assert res.status_code == 200
    uploaded_name = res.json()["artifact"]["filename"]
    # Path traversal slashes must be stripped/sanitized
    assert "/" not in uploaded_name
    assert ".." not in uploaded_name

def test_security_disallowed_file_extension():
    """Attempt upload of an executable or disallowed script extension."""
    exe_content = b"MZ_EXECUTABLE_BINARY_DATA"
    files = {"file": ("exploit.exe", io.BytesIO(exe_content), "application/x-msdownload")}
    res = client.post("/api/artifacts/upload?case_id=case_demo_01", files=files)
    assert res.status_code == 400
    assert "unsupported file extension" in res.json()["detail"].lower()

def test_security_cors_origin_policy():
    """Validate CORS preflight rejects unauthorized external origins."""
    headers = {
        "Origin": "http://malicious-attacker-site.com",
        "Access-Control-Request-Method": "POST"
    }
    res = client.options("/api/export/pdf", headers=headers)
    # The allow origin response must NOT echo back unauthorized origins
    allow_origin = res.headers.get("access-control-allow-origin")
    assert allow_origin != "http://malicious-attacker-site.com"
    assert allow_origin != "*"  # Wildcard must never be used with credentials

def test_security_pii_leakage_block_in_pdf():
    """
    Deliberately test that verify_pdf_privacy_leakage catches leaked forbidden strings
    in both document body and metadata.
    """
    from app.compiler import verify_pdf_privacy_leakage
    sample_pdf = client.post("/api/export/pdf", json={
        "case_id": "case_demo_01",
        "recipient_type": "LEGAL_PROFESSIONAL",
        "confirmed_config": True
    }).content

    # Document contains "Harassment" in title/categories
    leak_check = verify_pdf_privacy_leakage(sample_pdf, ["Harassment"])
    assert leak_check["passed"] is False
    assert "Harassment" in leak_check["leaked_terms"]

# ==============================================================================
# 4. DEMO FIXTURE INTEGRITY VALIDATION
# ==============================================================================

def test_demo_fixture_rigorous_validation():
    """
    Validates synthetic 60-second intake demo fixture:
    - Exactly 1 case ("case_demo_01")
    - 4 artifacts (2 screenshots, 1 chat export, 1 document)
    - 6 observations (including planted conflict obs_06_manual)
    - 5 claims (with claim_05 having clashing timestamps)
    - Cryptographic SHA-256 integrity on all stored vault files
    """
    res = client.get("/api/cases/case_demo_01")
    assert res.status_code == 200
    data = res.json()

    assert data["case"]["title"] == "Workplace Harassment Incident Timeline"
    assert len(data["artifacts"]) == 4
    assert len(data["observations"]) == 6
    assert len(data["claims"]) == 5

    # Check planted conflict in claim_05
    c5 = next(c for c in data["claims"] if c["id"] == "claim_05")
    assert c5["state"] == "CONFLICTED"

    # Verify physical file hash integrity
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT vault_path, sha256 FROM artifacts WHERE case_id = 'case_demo_01'")
    rows = cur.fetchall()
    conn.close()

    for r in rows:
        v_path = Path(r["vault_path"])
        assert v_path.exists(), f"Vault file {v_path} is missing"
        assert vault.verify_integrity(str(v_path), r["sha256"]) is True

# ==============================================================================
# 5. API CONTRACT SCHEMA COMPLIANCE
# ==============================================================================

def test_api_contract_schema_compliance():
    """
    Strict contract validation against API_CONTRACT.md fields:
    - GET /api/health -> {"status": "ok", "service": "ProofPath Backend"}
    - POST /api/seed -> {"status": "success", "case_id": "...", "message": "..."}
    - GET /api/cases/{case_id} -> {"case": {...}, "artifacts": [...], "observations": [...], "claims": [...], "links": [...]}
    - POST /api/scenarios/simulate -> {"status": "success", "scenario_name": "...", "claims": [...], "baseline_claims": [...], "changes": [...]}
    - POST /api/disclosure/preview -> {"status": "success", "preview": {...}}
    """
    # 1. Health schema
    r_health = client.get("/api/health").json()
    assert set(r_health.keys()) == {"status", "service"}

    # 2. Seed schema
    r_seed = client.post("/api/seed").json()
    assert set(r_seed.keys()) == {"status", "case_id", "message"}

    # 3. Case schema
    r_case = client.get("/api/cases/case_demo_01").json()
    assert set(r_case.keys()) == {"case", "artifacts", "observations", "claims", "links"}
    for art in r_case["artifacts"]:
        assert {"id", "case_id", "filename", "file_type", "sha256", "file_size", "ingested_at"}.issubset(set(art.keys()))
        assert "vault_path" not in art  # Internal path isolation rule

    # 4. Simulation schema
    r_sim = client.post("/api/scenarios/simulate", json={
        "case_id": "case_demo_01",
        "scenario_name": "Schema test",
        "overrides": []
    }).json()
    expected_sim_keys = {
        "status", "scenario_name", "claims", "baseline_claims", "changes",
        "affected_claims_count", "affected_claim_ids", "overrides_applied"
    }
    assert expected_sim_keys.issubset(set(r_sim.keys()))

    # 5. Preview schema
    r_prev = client.post("/api/disclosure/preview", json={
        "case_id": "case_demo_01",
        "recipient_type": "SUPPORT_ORGANIZATION"
    }).json()
    assert r_prev["status"] == "success"
    prev = r_prev["preview"]
    expected_prev_keys = {
        "recipient_type", "approved_fields", "excluded_fields", "warnings",
        "included_claims_count", "raw_images_excluded", "redacted_terms_count", "disclaimer"
    }
    assert expected_prev_keys.issubset(set(prev.keys()))
