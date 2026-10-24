"""
ProofPath Record Stress Test (5 Deterministic Integrity Rules):
1. Duplicate SHA-256 detection (never treated as two independent sources).
2. Changed file hash since intake (tamper detection -> REVIEW_NEEDED).
3. Missing source (claim referencing nonexistent observation or artifact).
4. Contradictory dates/timestamps for the same event -> CONFLICTED.
5. Claim without evidence -> UNVERIFIED.
"""
from typing import Dict, List, Any
from pathlib import Path
from .vault import EvidenceVault

def run_stress_test(
    cases: List[Dict[str, Any]],
    artifacts: List[Dict[str, Any]],
    observations: List[Dict[str, Any]],
    claims: List[Dict[str, Any]],
    claim_evidence_links: List[Dict[str, Any]],
    vault: EvidenceVault
) -> Dict[str, Any]:
    issues = []
    
    # 1. Duplicate SHA-256 Check
    sha_map = {}
    for art in artifacts:
        sha = art["sha256"]
        if sha in sha_map:
            issues.append({
                "rule": "DUPLICATE_SHA256",
                "severity": "WARNING",
                "artifact_id": art["id"],
                "duplicate_of": sha_map[sha],
                "message": f"Artifact '{art['filename']}' ({art['id']}) has identical SHA-256 hash to '{sha_map[sha]}'. Duplicate files cannot serve as independent corroboration."
            })
        else:
            sha_map[sha] = art["id"]

    # 2. Tampered / Integrity Hash Check
    for art in artifacts:
        v_path = art["vault_path"]
        expected_sha = art["sha256"]
        is_intact = vault.verify_integrity(v_path, expected_sha)
        if not is_intact:
            issues.append({
                "rule": "TAMPER_DETECTED",
                "severity": "CRITICAL",
                "artifact_id": art["id"],
                "message": f"Cryptographic integrity failed for '{art['filename']}'! File has been modified or deleted from vault since intake."
            })

    # 3. Missing Source Check
    obs_ids = {o["id"] for o in observations}
    art_ids = {a["id"] for a in artifacts}
    
    for obs in observations:
        aid = obs.get("artifact_id")
        if aid and aid not in art_ids:
            issues.append({
                "rule": "MISSING_SOURCE_ARTIFACT",
                "severity": "HIGH",
                "observation_id": obs["id"],
                "message": f"Observation '{obs['id']}' references artifact '{aid}' which does not exist in the record."
            })

    # 4. Claim Without Evidence Check
    claim_links = {}
    for l in claim_evidence_links:
        claim_links.setdefault(l["claim_id"], []).append(l["observation_id"])

    for c in claims:
        linked_obs = claim_links.get(c["id"], [])
        if not linked_obs:
            issues.append({
                "rule": "CLAIM_WITHOUT_EVIDENCE",
                "severity": "MEDIUM",
                "claim_id": c["id"],
                "message": f"Claim '{c['id']}' has no linked supporting observations and is unverified."
            })

    # 5. Timestamp Contradiction Check
    obs_dict = {o["id"]: o for o in observations}
    for c in claims:
        linked_obs_ids = claim_links.get(c["id"], [])
        timestamps = []
        for oid in linked_obs_ids:
            obs = obs_dict.get(oid)
            if obs and obs.get("field") == "timestamp":
                timestamps.append((obs["value"], oid))
        
        distinct_vals = {t[0] for t in timestamps}
        if len(distinct_vals) > 1:
            issues.append({
                "rule": "CONTRADICTORY_TIMESTAMPS",
                "severity": "HIGH",
                "claim_id": c["id"],
                "message": f"Claim '{c['id']}' has {len(distinct_vals)} conflicting recorded timestamps: {list(distinct_vals)}"
            })

    passed = len([i for i in issues if i["severity"] == "CRITICAL"]) == 0
    return {
        "status": "PASSED" if passed and len(issues) == 0 else ("WARNINGS_FOUND" if passed else "FAILED"),
        "total_issues": len(issues),
        "issues": issues,
        "checklist": [
            {"test": "SHA-256 Duplication Check", "passed": not any(i["rule"] == "DUPLICATE_SHA256" for i in issues)},
            {"test": "Vault Storage Tamper Verification", "passed": not any(i["rule"] == "TAMPER_DETECTED" for i in issues)},
            {"test": "Source Traceability Audit", "passed": not any(i["rule"] == "MISSING_SOURCE_ARTIFACT" for i in issues)},
            {"test": "Unbacked Claim Audit", "passed": not any(i["rule"] == "CLAIM_WITHOUT_EVIDENCE" for i in issues)},
            {"test": "Event Timestamp Consistency Check", "passed": not any(i["rule"] == "CONTRADICTORY_TIMESTAMPS" for i in issues)}
        ]
    }
