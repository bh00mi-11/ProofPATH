"""
FastAPI Server for ProofPath: The Evidence Time Machine Backend.
Coordinates Evidence Vault, Deterministic Trace Engine, Stress Test, and PDF Compiler.
"""
from fastapi import FastAPI, UploadFile, File, HTTPException, Response, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from pathlib import Path
from contextlib import asynccontextmanager
import os
import sqlite3

from .db import init_db, get_connection, VAULT_DIR, DB_PATH
from .vault import EvidenceVault
from .trace_engine import recompute_claim_states, compare_scenario_with_baseline
from .stress_test import run_stress_test
from .compiler import (
    compile_disclosure_pdf,
    verify_pdf_privacy_leakage,
    generate_disclosure_preview,
    RecipientType,
    RECIPIENT_FIELD_ALLOWLISTS
)
from .fixture import seed_demo_fixture

# Environment configuration
ENV_MODE = os.getenv("PROOFPATH_ENV", "development").lower()
CORS_ORIGINS_RAW = os.getenv("PROOFPATH_CORS_ORIGINS", "http://localhost:3000,http://localhost:8081,http://localhost:19006,http://127.0.0.1:3000")
ALLOWED_ORIGINS = [orig.strip() for orig in CORS_ORIGINS_RAW.split(",") if orig.strip()]

# Maximum in-memory upload chunk/read limit (default 10 MB)
MAX_UPLOAD_SIZE = int(os.getenv("PROOFPATH_MAX_UPLOAD_SIZE", 10 * 1024 * 1024))

vault = EvidenceVault(VAULT_DIR, max_size=MAX_UPLOAD_SIZE)
init_db(DB_PATH)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure demo fixture is available in development mode
    if ENV_MODE == "development":
        conn = get_connection()
        try:
            cur = conn.cursor()
            cur.execute("SELECT COUNT(*) FROM cases")
            if cur.fetchone()[0] == 0:
                seed_demo_fixture(conn, vault)
        finally:
            conn.close()
    yield
    # Shutdown logic if needed

app = FastAPI(
    title="ProofPath Evidence Time Machine API",
    version="1.0.0",
    lifespan=lifespan
)

# Secure CORS configuration: explicit origins, avoiding wildcard with credentials
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS if ALLOWED_ORIGINS else ["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Models using Field(default_factory=...) and Pydantic V2 idioms
class WhatIfOverride(BaseModel):
    target_id: str
    enabled: bool = True
    replacement_value: Optional[str] = None
    disputed: bool = False
    reason: Optional[str] = None

class CaseCreateRequest(BaseModel):
    title: str
    description: Optional[str] = ""

class ScenarioSimulationRequest(BaseModel):
    case_id: str
    scenario_name: Optional[str] = "Simulation Scenario"
    overrides: List[WhatIfOverride] = Field(default_factory=list)

class DisclosurePreviewRequest(BaseModel):
    case_id: str
    recipient_type: str = "LEGAL_PROFESSIONAL"
    redacted_terms: List[str] = Field(default_factory=list)
    include_unverified: bool = True

class PDFExportRequest(BaseModel):
    case_id: str
    recipient_type: str = "LEGAL_PROFESSIONAL"
    redacted_terms: List[str] = Field(default_factory=list)
    include_unverified: bool = True
    scenario_id: Optional[str] = None
    confirmed_config: bool = False  # Requirement 8: Explicit confirmation before generation

def get_validated_case(conn: sqlite3.Connection, case_id: str) -> Dict[str, Any]:
    """Helper to validate case existence before proceeding with operations."""
    cur = conn.cursor()
    cur.execute("SELECT * FROM cases WHERE id = ?", (case_id,))
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found")
    return dict(row)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "ProofPath Backend"}

@app.post("/api/seed")
def reset_and_seed():
    if ENV_MODE != "development":
        raise HTTPException(status_code=403, detail="Reset and seed endpoint is restricted to development environment")
    conn = get_connection()
    try:
        case_id = seed_demo_fixture(conn, vault)
        return {"status": "success", "case_id": case_id, "message": "Demo fixture re-seeded"}
    finally:
        conn.close()

@app.get("/api/cases")
def list_cases():
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM cases ORDER BY created_at DESC")
        cases = [dict(r) for r in cur.fetchall()]
        return {"cases": cases}
    finally:
        conn.close()

@app.post("/api/cases")
def create_case(req: CaseCreateRequest):
    if not req.title.strip():
        raise HTTPException(status_code=400, detail="Title cannot be empty")
    import uuid
    case_id = f"case_{uuid.uuid4().hex[:8]}"
    conn = get_connection()
    try:
        with conn:
            conn.execute(
                "INSERT INTO cases (id, title, description) VALUES (?, ?, ?)",
                (case_id, req.title.strip(), (req.description or "").strip())
            )
        return {"status": "success", "case": {"id": case_id, "title": req.title.strip(), "description": (req.description or "").strip()}}
    finally:
        conn.close()

