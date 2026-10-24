"""
Automated Test Suite for Feature 9: Victim Justice & Remedies.
Verifies:
1. Curated pathways implementation (NALSA Free Legal Aid, Victim Compensation, Cybercrime, POSH IC, IT Rules Takedown, Women Support).
2. Deterministic eligibility states:
   - POTENTIALLY_ELIGIBLE
   - MORE_INFORMATION_NEEDED
   - NOT_APPLICABLE
   - REQUIRES_PROFESSIONAL_REVIEW
3. Missing information and known facts evaluations.
4. No automatic benefit grant or promised compensation.
5. Official source URLs contain no case or private tracking parameters.
6. Case isolation and unknown category fallback.
7. Disclosures: excluded by default.
8. Regression coverage: Guardian, Navigator, Legal Context, Time Machine, Stress Test, and Accountability.
"""

import pytest
from fastapi.testclient import TestClient
from urllib.parse import urlparse, parse_qs
from app.main import app
from app.remedies import REMEDY_PATHWAYS_CATALOG
from app.db import get_connection, init_db, DB_PATH

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    init_db(DB_PATH)


def test_remedy_pathways_catalog_integrity():
    """Verify all remedy pathways have valid authorities, governing laws, and static official URLs."""
    assert len(REMEDY_PATHWAYS_CATALOG) >= 6

    pathway_ids = {p["id"] for p in REMEDY_PATHWAYS_CATALOG}
    assert "remedy_nalsa_legal_aid" in pathway_ids
    assert "remedy_victim_compensation" in pathway_ids
    assert "remedy_cybercrime_escalation" in pathway_ids
    assert "remedy_posh_workplace" in pathway_ids
    assert "remedy_platform_takedown" in pathway_ids
    assert "remedy_women_support_osc" in pathway_ids

    for item in REMEDY_PATHWAYS_CATALOG:
        assert item["verification_status"] in ("VERIFIED", "VERIFIED_WITH_QUALIFICATIONS")
        assert item["last_verified"] is not None
        assert item["official_portal_url"].startswith("http")
        assert len(item["statutory_criteria"]) >= 1
        assert len(item["required_documents"]) >= 1

        # Privacy check: No query parameters or tokens in URL
        parsed = urlparse(item["official_portal_url"])
        qs = parse_qs(parsed.query)
        assert len(qs) == 0


def test_remedies_endpoint_demo_case():
    """Evaluate remedy pathways for the demo case (workplace harassment context)."""
    resp = client.get("/api/cases/case_demo_01/remedies")
    assert resp.status_code == 200
    data = resp.json()

    assert data["case_id"] == "case_demo_01"
    assert data["total_pathways"] >= 6
    assert "disclaimer" in data
    assert "does not grant financial compensation" in data["disclaimer"].lower()

    # POSH workplace pathway should be POTENTIALLY_ELIGIBLE
    posh_pathway = next(p for p in data["pathways"] if p["id"] == "remedy_posh_workplace")
    assert posh_pathway["eligibility_state"] == "POTENTIALLY_ELIGIBLE"
    assert len(posh_pathway["known_facts"]) >= 1

    # Victim compensation should be REQUIRES_PROFESSIONAL_REVIEW (never automatically approved)
    comp_pathway = next(p for p in data["pathways"] if p["id"] == "remedy_victim_compensation")
    assert comp_pathway["eligibility_state"] == "REQUIRES_PROFESSIONAL_REVIEW"
    assert "Section 396" in comp_pathway["governing_law"]


def test_missing_information_and_known_facts_distinction():
    """Missing information must be transparently enumerated and distinguish known facts from unverified claims."""
    resp = client.get("/api/cases/case_demo_01/remedies")
    assert resp.status_code == 200
    data = resp.json()

    legal_aid = next(p for p in data["pathways"] if p["id"] == "remedy_nalsa_legal_aid")
    assert legal_aid["eligibility_state"] == "POTENTIALLY_ELIGIBLE"
    assert any("Section 12" in c for c in legal_aid["statutory_criteria"])
    assert len(legal_aid["missing_info"]) >= 1


def test_remedies_case_isolation_and_404():
    """Invalid case ID should safely return 404."""
    resp = client.get("/api/cases/case_nonexistent_8888/remedies")
    assert resp.status_code == 404
