"""
FastAPI Server for ProofPath: The Evidence Time Machine Backend.
Coordinates Evidence Vault, Deterministic Trace Engine, Stress Test, and PDF Compiler.
"""
from fastapi import FastAPI, UploadFile, File, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from pathlib import Path
import sqlite3

from .db import init_db, get_connection, VAULT_DIR, DB_PATH
from .vault import EvidenceVault
from .trace_engine import recompute_claim_states
from .stress_test import run_stress_test
from .compiler import compile_disclosure_pdf, verify_pdf_privacy_leakage
from .fixture import seed_demo_fixture

app = FastAPI(title="ProofPath Evidence Time Machine API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

vault = EvidenceVault(VAULT_DIR)
init_db(DB_PATH)

# Models
class WhatIfOverride(BaseModel):
    target_id: str
    enabled: bool = True
    replacement_value: Optional[str] = None
    disputed: bool = False
    reason: Optional[str] = None

class ScenarioSimulationRequest(BaseModel):
    case_id: str
    scenario_name: Optional[str] = "Simulation Scenario"
    overrides: List[WhatIfOverride] = []

class PDFExportRequest(BaseModel):
    case_id: str
    redacted_terms: List[str] = []
    include_unverified: bool = True
    scenario_id: Optional[str] = None

@app.on_event("startup")
def startup_event():
    conn = get_connection()
    # Check if case exists; if not, seed fixture
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM cases")
    if cur.fetchone()[0] == 0:
        seed_demo_fixture(conn, vault)
    conn.close()

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "ProofPath Backend"}

@app.post("/api/seed")
def reset_and_seed():
    conn = get_connection()
    case_id = seed_demo_fixture(conn, vault)
    conn.close()
    return {"status": "success", "case_id": case_id, "message": "Demo fixture re-seeded"}

@app.get("/api/cases/{case_id}")
def get_case(case_id: str):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM cases WHERE id = ?", (case_id,))
    case_row = cur.fetchone()
    if not case_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Case not found")

    cur.execute("SELECT * FROM artifacts WHERE case_id = ?", (case_id,))
    artifacts = [dict(r) for r in cur.fetchall()]

    cur.execute("SELECT * FROM observations WHERE case_id = ?", (case_id,))
    observations = [dict(r) for r in cur.fetchall()]

    cur.execute("SELECT * FROM claims WHERE case_id = ?", (case_id,))
    claims = [dict(r) for r in cur.fetchall()]

    cur.execute("SELECT * FROM claim_evidence")
    links = [dict(r) for r in cur.fetchall()]

    # Run baseline trace
    trace_res = recompute_claim_states(claims, links, observations, artifacts)

    conn.close()
    return {
        "case": dict(case_row),
        "artifacts": artifacts,
        "observations": observations,
        "claims": trace_res["claims"],
        "links": links
    }

@app.post("/api/artifacts/upload")
async def upload_artifact(case_id: str, file: UploadFile = File(...)):
    content = await file.read()
    stored = vault.store_file(file.filename, content)
    
    conn = get_connection()
    with conn:
        conn.execute(
            """
            INSERT INTO artifacts (id, case_id, filename, file_type, vault_path, sha256, file_size)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (stored["artifact_id"], case_id, stored["filename"], stored["file_type"],
             stored["vault_path"], stored["sha256"], stored["file_size"])
        )
    conn.close()
    return {"status": "success", "artifact": stored}

@app.post("/api/scenarios/simulate")
def simulate_scenario(req: ScenarioSimulationRequest):
    conn = get_connection()
    cur = conn.cursor()
    
    cur.execute("SELECT * FROM artifacts WHERE case_id = ?", (req.case_id,))
    artifacts = [dict(r) for r in cur.fetchall()]

    cur.execute("SELECT * FROM observations WHERE case_id = ?", (req.case_id,))
    observations = [dict(r) for r in cur.fetchall()]

    cur.execute("SELECT * FROM claims WHERE case_id = ?", (req.case_id,))
    claims = [dict(r) for r in cur.fetchall()]

    cur.execute("SELECT * FROM claim_evidence")
    links = [dict(r) for r in cur.fetchall()]

    overrides_list = [o.dict() for o in req.overrides]
    result = recompute_claim_states(claims, links, observations, artifacts, overrides_list)
    conn.close()

    return {
        "status": "success",
        "scenario_name": req.scenario_name,
        "claims": result["claims"],
        "overrides_applied": len(overrides_list)
    }

@app.get("/api/cases/{case_id}/stress-test")
def stress_test(case_id: str):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM cases WHERE id = ?", (case_id,))
    cases = [dict(r) for r in cur.fetchall()]

    cur.execute("SELECT * FROM artifacts WHERE case_id = ?", (case_id,))
    artifacts = [dict(r) for r in cur.fetchall()]

    cur.execute("SELECT * FROM observations WHERE case_id = ?", (case_id,))
    observations = [dict(r) for r in cur.fetchall()]

    cur.execute("SELECT * FROM claims WHERE case_id = ?", (case_id,))
    claims = [dict(r) for r in cur.fetchall()]

    cur.execute("SELECT * FROM claim_evidence")
    links = [dict(r) for r in cur.fetchall()]

    res = run_stress_test(cases, artifacts, observations, claims, links, vault)
    conn.close()
    return res

@app.post("/api/export/pdf")
def export_pdf(req: PDFExportRequest):
    conn = get_connection()
    cur = conn.cursor()
    
    cur.execute("SELECT title FROM cases WHERE id = ?", (req.case_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Case not found")
    case_title = row["title"]

    cur.execute("SELECT * FROM artifacts WHERE case_id = ?", (req.case_id,))
    artifacts = [dict(r) for r in cur.fetchall()]

    cur.execute("SELECT * FROM observations WHERE case_id = ?", (req.case_id,))
    observations = [dict(r) for r in cur.fetchall()]

    cur.execute("SELECT * FROM claims WHERE case_id = ?", (req.case_id,))
    claims = [dict(r) for r in cur.fetchall()]

    cur.execute("SELECT * FROM claim_evidence")
    links = [dict(r) for r in cur.fetchall()]

    trace_res = recompute_claim_states(claims, links, observations, artifacts)
    pdf_bytes = compile_disclosure_pdf(
        case_title=case_title,
        claims=trace_res["claims"],
        redacted_terms=req.redacted_terms,
        include_unverified=req.include_unverified
    )

    # Privacy leakage check
    leakage = verify_pdf_privacy_leakage(pdf_bytes, req.redacted_terms)
    if not leakage["passed"]:
        conn.close()
        raise HTTPException(
            status_code=400,
            detail=f"Privacy check failed! Planted sensitive terms detected in compiled document: {leakage['leaked_terms']}"
        )

    conn.close()
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=ProofPath_Disclosure_{req.case_id}.pdf"}
    )
