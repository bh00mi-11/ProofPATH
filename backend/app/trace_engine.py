"""
Deterministic Trace & Scenario Simulation Engine for ProofPath.

Claim states and precedence rules:
Precedence order:
1. REVIEW_NEEDED:
   - A relevant evidence source has a verified integrity problem (e.g. SHA-256 hash mismatch or missing file), OR
   - Only active contradictory observations exist (and no active supporting observations).
2. CONFLICTED:
   - Both active supporting and active contradictory observations exist, OR
   - A structured contradiction exists (e.g. mutually incompatible timestamps across active supporting sources).
3. SUPPORTED:
   - Active supporting observations exist, and no active contradictory observations or integrity failures exist.
4. UNVERIFIED:
   - No active supporting or contradictory observations exist (e.g. baseline has no links or evidence was excluded).

Terminology Note:
Observations are raw ingested facts linked to claims; linking an observation or computing SHA-256
proves data integrity against tampering, but does not unilaterally prove forensic authenticity.
"""
from typing import Dict, List, Any, Optional, Tuple, Set

def recompute_claim_states(
    claims: List[Dict[str, Any]],
    claim_evidence_links: List[Dict[str, Any]],
    observations: List[Dict[str, Any]],
    artifacts: List[Dict[str, Any]],
    overrides: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    overrides = overrides or []
    override_map = {o["target_id"]: o for o in overrides}

    # Artifact integrity verification
    artifact_integrity = {}
    for art in artifacts:
        is_tampered = art.get("hash_mismatch", False)
        artifact_integrity[art["id"]] = not is_tampered

    # Identify excluded artifacts from overrides
    excluded_artifact_ids: Set[str] = set()
    for art in artifacts:
        aid = art["id"]
        if aid in override_map:
            if not override_map[aid].get("enabled", True):
                excluded_artifact_ids.add(aid)

    # Build observation state after overrides
    # If parent artifact is excluded, observation derived from that artifact is automatically disabled
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

        # Evidence-level exclusion takes effect
        if art_id and art_id in excluded_artifact_ids:
            obs_copy["enabled"] = False
            obs_copy["disabled_by_artifact"] = art_id
        elif oid in override_map:
            # Observation-level override
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

            # If the observation is excluded via artifact toggle or observation toggle, ignore it
            if not obs.get("enabled", True):
                continue

            if obs.get("integrity_failed", False):
                has_integrity_failure = True

            rel = l.get("relation", "SUPPORTS").upper()
            if rel == "SUPPORTS":
                supporting_obs.append(obs)
            elif rel == "CONTRADICTS":
                contradicting_obs.append(obs)

        # Check for planted or inherent date/timestamp conflicts among active supporting observations:
        # A contradiction exists if the claim specifies an incident_time and supporting timestamps disagree with it,
        # or if the claim is about a single event/timeline (e.g. category 'Timeline' or field 'event_timestamp') with conflicting timestamps.
        timestamps = set()
        has_time_conflict = False
        claim_time = (c.get("incident_time") or "").strip()
        claim_cat = (c.get("category") or "").lower()

        for s in supporting_obs:
            if s.get("field") in ["timestamp", "date", "time", "event_timestamp"]:
                val = s.get("value", "").strip()
                if val:
                    timestamps.add(val)

        if len(timestamps) > 1:
            # If claim has category 'timeline' or if claim has a specific incident_time that differs from one of the timestamps
            if "timeline" in claim_cat or claim_time:
                has_time_conflict = True

        # Determine deterministic state with strict precedence rules:
        # Precedence 1: Integrity failure on an associated source -> REVIEW_NEEDED
        if has_integrity_failure:
            state = "REVIEW_NEEDED"
            reason = "Cryptographic integrity check failed on one or more supporting artifacts."
        # Precedence 1b: Only contradictory observations exist -> REVIEW_NEEDED
        elif len(contradicting_obs) > 0 and len(supporting_obs) == 0:
            state = "REVIEW_NEEDED"
            reason = f"Only contradictory observation(s) exist ({len(contradicting_obs)} found). Record requires review."
        # Precedence 2: Both supporting and contradictory exist, or structured time contradiction -> CONFLICTED
        elif (len(supporting_obs) > 0 and len(contradicting_obs) > 0) or has_time_conflict:
            state = "CONFLICTED"
            reason = "Contradictory timestamps or conflicting evidence found across active sources."
        # Precedence 3: No active supporting or contradictory observations -> UNVERIFIED
        elif len(supporting_obs) == 0 and len(contradicting_obs) == 0:
            state = "UNVERIFIED"
            reason = "No active evidence sources currently support this claim (unbacked or excluded)."
        # Precedence 4: Active supporting observations exist with no contradictions -> SUPPORTED
        else:
            state = "SUPPORTED"
            reason = f"Supported by {len(supporting_obs)} active observation(s)."

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


def compare_scenario_with_baseline(
    claims: List[Dict[str, Any]],
    claim_evidence_links: List[Dict[str, Any]],
    observations: List[Dict[str, Any]],
    artifacts: List[Dict[str, Any]],
    overrides: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Computes both baseline claim states (zero overrides) and scenario claim states.
    Produces a detailed diff including:
    - original claim state & scenario claim state
    - changed flag
    - supporting & conflicting observations before and after
    - exact source-linked explanation of change
    - list of dependency-impacted claims
    """
    baseline_res = recompute_claim_states(claims, claim_evidence_links, observations, artifacts, overrides=[])
    scenario_res = recompute_claim_states(claims, claim_evidence_links, observations, artifacts, overrides=overrides)

    baseline_claim_map = {c["id"]: c for c in baseline_res["claims"]}
    scenario_claim_map = {c["id"]: c for c in scenario_res["claims"]}

    changes = []
    affected_claim_ids = []

    # Map observation IDs to human-readable filenames and field names
    obs_meta_map = {}
    art_filename_map = {a["id"]: a.get("filename", a["id"]) for a in artifacts}
    for obs in observations:
        oid = obs["id"]
        art_id = obs.get("artifact_id")
        fname = art_filename_map.get(art_id, "direct statement") if art_id else "direct statement"
        field_name = obs.get("field", "detail")
        obs_meta_map[oid] = f"{fname} ({field_name})"

    def format_sources(oid_set: Set[str]) -> str:
        # Group by filename for clean reporting
        files_to_fields: Dict[str, Set[str]] = {}
        for oid in oid_set:
            meta = obs_meta_map.get(oid, oid)
            if " (" in meta and meta.endswith(")"):
                fname, fld = meta[:-1].split(" (", 1)
                files_to_fields.setdefault(fname, set()).add(fld)
            else:
                files_to_fields.setdefault(meta, set())

        summaries = []
        for fname, flds in sorted(files_to_fields.items()):
            if flds:
                summaries.append(f"'{fname}' [{', '.join(sorted(flds))}]")
            else:
                summaries.append(f"'{fname}'")
        return "; ".join(summaries)

    for c in claims:
        cid = c["id"]
        base_c = baseline_claim_map[cid]
        scen_c = scenario_claim_map[cid]

        changed = (
            base_c["state"] != scen_c["state"] or
            base_c["supporting_observations"] != scen_c["supporting_observations"] or
            base_c["contradicting_observations"] != scen_c["contradicting_observations"]
        )

        if changed:
            affected_claim_ids.append(cid)
            
            # Determine source-linked reason for state change
            diff_reason_parts = []
            if base_c["state"] != scen_c["state"]:
                diff_reason_parts.append(f"State transitioned from {base_c['state']} to {scen_c['state']}.")
            
            removed_supporting = set(base_c["supporting_observations"]) - set(scen_c["supporting_observations"])
            if removed_supporting:
                diff_reason_parts.append(f"Lost supporting evidence: {format_sources(removed_supporting)}.")

            added_supporting = set(scen_c["supporting_observations"]) - set(base_c["supporting_observations"])
            if added_supporting:
                diff_reason_parts.append(f"Gained supporting evidence: {format_sources(added_supporting)}.")

            removed_contradicting = set(base_c["contradicting_observations"]) - set(scen_c["contradicting_observations"])
            if removed_contradicting:
                diff_reason_parts.append(f"Removed conflicting evidence: {format_sources(removed_contradicting)}.")

            added_contradicting = set(scen_c["contradicting_observations"]) - set(base_c["contradicting_observations"])
            if added_contradicting:
                diff_reason_parts.append(f"Added conflicting evidence: {format_sources(added_contradicting)}.")

            diff_reason = " ".join(diff_reason_parts) if diff_reason_parts else scen_c["reason"]

            changes.append({
                "claim_id": cid,
                "claim_text": c.get("claim_text", ""),
                "baseline_state": base_c["state"],
                "scenario_state": scen_c["state"],
                "changed": True,
                "baseline_supporting": base_c["supporting_observations"],
                "scenario_supporting": scen_c["supporting_observations"],
                "baseline_contradicting": base_c["contradicting_observations"],
                "scenario_contradicting": scen_c["contradicting_observations"],
                "reason": diff_reason
            })

    return {
        "baseline_claims": baseline_res["claims"],
        "scenario_claims": scenario_res["claims"],
        "changes": changes,
        "affected_claims_count": len(affected_claim_ids),
        "affected_claim_ids": affected_claim_ids
    }
