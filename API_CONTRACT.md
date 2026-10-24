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
Supports both:
- **Evidence-level exclusion**: pass an artifact ID (e.g. `art_...`) as `target_id` with `enabled: false`. Every observation derived from that artifact becomes disabled.
- **Observation-level exclusion / correction**: pass an observation ID (e.g. `obs_01`) as `target_id`.

Request Body:
```json
{
  "case_id": "case_demo_01",
  "scenario_name": "What if screenshot was excluded?",
  "overrides": [
    {
      "target_id": "art_threat_screen",
      "enabled": false,
      "reason": "Excluding entire threat screenshot artifact"
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
  "affected_claims_count": 1,
  "affected_claim_ids": ["claim_05"],
  "claims": [
    {
      "id": "claim_01",
      "state": "SUPPORTED",
      "reason": "Supported by 1 active observation(s).",
      "active_sources_count": 1,
      "supporting_observations": ["obs_04"],
      "contradicting_observations": []
    },
    {
      "id": "claim_05",
      "state": "SUPPORTED",
      "reason": "Supported by 2 active observation(s).",
      "active_sources_count": 2,
      "supporting_observations": ["obs_01", "obs_06_manual"],
      "contradicting_observations": []
    }
  ],
  "baseline_claims": [
    {
      "id": "claim_01",
      "state": "SUPPORTED",
      "active_sources_count": 2
    }
  ],
  "changes": [
    {
      "claim_id": "claim_05",
      "claim_text": "Incident took place during evening hours...",
      "baseline_state": "CONFLICTED",
      "scenario_state": "SUPPORTED",
      "changed": true,
      "baseline_supporting": ["obs_01", "obs_06_manual"],
      "scenario_supporting": ["obs_01", "obs_06_manual"],
      "baseline_contradicting": [],
      "scenario_contradicting": [],
      "reason": "State transitioned from CONFLICTED to SUPPORTED."
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

## 6. Disclosure Preview & Recipient-Aware PDF Compiler
ProofPath applies a server-side allowlist model according to three predefined recipient types:
- `TRUSTED_CONTACT`: Overview statements & categories; strictly suppresses forensic observation details, raw timestamps, internal IDs, and SHA-256 hashes.
- `SUPPORT_ORGANIZATION`: Dates, categories, support notes, observation counts; suppresses raw identifiers and hashes.
- `LEGAL_PROFESSIONAL`: Full structured chronological timeline, observation source types, link relations, and cryptographic SHA-256 proofs.

Raw image attachments are strictly excluded across all types to prevent visual metadata leakage.

### `POST /api/disclosure/preview`
Inspects what will be included vs. excluded for the given recipient type before report generation.

Request Body:
```json
{
  "case_id": "case_demo_01",
  "recipient_type": "TRUSTED_CONTACT",
  "redacted_terms": ["Executive X"]
}
```

Response:
```json
{
  "status": "success",
  "preview": {
    "recipient_type": "TRUSTED_CONTACT",
    "approved_fields": ["case_title", "category", "claim_text", "summary_note", "verification_state"],
    "excluded_fields": ["evidence_sha256", "incident_date", "incident_time", "observation_details", "relation"],
    "warnings": [
      "Sensitive forensic identifiers, exact timestamps, and artifact SHA-256 hashes are omitted for personal privacy.",
      "Raw evidence media attachments are excluded.",
      "Notice: This report facilitates emotional/personal support and is not formatted for evidentiary submission."
    ],
    "included_claims_count": 5,
    "raw_images_excluded": true,
    "redacted_terms_count": 1,
    "disclaimer": "Notice: ProofPath provides deterministic integrity and structured disclosure; it does not promise absolute anonymity."
  }
}
```

---

### `POST /api/export/pdf`
Compiles an allowlisted, multi-page, non-clipped PDF document. Requires explicit confirmation (`confirmed_config: true`) acknowledging review of the disclosure preview.

Request Body:
```json
{
  "case_id": "case_demo_01",
  "recipient_type": "LEGAL_PROFESSIONAL",
  "redacted_terms": ["Executive X", "Manager"],
  "include_unverified": true,
  "confirmed_config": true
}
```

Response:
* Binary stream: `application/pdf`
* Headers: `Content-Disposition: attachment; filename=ProofPath_Disclosure_case_demo_01_legal_professional.pdf`
* Safety Enforcement:
  - If `confirmed_config` is `false`, returns `HTTP 400 Confirmation required`.
  - Scans both extracted document text and document metadata against `redacted_terms` and seeded sensitive identifiers.
  - If any forbidden term is detected, download is aborted and returns `HTTP 400 Privacy check failed!`.

