"""
Tests for Feature 10: Next-Step Navigator
Verifies:
1. Category mapping determinism (Workplace harassment, Cyberstalking, Threats, Impersonation, Non-consensual content)
2. Verified Indian official resources structure, last-verified dates, and safe external URLs
3. Action checklist persistence in DB across toggles
4. Privacy test: verified resource URLs contain ZERO case tokens, case IDs, or user parameters
5. API endpoints: GET /api/cases/{case_id}/navigator and POST /api/cases/{case_id}/checklist/toggle
"""

import pytest
from fastapi.testclient import TestClient
from urllib.parse import urlparse, parse_qs
from app.main import app
from app.navigator import (
    normalize_category,
    VERIFIED_RESOURCES,
    CATEGORY_SPECIFIC_GUIDANCE
)
from app.db import get_connection

client = TestClient(app)

def test_category_normalization_determinism():
    assert normalize_category("Workplace harassment") == "workplace_harassment"
    assert normalize_category("POSH meeting hostile environment") == "workplace_harassment"
    assert normalize_category("Cyberstalking online messaging") == "cyberstalking"
    assert normalize_category("Repeated online threats and intimidation") == "threats_and_intimidation"
    assert normalize_category("Fake account impersonation") == "impersonation"
    assert normalize_category("Intimate photo morphing") == "intimate_content"
    assert normalize_category(None) == "workplace_harassment"


def test_verified_resources_integrity_and_indian_authority():
    """Ensure all resources are official verified entities with last_verified timestamp."""
    assert len(VERIFIED_RESOURCES) >= 5
    
    helplines = {r["helpline"] for r in VERIFIED_RESOURCES}
    assert "112" in helplines
    assert "1930" in helplines
    assert "7827170170" in helplines
    assert "15100" in helplines

    for res in VERIFIED_RESOURCES:
        assert "name" in res
        assert "organization" in res
        assert "url" in res
        assert "scope" in res
        assert res["url"].startswith("http")
        assert res["last_verified"] is not None


def test_resource_urls_privacy_leakage():
    """
    Ensure resource URLs do not contain query parameters, tracking tokens,
    case identifiers, or user identifiers.
    """
    for res in VERIFIED_RESOURCES:
        parsed = urlparse(res["url"])
        qs = parse_qs(parsed.query)
        # Query string must be empty so no case data leaks
        assert len(qs) == 0, f"Resource {res['name']} has query parameters in URL: {res['url']}"
        assert "case" not in res["url"].lower()
        assert "token" not in res["url"].lower()


def test_get_case_navigator_endpoint():
    # Uses seed case_demo_01 from development database
    resp = client.get("/api/cases/case_demo_01/navigator")
    assert resp.status_code == 200
    data = resp.json()
    
    assert data["case_id"] == "case_demo_01"
    assert data["category"] in CATEGORY_SPECIFIC_GUIDANCE
    assert "safety_notes" in data
    assert len(data["safety_notes"]) > 0
    assert "checklist" in data
    assert len(data["checklist"]) >= 6
    assert "emergency_shortcut" in data
    assert data["emergency_shortcut"]["helpline"] == "112"
    assert "disclaimer" in data
    assert "does not provide legal advice" in data["disclaimer"].lower()


def test_checklist_persistence_and_toggle():
    case_id = "case_demo_01"
    action_key = "preserve_evidence"
    
    # 1. Toggle ON
    resp = client.post(
        f"/api/cases/{case_id}/checklist/toggle",
        json={"action_key": action_key, "completed": True, "title": "Preserve original digital evidence"}
    )
    assert resp.status_code == 200
    res_data = resp.json()
    assert res_data["completed"] is True
    assert res_data["completed_at"] is not None
    
    # Verify in navigator query
    nav_resp = client.get(f"/api/cases/{case_id}/navigator")
    assert nav_resp.status_code == 200
    nav_data = nav_resp.json()
    target_item = next((item for item in nav_data["checklist"] if item["action_key"] == action_key), None)
    assert target_item is not None
    assert target_item["completed"] is True
    
    # 2. Toggle OFF
    resp_off = client.post(
        f"/api/cases/{case_id}/checklist/toggle",
        json={"action_key": action_key, "completed": False}
    )
    assert resp_off.status_code == 200
    assert resp_off.json()["completed"] is False
    
    nav_resp2 = client.get(f"/api/cases/{case_id}/navigator")
    target_item2 = next((item for item in nav_resp2.json()["checklist"] if item["action_key"] == action_key), None)
    assert target_item2 is not None
    assert target_item2["completed"] is False


def test_navigator_nonexistent_case():
    resp = client.get("/api/cases/case_nonexistent_999/navigator")
    assert resp.status_code == 404
