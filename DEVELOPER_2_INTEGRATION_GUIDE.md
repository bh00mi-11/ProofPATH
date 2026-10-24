# ProofPath Developer 2 (Frontend / Mobile) Integration Guide

Welcome to Sprint 5 integration! The ProofPath FastAPI backend has been hardened, verified, and benchmarked.

This guide details all connection settings, contracts, and sample requests needed for the Expo mobile client.

---

## 1. Backend Connectivity & Local Dev Setup

### Running the Backend Server
From the project root:
```powershell
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- **Local Host URL**: `http://localhost:8000`
- **Android Emulator**: `http://10.0.2.2:8000`
- **Physical Device / LAN**: `http://<YOUR_LOCAL_IP>:8000` (ensure device is on the same Wi-Fi)

### Configurable CORS Origins
By default, the backend accepts origins from:
- `http://localhost:3000`
- `http://localhost:8081` (Metro bundler default)
- `http://localhost:19006` (Expo web)
- `http://127.0.0.1:3000`

If your Expo dev server is running on a different port or IP, set:
```bash
export PROOFPATH_CORS_ORIGINS="http://localhost:8081,http://192.168.1.50:8081"
```

---

## 2. Recommended Screen Integration Workflows

### A. Health & Demo Intake Fixture
1. **App Startup**: Call `GET /api/health` to confirm server status.
2. **"Load Demo Fixture" Button**: Call `POST /api/seed`.
   - Returns `{ "status": "success", "case_id": "case_demo_01" }`.
   - Populates 4 synthetic artifacts, 6 observations, 5 claims, and a planted timestamp conflict for immediate demonstration.

### B. Interactive Timeline & Case Overview (`GET /api/cases/{case_id}`)
- Returns:
  - `case`: Case title & description.
  - `artifacts`: Ingested files list (internal file paths are stripped).
  - `observations`: Ingested factual statements and extracted fields.
  - `claims`: Claims with computed states:
    - `SUPPORTED`: Corroborated by active observations.
    - `CONFLICTED`: Clashing timestamps or conflicting observations detected.
    - `UNVERIFIED`: No active supporting observations.
    - `REVIEW_NEEDED`: Contradiction-only or cryptographic integrity issue.

### C. The Evidence Time Machine (`POST /api/scenarios/simulate`)
Used for interactive "What-If" toggles in the mobile UI.
- **Evidence Artifact Toggle (Cascading)**:
  ```json
  {
    "case_id": "case_demo_01",
    "scenario_name": "What if screenshot was excluded?",
    "overrides": [
      {
        "target_id": "art_...",  // Pass an artifact_id
        "enabled": false,
        "reason": "Excluding entire threat screenshot"
      }
    ]
  }
  ```
  *Every observation derived from that artifact automatically becomes disabled.*
- **Observation-Level Toggle**:
  Pass `target_id: "obs_06_manual"` with `enabled: false` to resolve the planted conflict on `claim_05`.
- **Response Fields for UI Rendering**:
  - `claims`: Array of recalculation claim states for timeline display.
  - `baseline_claims`: The unmodified baseline record for side-by-side comparison.
  - `changes`: Array of diff objects detailing:
    - `claim_id`
    - `baseline_state` vs `scenario_state`
    - `baseline_supporting` vs `scenario_supporting`
    - `reason`: Human-readable summary of the exact transition.

### D. Mobile Privacy Review & PDF Export
1. **Step 1: Recipient Preview** (`POST /api/disclosure/preview`)
   Send:
   ```json
   {
     "case_id": "case_demo_01",
     "recipient_type": "TRUSTED_CONTACT" // Or "SUPPORT_ORGANIZATION", "LEGAL_PROFESSIONAL"
   }
   ```
   Display the returned `approved_fields`, `excluded_fields`, and `warnings` in your modal.
2. **Step 2: Explicit Confirmation & Download** (`POST /api/export/pdf`)
   Send:
   ```json
   {
     "case_id": "case_demo_01",
     "recipient_type": "TRUSTED_CONTACT",
     "redacted_terms": ["Executive X"],
     "confirmed_config": true // REQUIRED: must be true or returns HTTP 400
   }
   ```
   Returns binary `application/pdf`.

---

## 3. Error Handling Guide
- **HTTP 400**:
  - Invalid target ID (outside case scope)
  - Unsupported file type or file content does not match signature
  - Missing `confirmed_config: true` on PDF export
  - Privacy leakage check failed (sensitive terms detected in document)
- **HTTP 404**: Case ID does not exist
- **HTTP 409**: Duplicate file upload within the same case (SHA-256 collision)
- **HTTP 413**: File upload exceeds upload size limit (default 10 MB)

---

## 4. Current Status
The backend test suite is running **30/30 tests passing**. We are standing by for your branch to begin live mobile-to-backend integration testing.
