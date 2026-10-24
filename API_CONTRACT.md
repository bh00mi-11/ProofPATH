# ProofPath API Contract Specification (For Developer 2 / Expo Mobile Client)
Base URL: `http://localhost:8000` (or local LAN IP for physical device / Expo emulator)

---

## 1. System Health & Demo Fixture Seed
### `GET /api/health`
Response:
```json
{"status": "ok", "service": "ProofPath Backend"}
```

### `POST /api/seed`
Resets the database and seeds the realistic 60-second synthetic demo fixture (2 screenshots, 1 chat export, 1 document, 1 manual observation with a planted conflict, 5 dependent incident claims).

Response:
```json
{
  "status": "success",
  "case_id": "case_demo_01",
  "message": "Demo fixture re-seeded"
}
```

---

## 2. Case Details & Interactive Timeline
### `GET /api/cases/{case_id}`
Returns complete case record: artifacts, observations, claims with computed verification states (`SUPPORTED`, `CONFLICTED`, `UNVERIFIED`, `REVIEW_NEEDED`).

Response structure:
```json
{
  "case": {
    "id": "case_demo_01",
    "title": "Workplace Harassment Incident Timeline",
    "description": "Evidence review record for October 2026 incident logs."
  },
  "artifacts": [
    {
      "id": "art_...",
      "filename": "threat_message_screenshot.png",
      "file_type": "screenshot",
      "sha256": "3a7b...",
      "file_size": 48
    }
  ],
  "observations": [
    {
      "id": "obs_01",
      "artifact_id": "art_...",
      "field": "timestamp",
      "value": "2026-10-22 21:45",
      "source_type": "screenshot",
      "status": "ACTIVE"
    }
  ],
  "claims": [
    {
      "id": "claim_01",
      "claim_text": "Hostile message was received by target on evening of Oct 22",
      "incident_time": "2026-10-22",
      "category": "Harassment",
      "state": "SUPPORTED",
      "reason": "Supported by 2 verified evidence observation(s).",
      "active_sources_count": 2,
      "supporting_observations": ["obs_01", "obs_04"],
      "contradicting_observations": []
    }
  ]
}
```

---

## 3. Evidence Vault Intake
### `POST /api/artifacts/upload?case_id={case_id}`
Multipart Form-Data:
* `file`: Binary file upload

Response:
```json
{
  "status": "success",
  "artifact": {
    "artifact_id": "art_a92f801a21b3",
    "filename": "slack_dm.png",
    "vault_path": ".../data/vault/art_a92f801a21b3.png",
    "sha256": "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
    "file_size": 249012,
    "file_type": "png"
  }
}
```

---

## 4. The Evidence Time Machine (Scenario Simulation)
Simulates what happens when a piece of evidence is removed, disputed, or corrected, **without modifying the original stored baseline data**.

### `POST /api/scenarios/simulate`
Request Body:
```json
{
  "case_id": "case_demo_01",
  "scenario_name": "What if screenshot was excluded?",
  "overrides": [
    {
      "target_id": "obs_01",
      "enabled": false,
      "reason": "Simulating scenario where screenshot timestamp is omitted"
    },
    {
      "target_id": "obs_06_manual",
      "enabled": true,
      "replacement_value": "2026-10-22 21:45",
      "reason": "Correcting manually entered timestamp error"
    }
  ]
}
```

Response:
```json
{
  "status": "success",
  "scenario_name": "What if screenshot was excluded?",
  "overrides_applied": 2,
  "claims": [
    {
      "id": "claim_01",
      "state": "SUPPORTED",
      "reason": "Supported by 1 verified evidence observation(s).",
      "active_sources_count": 1
    },
    {
      "id": "claim_05",
      "state": "SUPPORTED",
      "reason": "Supported by 2 verified evidence observation(s)."
    }
  ]
}
```

---

## 5. Record Stress Test (5 Deterministic Integrity Rules)
### `GET /api/cases/{case_id}/stress-test`
Evaluates:
1. `DUPLICATE_SHA256`: Dual files sharing hash flagged as duplicate.
2. `TAMPER_DETECTED`: Physical vault file bytes altered after intake.
3. `MISSING_SOURCE_ARTIFACT`: Observation refers to deleted/missing artifact.
4. `CLAIM_WITHOUT_EVIDENCE`: Claims with zero supporting observations (`UNVERIFIED`).
5. `CONTRADICTORY_TIMESTAMPS`: Clashing timestamps for identical events (`CONFLICTED`).

Response:
```json
{
  "status": "WARNINGS_FOUND",
  "total_issues": 1,
  "issues": [
    {
      "rule": "CONTRADICTORY_TIMESTAMPS",
      "severity": "HIGH",
      "claim_id": "claim_05",
      "message": "Claim 'claim_05' has 2 conflicting recorded timestamps: ['2026-10-22 18:00', '2026-10-22 21:45']"
    }
  ],
  "checklist": [
    {"test": "SHA-256 Duplication Check", "passed": true},
    {"test": "Vault Storage Tamper Verification", "passed": true},
    {"test": "Source Traceability Audit", "passed": true},
    {"test": "Unbacked Claim Audit", "passed": true},
    {"test": "Event Timestamp Consistency Check", "passed": false}
  ]
}
```

---

## 6. Disclosure Compiler (Safe PDF Export & Privacy Check)
### `POST /api/export/pdf`
Request Body:
```json
{
  "case_id": "case_demo_01",
  "redacted_terms": ["Executive X", "Manager"],
  "include_unverified": true
}
```

Response:
* Binary stream: `application/pdf`
* Headers: `Content-Disposition: attachment; filename=ProofPath_Disclosure_case_demo_01.pdf`
* Note: If any redacted term appears in the rendered output, the request fails with `HTTP 400 Privacy check failed!`.