@app.get("/api/cases/{case_id}")
def get_case(case_id: str):
    conn = get_connection()
    try:
        case_row = get_validated_case(conn, case_id)
        cur = conn.cursor()

        cur.execute("SELECT * FROM artifacts WHERE case_id = ?", (case_id,))
        artifacts = [dict(r) for r in cur.fetchall()]

        cur.execute("SELECT * FROM observations WHERE case_id = ?", (case_id,))
        observations = [dict(r) for r in cur.fetchall()]

        cur.execute("SELECT * FROM claims WHERE case_id = ?", (case_id,))
        claims = [dict(r) for r in cur.fetchall()]

        # Scope claim_evidence exclusively to claims belonging to this case
        cur.execute(
            """
            SELECT ce.* FROM claim_evidence ce
            JOIN claims c ON ce.claim_id = c.id
            WHERE c.case_id = ?
            """,
            (case_id,)
        )
        links = [dict(r) for r in cur.fetchall()]

        # Run baseline trace
        trace_res = recompute_claim_states(claims, links, observations, artifacts)

        # Sanitize internal filesystem paths from artifacts response
        sanitized_artifacts = []
        for art in artifacts:
            art_copy = dict(art)
            art_copy.pop("vault_path", None)
            sanitized_artifacts.append(art_copy)

        return {
            "case": case_row,
            "artifacts": sanitized_artifacts,
            "observations": observations,
            "claims": trace_res["claims"],
            "links": links
        }
    finally:
        conn.close()

