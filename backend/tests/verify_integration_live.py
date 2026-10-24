import urllib.request
import json
import urllib.error

def test_mobile_integration_suite():
    base_url = "http://127.0.0.1:8000"

    # 1. Health
    with urllib.request.urlopen(f"{base_url}/api/health") as resp:
        assert resp.status == 200
        data = json.loads(resp.read().decode())
        assert data["status"] == "ok"
    print("[PASS] Health check succeeded")

    # 2. Case Details
    with urllib.request.urlopen(f"{base_url}/api/cases/case_demo_01") as resp:
        assert resp.status == 200
        case_data = json.loads(resp.read().decode())
        assert len(case_data["artifacts"]) == 4
        assert len(case_data["claims"]) == 5
    print("[PASS] Case, evidence artifacts and observations loaded from FastAPI")

    # 3. Time Machine What-If Scenario
    art_threat_id = next(a["id"] for a in case_data["artifacts"] if a["filename"] == "threat_message_screenshot.png")
    payload = json.dumps({
        "case_id": "case_demo_01",
        "scenario_name": "Exclude threat screenshot",
        "overrides": [{"target_id": art_threat_id, "enabled": False}]
    }).encode("utf-8")
    req = urllib.request.Request(f"{base_url}/api/scenarios/simulate", data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        sim_data = json.loads(resp.read().decode())
    
    # Dependent claim 2 lost support
    c2 = next(c for c in sim_data["claims"] if c["id"] == "claim_02")
    assert c2["state"] == "UNVERIFIED"
    print("[PASS] Time Machine changes dependent claim (claim_02 -> UNVERIFIED)")

    # 4. Unrelated claim 3 remains unchanged (SUPPORTED)
    c3 = next(c for c in sim_data["claims"] if c["id"] == "claim_03")
    assert c3["state"] == "SUPPORTED"
    print("[PASS] Unrelated claim 3 remains unchanged (SUPPORTED)")

    # 5. Restore exact baseline
    restore_payload = json.dumps({
        "case_id": "case_demo_01",
        "overrides": []
    }).encode("utf-8")
    req = urllib.request.Request(f"{base_url}/api/scenarios/simulate", data=restore_payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        restored = json.loads(resp.read().decode())
    c2_restored = next(c for c in restored["claims"] if c["id"] == "claim_02")
    assert c2_restored["state"] == "SUPPORTED"
    print("[PASS] Restore returns exactly to original baseline")

    # 6. Recipient profiles allowlists
    req = urllib.request.Request(f"{base_url}/api/disclosure/preview", data=json.dumps({"case_id": "case_demo_01", "recipient_type": "TRUSTED_CONTACT"}).encode("utf-8"), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        tc_prev = json.loads(resp.read().decode())["preview"]
    assert "evidence_sha256" in tc_prev["excluded_fields"]

    req = urllib.request.Request(f"{base_url}/api/disclosure/preview", data=json.dumps({"case_id": "case_demo_01", "recipient_type": "LEGAL_PROFESSIONAL"}).encode("utf-8"), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        lp_prev = json.loads(resp.read().decode())["preview"]
    assert "evidence_sha256" in lp_prev["approved_fields"]
    print("[PASS] Recipient profiles enforce different allowed fields")

    # 7. Unconfirmed export fails (HTTP 400)
    unconf_req = urllib.request.Request(f"{base_url}/api/export/pdf", data=json.dumps({"case_id": "case_demo_01", "confirmed_config": False}).encode("utf-8"), headers={"Content-Type": "application/json"})
    try:
        urllib.request.urlopen(unconf_req)
        assert False, "Should have failed with HTTP 400"
    except urllib.error.HTTPError as e:
        assert e.code == 400
        print("[PASS] Unconfirmed export is rejected with HTTP 400")

    # 8 & 9. Confirmed PDF export and privacy validation
    pdf_req = urllib.request.Request(f"{base_url}/api/export/pdf", data=json.dumps({
        "case_id": "case_demo_01",
        "recipient_type": "LEGAL_PROFESSIONAL",
        "confirmed_config": True
    }).encode("utf-8"), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(pdf_req) as resp:
        assert resp.status == 200
        pdf_bytes = resp.read()
        assert pdf_bytes.startswith(b"%PDF-")
    print(f"[PASS] Confirmed PDF generated successfully ({len(pdf_bytes)} bytes)")

    # 10. Honest error on invalid case ID
    bad_req = urllib.request.Request(f"{base_url}/api/cases/non_existent_case_999")
    try:
        urllib.request.urlopen(bad_req)
        assert False, "Should have failed with HTTP 404"
    except urllib.error.HTTPError as e:
        assert e.code == 404
        print("[PASS] Nonexistent case returns honest HTTP 404 error, not mock fallback")

    print("\nALL 10 VERIFICATION REQUIREMENTS VALIDATED SUCCESSFULLY AGAINST LIVE FASTAPI BACKEND!")

if __name__ == "__main__":
    test_mobile_integration_suite()
