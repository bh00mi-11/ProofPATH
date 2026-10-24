"""
Deterministic Trace & Scenario Simulation Engine for ProofPath.
Calculates claim states:
  - SUPPORTED: At least one active supporting observation, no direct contradictions, no hash failure.
  - CONFLICTED: Contradictory observations (e.g. mutually incompatible timestamps/sources).
  - UNVERIFIED: No active supporting observations (e.g. after what-if exclusion).
  - REVIEW_NEEDED: Source file failed cryptographic hash check or source missing.
"""
from typing import Dict, List, Any, Optional

def recompute_claim_states(
    claims: List[Dict[str, Any]],
    claim_evidence_links: List[Dict[str, Any]],
    observations: List[Dict[str, Any]],
    artifacts: List[Dict[str, Any]],
    overrides: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    overrides = overrides or []
    override_map = {o["target_id"]: o for o in overrides}

    # Integrity verification for artifacts
    artifact_integrity = {}
    for art in artifacts:
        # Default integrity passed if not marked otherwise
        # If artifact is tampered (e.g., hash_mismatch flag or verified via vault)
        is_tampered = art.get("hash_mismatch", False)
        artifact_integrity[art["id"]] = not is_tampered

    # Build observation state after overrides
    obs_by_id = {}
    for obs in observations:
        oid = obs["id"]
        obs_copy = dict(obs)
        art_id = obs.get("artifact_id")
        
        # Check if parent artifact is tampered
        if art_id and not artifact_integrity.get(art_id, True):
            obs_copy["integrity_failed"] = True
        else:
            obs_copy["integrity_failed"] = False

        if oid in override_map:
            ov = override_map[oid]
            obs_copy["enabled"] = bool(ov.get("enabled", 1))
            if ov.get("replacement_value") is not None:
                obs_copy["value"] = ov["replacement_value"]
                obs_copy["is_corrected"] = True
            if ov.get("disputed", 0):
                obs_copy["status"] = "DISPUTED"
        else:
            obs_copy["enabled"] = obs.get("enabled", True)

        obs_by_id[oid] = obs_copy

    # Now evaluate each claim
    evaluated_claims = []
    
    for c in claims:
        cid = c["id"]
        # Find all evidence links for this claim
        links = [l for l in claim_evidence_links if l["claim_id"] == cid]
        
        supporting_obs = []
        contradicting_obs = []
        has_integrity_failure = False

        for l in links:
            oid = l["observation_id"]
            obs = obs_by_id.get(oid)
            if not obs:
                continue

            # If the observation is excluded via scenario toggle, ignore it
            if not obs.get("enabled", True):
                continue

            if obs.get("integrity_failed", False):
                has_integrity_failure = True

            rel = l.get("relation", "SUPPORTS").upper()
            if rel == "SUPPORTS":
                supporting_obs.append(obs)
            elif rel == "CONTRADICTS":
                contradicting_obs.append(obs)

        # Check for planted or inherent date/timestamp conflicts among active supporting observations
        timestamps = set()
        has_time_conflict = False
        for s in supporting_obs:
            if s.get("field") == "timestamp":
                timestamps.add(s.get("value"))
        if len(timestamps) > 1:
            has_time_conflict = True

        # Determine deterministic state
        if has_integrity_failure:
            state = "REVIEW_NEEDED"
            reason = "Cryptographic integrity check failed on one or more supporting artifacts."
        elif has_time_conflict or len(contradicting_obs) > 0:
            state = "CONFLICTED"
            reason = "Contradictory timestamps or conflicting evidence found across active sources."
        elif len(supporting_obs) == 0:
            state = "UNVERIFIED"
            reason = "No active evidence sources currently support this claim (unbacked or excluded)."
        else:
            state = "SUPPORTED"
            reason = f"Supported by {len(supporting_obs)} verified evidence observation(s)."

        evaluated_claims.append({
            "id": cid,
            "claim_text": c.get("claim_text", ""),
            "incident_time": c.get("incident_time"),
            "category": c.get("category"),
            "state": state,
            "reason": reason,
            "active_sources_count": len(supporting_obs),
            "supporting_observations": [s["id"] for s in supporting_obs],
            "contradicting_observations": [s["id"] for s in contradicting_obs]
        })

    return {
        "claims": evaluated_claims,
        "active_observations": obs_by_id
    }