@app.post("/api/artifacts/upload")
async def upload_artifact(case_id: str = Query(...), file: UploadFile = File(...)):
    conn = get_connection()
    try:
        get_validated_case(conn, case_id)
    finally:
        conn.close()

    # Pre-check upload size via Content-Length header or incremental read
    content = await file.read()
    if len(content) > MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"Uploaded file exceeds maximum permitted size of {MAX_UPLOAD_SIZE} bytes"
        )

    # Store file in vault with magic check and sanitization
    try:
        stored = vault.store_file(file.filename or "uploaded_artifact", content)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Check for duplicate SHA-256 within the same case
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT id, filename FROM artifacts WHERE case_id = ? AND sha256 = ?",
            (case_id, stored["sha256"])
        )
        existing = cur.fetchone()
        if existing:
            vault.remove_file(stored["vault_path"])
            raise HTTPException(
                status_code=409,
                detail=f"Exact duplicate artifact already exists in this case: artifact '{existing['id']}' ({existing['filename']})"
            )

        with conn:
            conn.execute(
                """
                INSERT INTO artifacts (id, case_id, filename, file_type, vault_path, sha256, file_size)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (stored["artifact_id"], case_id, stored["filename"], stored["file_type"],
                 stored["vault_path"], stored["sha256"], stored["file_size"])
            )
    except HTTPException:
        raise
    except Exception as e:
        vault.remove_file(stored["vault_path"])
        raise HTTPException(status_code=500, detail=f"Database error storing artifact: {str(e)}")
    finally:
        conn.close()

    # Mask vault_path in API response to avoid leaking internal filesystem paths
    res_artifact = dict(stored)
    res_artifact.pop("vault_path", None)

    return {"status": "success", "artifact": res_artifact}

@app.post("/api/scenarios/simulate")
def simulate_scenario(req: ScenarioSimulationRequest):
    conn = get_connection()
    try:
        get_validated_case(conn, req.case_id)
        cur = conn.cursor()

        cur.execute("SELECT * FROM artifacts WHERE case_id = ?", (req.case_id,))
        artifacts = [dict(r) for r in cur.fetchall()]

        cur.execute("SELECT * FROM observations WHERE case_id = ?", (req.case_id,))
        observations = [dict(r) for r in cur.fetchall()]

        cur.execute("SELECT * FROM claims WHERE case_id = ?", (req.case_id,))
        claims = [dict(r) for r in cur.fetchall()]

        # Scope claim_evidence exclusively to claims belonging to this case
        cur.execute(
            """
            SELECT ce.* FROM claim_evidence ce
            JOIN claims c ON ce.claim_id = c.id
            WHERE c.case_id = ?
            """,
            (req.case_id,)
        )
        links = [dict(r) for r in cur.fetchall()]

        # Validate that all override target IDs belong to this case
        known_obs_ids = {o["id"] for o in observations}
        known_art_ids = {a["id"] for a in artifacts}
        valid_targets = known_obs_ids.union(known_art_ids)

        for override in req.overrides:
            if override.target_id not in valid_targets:
                raise HTTPException(
                    status_code=400,
                    detail=f"Target ID '{override.target_id}' does not exist in case '{req.case_id}' or is outside this case scope"
                )

        overrides_list = [o.model_dump() for o in req.overrides]
        comparison = compare_scenario_with_baseline(claims, links, observations, artifacts, overrides_list)

        return {
            "status": "success",
            "scenario_name": req.scenario_name,
            "claims": comparison["scenario_claims"],
            "baseline_claims": comparison["baseline_claims"],
            "changes": comparison["changes"],
            "affected_claims_count": comparison["affected_claims_count"],
            "affected_claim_ids": comparison["affected_claim_ids"],
            "overrides_applied": len(overrides_list)
        }
    finally:
        conn.close()

@app.get("/api/cases/{case_id}/stress-test")
def stress_test(case_id: str):
    conn = get_connection()
    try:
        case_row = get_validated_case(conn, case_id)
        cur = conn.cursor()

        cur.execute("SELECT * FROM artifacts WHERE case_id = ?", (case_id,))
        artifacts = [dict(r) for r in cur.fetchall()]

        cur.execute("SELECT * FROM observations WHERE case_id = ?", (case_id,))
        observations = [dict(r) for r in cur.fetchall()]

        cur.execute("SELECT * FROM claims WHERE case_id = ?", (case_id,))
        claims = [dict(r) for r in cur.fetchall()]

        cur.execute(
            """
            SELECT ce.* FROM claim_evidence ce
            JOIN claims c ON ce.claim_id = c.id
            WHERE c.case_id = ?
            """,
            (case_id,)
        )
        links = [dict(r) for r in cur.fetchall()]

        res = run_stress_test([case_row], artifacts, observations, claims, links, vault)
        return res
    finally:
        conn.close()

@app.post("/api/disclosure/preview")
def disclosure_preview(req: DisclosurePreviewRequest):
    conn = get_connection()
    try:
        case_row = get_validated_case(conn, req.case_id)
        cur = conn.cursor()

        cur.execute("SELECT * FROM artifacts WHERE case_id = ?", (req.case_id,))
        artifacts = [dict(r) for r in cur.fetchall()]

        cur.execute("SELECT * FROM observations WHERE case_id = ?", (req.case_id,))
        observations = [dict(r) for r in cur.fetchall()]

        cur.execute("SELECT * FROM claims WHERE case_id = ?", (req.case_id,))
        claims = [dict(r) for r in cur.fetchall()]

        cur.execute(
            """
            SELECT ce.* FROM claim_evidence ce
            JOIN claims c ON ce.claim_id = c.id
            WHERE c.case_id = ?
            """,
            (req.case_id,)
        )
        links = [dict(r) for r in cur.fetchall()]

        trace_res = recompute_claim_states(claims, links, observations, artifacts)
        
        try:
            preview = generate_disclosure_preview(
                recipient_type=req.recipient_type,
                case_title=case_row["title"],
                claims=trace_res["claims"],
                observations=observations,
                artifacts=artifacts,
                redacted_terms=req.redacted_terms
            )
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

        return {"status": "success", "preview": preview}
    finally:
        conn.close()

@app.post("/api/export/pdf")
def export_pdf(req: PDFExportRequest):
    # Requirement 8: Explicit confirmation of the approved disclosure configuration
    if not req.confirmed_config:
        raise HTTPException(
            status_code=400,
            detail="Confirmation required: 'confirmed_config' must be set to true after reviewing the disclosure preview."
        )

    conn = get_connection()
    try:
        case_row = get_validated_case(conn, req.case_id)
        case_title = case_row["title"]
        cur = conn.cursor()

        cur.execute("SELECT * FROM artifacts WHERE case_id = ?", (req.case_id,))
        artifacts = [dict(r) for r in cur.fetchall()]

        cur.execute("SELECT * FROM observations WHERE case_id = ?", (req.case_id,))
        observations = [dict(r) for r in cur.fetchall()]

        cur.execute("SELECT * FROM claims WHERE case_id = ?", (req.case_id,))
        claims = [dict(r) for r in cur.fetchall()]

        cur.execute(
            """
            SELECT ce.* FROM claim_evidence ce
            JOIN claims c ON ce.claim_id = c.id
            WHERE c.case_id = ?
            """,
            (req.case_id,)
        )
        links = [dict(r) for r in cur.fetchall()]

        trace_res = recompute_claim_states(claims, links, observations, artifacts)
        
        try:
            pdf_bytes = compile_disclosure_pdf(
                case_title=case_title,
                claims=trace_res["claims"],
                observations=observations,
                artifacts=artifacts,
                recipient_type=req.recipient_type,
                redacted_terms=req.redacted_terms,
                include_unverified=req.include_unverified
            )
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

        # Privacy verification against seeded sensitive identifiers, extracted text, and metadata
        leakage = verify_pdf_privacy_leakage(pdf_bytes, req.redacted_terms)
        if not leakage["passed"]:
            raise HTTPException(
                status_code=400,
                detail=f"Privacy check failed! Planted sensitive terms detected in compiled document: {leakage['leaked_terms']}"
            )

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=ProofPath_Disclosure_{req.case_id}_{req.recipient_type.lower()}.pdf"}
        )
    finally:
        conn.close()
