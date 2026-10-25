"""
FastAPI Server for ProofPath: The Evidence Time Machine Backend.
Coordinates Evidence Vault, Deterministic Trace Engine, Stress Test, and PDF Compiler.
"""
from fastapi import FastAPI, UploadFile, File, HTTPException, Response, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from pathlib import Path
from contextlib import asynccontextmanager
import os
import sqlite3
from fastapi.responses import JSONResponse
from . import auth

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
from .navigator import get_navigator_data, toggle_checklist_item
from .accountability import (
    create_accountability_entry,
    record_status_transition,
    complete_follow_up_action,
    get_accountability_timeline
)
from .legal_mapper import evaluate_legal_context
from .remedies import evaluate_remedies_for_case
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
    if ENV_MODE in {"development", "synthetic_demo"}:
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

# Secure CORS configuration: allow all origins in development or when testing via mobile LAN
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if ENV_MODE == "development" else (ALLOWED_ORIGINS if ALLOWED_ORIGINS else ["http://localhost:3000"]),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "Content-Length", "Content-Type"],
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
    initial_claim: Optional[str] = None

class ClaimCreateRequest(BaseModel):
    case_id: str
    claim_text: str
    incident_time: Optional[str] = None
    category: Optional[str] = "Incident Observation"

class ObservationCreateRequest(BaseModel):
    case_id: str
    artifact_id: Optional[str] = None
    field: str
    value: str
    source_type: str = "manual_observation"

class ClaimLinkCreateRequest(BaseModel):
    case_id: str
    claim_id: str
    observation_id: str
    relation: str = "SUPPORTS"  # SUPPORTS | CONTRADICTS | CONTEXT

class ClaimLinkDeleteRequest(BaseModel):
    case_id: str
    claim_id: str
    observation_id: str

class ScenarioSimulationRequest(BaseModel):
    case_id: str
    scenario_name: Optional[str] = "Simulation Scenario"
    overrides: List[WhatIfOverride] = Field(default_factory=list)

class DisclosurePreviewRequest(BaseModel):
    case_id: str
    recipient_type: str = "LEGAL_PROFESSIONAL"
    redacted_terms: List[str] = Field(default_factory=list)
    include_unverified: bool = True
    include_accountability: bool = False  # Excluded by default

class PDFExportRequest(BaseModel):
    case_id: str
    recipient_type: str = "LEGAL_PROFESSIONAL"
    redacted_terms: List[str] = Field(default_factory=list)
    include_unverified: bool = True
    include_accountability: bool = False  # Excluded by default
    scenario_id: Optional[str] = None
    confirmed_config: bool = False  # Requirement 8: Explicit confirmation before generation

# Guardian Mode Models (Feature 13 MVP)
class ContactCreateRequest(BaseModel):
    name: str
    phone: str
    relationship: Optional[str] = "Trusted Contact"

class ContactUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    relationship: Optional[str] = None

class SessionStartRequest(BaseModel):
    case_id: Optional[str] = "case_demo_01"
    incident_note: Optional[str] = None
    selected_contact_ids: List[str] = Field(default_factory=list)

class SessionEndRequest(BaseModel):
    import_as_evidence: bool = True

class SOSTriggerRequest(BaseModel):
    session_id: str
    contact_ids: Optional[List[str]] = None
    share_channel: str = "MANUAL_SHARE"

def get_validated_case(conn: sqlite3.Connection, case_id: str) -> Dict[str, Any]:
    """Helper to validate case existence before proceeding with operations."""
    cur = conn.cursor()
    cur.execute("SELECT * FROM cases WHERE id = ?", (case_id,))
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found")
    return dict(row)

class Credentials(BaseModel):
    email: str
    password: str

@app.post("/api/auth/register")
def register_user(req: Credentials):
    return auth.register(req.email, req.password)

@app.post("/api/auth/login")
def login_user(req: Credentials):
    return auth.login(req.email, req.password)

@app.get("/api/auth/me")
def who_am_i(request: Request):
    return request.state.user

@app.post("/api/auth/logout")
def logout_user(request: Request):
    auth.logout(request.state.token)
    return {"status": "ok"}

@app.middleware("http")
async def enforce_case_ownership(request: Request, call_next):
    path = request.url.path
    if request.method == "OPTIONS" or path in {"/api/health", "/api/auth/register", "/api/auth/login"} or not path.startswith("/api/"):
        return await call_next(request)
    authorization = request.headers.get("authorization", "")
    token = authorization[7:] if authorization.lower().startswith("bearer ") else ""
    user = auth.authenticate(token) if token else None
    if not user:
        return JSONResponse({"detail": "Login required"}, status_code=401)
    request.state.user = user
    request.state.token = token
    if path.startswith("/api/guardian/"):
        return JSONResponse({"detail": "Guardian contacts and sessions are disabled pending per-user isolation"}, status_code=403)
    if path == "/api/seed":
        return JSONResponse({"detail": "Seed endpoint disabled for authenticated deployments"}, status_code=403)
    if path == "/api/cases" and request.method == "GET":
        response = await call_next(request)
        return response
    case_id = request.query_params.get("case_id")
    segments = path.split("/")
    if len(segments) > 3 and segments[2] == "cases":
        case_id = segments[3]
    if path.startswith("/api/artifacts/") and path != "/api/artifacts/upload":
        artifact_id = segments[3] if len(segments) > 3 else ""
        with get_connection() as conn:
            row = conn.execute("SELECT case_id FROM artifacts WHERE id=?", (artifact_id,)).fetchone()
        if not row:
            return JSONResponse({"detail": "Not found"}, status_code=404)
        case_id = row["case_id"]
    if path.startswith("/api/claim-links") and not case_id:
        return JSONResponse({"detail": "Case identifier required"}, status_code=403)
    if path.startswith("/api/") and request.method in {"POST", "PUT", "DELETE"} and path not in {"/api/cases", "/api/auth/logout"} and not case_id:
        # Fail closed until every body-based endpoint is explicitly scoped.
        return JSONResponse({"detail": "Endpoint requires ownership enforcement before use"}, status_code=403)
    if case_id and not auth.owns_case(user["id"], case_id):
        return JSONResponse({"detail": "Case not found"}, status_code=404)
    return await call_next(request)

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
def list_cases(request: Request):
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT c.* FROM cases c JOIN case_owners o ON o.case_id=c.id WHERE o.user_id=? ORDER BY c.created_at DESC", (request.state.user["id"],))
        cases = [dict(r) for r in cur.fetchall()]
        return {"cases": cases}
    finally:
        conn.close()

@app.post("/api/cases")
def create_case(req: CaseCreateRequest, request: Request):
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
            if req.initial_claim and req.initial_claim.strip():
                claim_id = f"clm_{uuid.uuid4().hex[:8]}"
                conn.execute(
                    """
                    INSERT INTO claims (id, case_id, claim_text, incident_time, category)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (
                        claim_id,
                        case_id,
                        req.initial_claim.strip(),
                        None,
                        "Initial Claim"
                    )
                )
        with get_connection() as owner_conn:
            owner_conn.execute("INSERT INTO case_owners(case_id,user_id) VALUES(?,?)", (case_id, request.state.user["id"]))
        return {"status": "success", "case": {"id": case_id, "title": req.title.strip(), "description": (req.description or "").strip()}}
    finally:
        conn.close()

@app.post("/api/claims")
def create_claim(req: ClaimCreateRequest):
    if not req.claim_text.strip():
        raise HTTPException(status_code=400, detail="Claim text cannot be empty")
    conn = get_connection()
    try:
        get_validated_case(conn, req.case_id)
        import uuid
        claim_id = f"clm_{uuid.uuid4().hex[:8]}"
        with conn:
            conn.execute(
                """
                INSERT INTO claims (id, case_id, claim_text, incident_time, category)
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    claim_id,
                    req.case_id,
                    req.claim_text.strip(),
                    req.incident_time,
                    req.category or "Incident Observation"
                )
            )
        return {
            "status": "success",
            "claim": {
                "id": claim_id,
                "case_id": req.case_id,
                "claim_text": req.claim_text.strip(),
                "incident_time": req.incident_time,
                "category": req.category,
                "status": "UNVERIFIED"
            }
        }
    finally:
        conn.close()

@app.post("/api/observations")
def create_observation(req: ObservationCreateRequest):
    if not req.value.strip() or not req.field.strip():
        raise HTTPException(status_code=400, detail="Field and value cannot be empty")
    conn = get_connection()
    try:
        get_validated_case(conn, req.case_id)
        if req.artifact_id:
            cur = conn.cursor()
            cur.execute("SELECT id, case_id FROM artifacts WHERE id = ?", (req.artifact_id,))
            art_row = cur.fetchone()
            if not art_row:
                raise HTTPException(status_code=404, detail=f"Artifact '{req.artifact_id}' not found")
            if art_row["case_id"] != req.case_id:
                raise HTTPException(status_code=400, detail="Artifact belongs to another case record (cross-case linking prohibited)")

        import uuid
        obs_id = f"obs_{uuid.uuid4().hex[:8]}"
        with conn:
            conn.execute(
                """
                INSERT INTO observations (id, case_id, artifact_id, field, value, source_type, status)
                VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')
                """,
                (
                    obs_id,
                    req.case_id,
                    req.artifact_id,
                    req.field.strip(),
                    req.value.strip(),
                    req.source_type
                )
            )
        return {
            "status": "success",
            "observation": {
                "id": obs_id,
                "case_id": req.case_id,
                "artifact_id": req.artifact_id,
                "field": req.field.strip(),
                "value": req.value.strip(),
                "source_type": req.source_type,
                "status": "ACTIVE"
            }
        }
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
    res_artifact["id"] = res_artifact["artifact_id"]

    return {"status": "success", "artifact": res_artifact}

@app.get("/api/artifacts/{artifact_id}/content")
def get_artifact_content(artifact_id: str, case_id: Optional[str] = Query(None)):
    """Retrieve raw readable content for supported file types (e.g. .txt, .csv) and metadata."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM artifacts WHERE id = ?", (artifact_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail=f"Artifact '{artifact_id}' not found")
        
        art = dict(row)
        if case_id and art["case_id"] != case_id:
            raise HTTPException(status_code=403, detail="Cross-case artifact access denied")
        
        vault_path = Path(art["vault_path"])
        if not vault_path.exists():
            raise HTTPException(status_code=404, detail="Artifact file missing from vault storage")
        
        file_ext = Path(art["filename"]).suffix.lower()
        if file_ext in [".txt", ".csv"]:
            try:
                with open(vault_path, "r", encoding="utf-8", errors="replace") as f:
                    content_str = f.read()
                return {
                    "status": "success",
                    "artifact_id": artifact_id,
                    "filename": art["filename"],
                    "file_type": art["file_type"],
                    "is_text": True,
                    "content": content_str,
                    "sha256": art["sha256"],
                    "file_size": art["file_size"]
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to read artifact content: {str(e)}")
        else:
            return {
                "status": "success",
                "artifact_id": artifact_id,
                "filename": art["filename"],
                "file_type": art["file_type"],
                "is_text": False,
                "content": None,
                "message": f"Direct text inspection is not supported for {file_ext} files. Binary stored securely in vault.",
                "sha256": art["sha256"],
                "file_size": art["file_size"]
            }
    finally:
        conn.close()

@app.get("/api/artifacts/{artifact_id}/propose-observations")
def propose_observations_from_artifact(artifact_id: str, case_id: Optional[str] = Query(None)):
    """
    Deterministic rule-based parser for text artifacts.
    Extracts structured key-value observations (Date, Time, Sender, Message, Platform)
    without AI hallucinations or claiming external validity.
    Returns proposed observations for user review.
    """
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM artifacts WHERE id = ?", (artifact_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail=f"Artifact '{artifact_id}' not found")
        
        art = dict(row)
        if case_id and art["case_id"] != case_id:
            raise HTTPException(status_code=403, detail="Cross-case artifact access denied")
        
        vault_path = Path(art["vault_path"])
        file_ext = Path(art["filename"]).suffix.lower()
        if file_ext not in [".txt", ".csv"]:
            return {
                "status": "unsupported",
                "artifact_id": artifact_id,
                "proposed": [],
                "message": f"Deterministic fact extraction only supported for text files (.txt, .csv). Please enter observations manually."
            }
        
        with open(vault_path, "r", encoding="utf-8", errors="replace") as f:
            lines = f.readlines()
        
        proposed = []
        raw_text = "".join(lines).strip()
        date_val = None
        time_val = None

        import re
        for line in lines:
            line_str = line.strip()
            if not line_str or line_str.startswith("SYNTHETIC DEMO EVIDENCE"):
                continue
            
            # Key-value pattern: "Key: Value"
            if ":" in line_str:
                parts = line_str.split(":", 1)
                k = parts[0].strip().lower()
                v = parts[1].strip()
                if not v:
                    continue
                if k == "date":
                    date_val = v
                    proposed.append({
                        "field": "date",
                        "value": v,
                        "source_type": "text_extraction",
                        "excerpt": line_str,
                        "suggested_relation": "SUPPORTS"
                    })
                elif k == "time":
                    time_val = v
                    proposed.append({
                        "field": "time",
                        "value": v,
                        "source_type": "text_extraction",
                        "excerpt": line_str,
                        "suggested_relation": "SUPPORTS"
                    })
                elif k in ["sender", "from", "author"]:
                    proposed.append({
                        "field": "sender",
                        "value": v,
                        "source_type": "text_extraction",
                        "excerpt": line_str,
                        "suggested_relation": "SUPPORTS"
                    })
                elif k in ["message", "content", "body"]:
                    proposed.append({
                        "field": "message_content",
                        "value": v,
                        "source_type": "text_extraction",
                        "excerpt": line_str,
                        "suggested_relation": "SUPPORTS"
                    })
                elif k in ["platform", "channel", "app"]:
                    proposed.append({
                        "field": "platform",
                        "value": v,
                        "source_type": "text_extraction",
                        "excerpt": line_str,
                        "suggested_relation": "SUPPORTS"
                    })

        # Synthesize combined timestamp if both date and time found
        if date_val and time_val:
            combined_ts = f"{date_val} {time_val}"
            proposed.insert(0, {
                "field": "timestamp",
                "value": combined_ts,
                "source_type": "text_extraction",
                "excerpt": f"Date: {date_val} | Time: {time_val}",
                "suggested_relation": "SUPPORTS"
            })
        elif date_val:
            proposed.insert(0, {
                "field": "timestamp",
                "value": date_val,
                "source_type": "text_extraction",
                "excerpt": f"Date: {date_val}",
                "suggested_relation": "SUPPORTS"
            })

        # If no key-value matched, offer general statement excerpt
        if not proposed and raw_text:
            first_line = raw_text.splitlines()[0][:100]
            proposed.append({
                "field": "statement_excerpt",
                "value": first_line,
                "source_type": "text_extraction",
                "excerpt": first_line,
                "suggested_relation": "SUPPORTS"
            })

        return {
            "status": "success",
            "artifact_id": artifact_id,
            "filename": art["filename"],
            "proposed": proposed,
            "message": f"Identified {len(proposed)} deterministic observation candidate(s) from {art['filename']}."
        }
    finally:
        conn.close()

@app.post("/api/claim-links")
def create_claim_link(req: ClaimLinkCreateRequest):
    """
    Links an observation to a claim with a relationship (SUPPORTS | CONTRADICTS | CONTEXT).
    Strictly prevents cross-case linking.
    """
    rel = req.relation.upper()
    if rel not in ["SUPPORTS", "CONTRADICTS", "CONTEXT"]:
        raise HTTPException(status_code=400, detail="Relation must be SUPPORTS, CONTRADICTS, or CONTEXT")
    
    conn = get_connection()
    try:
        get_validated_case(conn, req.case_id)
        cur = conn.cursor()
        
        # Verify claim belongs to this case
        cur.execute("SELECT id, case_id FROM claims WHERE id = ?", (req.claim_id,))
        claim_row = cur.fetchone()
        if not claim_row:
            raise HTTPException(status_code=404, detail=f"Claim '{req.claim_id}' not found")
        if claim_row["case_id"] != req.case_id:
            raise HTTPException(status_code=400, detail="Claim belongs to another case record (cross-case linking prohibited)")
        
        # Verify observation belongs to this case
        cur.execute("SELECT id, case_id FROM observations WHERE id = ?", (req.observation_id,))
        obs_row = cur.fetchone()
        if not obs_row:
            raise HTTPException(status_code=404, detail=f"Observation '{req.observation_id}' not found")
        if obs_row["case_id"] != req.case_id:
            raise HTTPException(status_code=400, detail="Observation belongs to another case record (cross-case linking prohibited)")
        
        import uuid
        link_id = f"link_{uuid.uuid4().hex[:8]}"
        with conn:
            conn.execute(
                """
                INSERT INTO claim_evidence (id, claim_id, observation_id, relation)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(claim_id, observation_id) DO UPDATE SET relation = excluded.relation
                """,
                (link_id, req.claim_id, req.observation_id, rel)
            )
        
        return {
            "status": "success",
            "link": {
                "id": link_id,
                "claim_id": req.claim_id,
                "observation_id": req.observation_id,
                "relation": rel
            }
        }
    finally:
        conn.close()

@app.delete("/api/claim-links")
def delete_claim_link(req: ClaimLinkDeleteRequest):
    """Removes a link between an observation and a claim."""
    conn = get_connection()
    try:
        get_validated_case(conn, req.case_id)
        with conn:
            conn.execute(
                "DELETE FROM claim_evidence WHERE claim_id = ? AND observation_id = ?",
                (req.claim_id, req.observation_id)
            )
        return {"status": "success", "message": "Link deleted"}
    finally:
        conn.close()

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

        acc_entries = []
        if req.include_accountability:
            acc_data = get_accountability_timeline(conn, req.case_id)
            acc_entries = acc_data.get("timeline", [])
        
        try:
            preview = generate_disclosure_preview(
                recipient_type=req.recipient_type,
                case_title=case_row["title"],
                claims=trace_res["claims"],
                observations=observations,
                artifacts=artifacts,
                redacted_terms=req.redacted_terms,
                include_accountability=req.include_accountability,
                accountability_entries=acc_entries
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

        acc_entries = []
        if req.include_accountability:
            acc_data = get_accountability_timeline(conn, req.case_id)
            acc_entries = acc_data.get("timeline", [])
        
        try:
            pdf_bytes = compile_disclosure_pdf(
                case_title=case_title,
                claims=trace_res["claims"],
                observations=observations,
                artifacts=artifacts,
                recipient_type=req.recipient_type,
                redacted_terms=req.redacted_terms,
                include_unverified=req.include_unverified,
                include_accountability=req.include_accountability,
                accountability_entries=acc_entries
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

# -------------------------------------------------------------
# Guardian Mode Endpoints (Feature 13 MVP)
# -------------------------------------------------------------

@app.get("/api/guardian/contacts")
def list_guardian_contacts():
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM guardian_contacts ORDER BY created_at ASC")
        contacts = [dict(r) for r in cur.fetchall()]
        return {"status": "success", "contacts": contacts}
    finally:
        conn.close()

@app.post("/api/guardian/contacts")
def create_guardian_contact(req: ContactCreateRequest):
    if not req.name.strip() or not req.phone.strip():
        raise HTTPException(status_code=400, detail="Name and phone are required")
    import uuid
    contact_id = f"cnt_{uuid.uuid4().hex[:8]}"
    conn = get_connection()
    try:
        with conn:
            conn.execute(
                "INSERT INTO guardian_contacts (id, name, phone, relationship) VALUES (?, ?, ?, ?)",
                (contact_id, req.name.strip(), req.phone.strip(), (req.relationship or "Trusted Contact").strip())
            )
        return {
            "status": "success",
            "contact": {
                "id": contact_id,
                "name": req.name.strip(),
                "phone": req.phone.strip(),
                "relationship": (req.relationship or "Trusted Contact").strip()
            }
        }
    finally:
        conn.close()

@app.put("/api/guardian/contacts/{contact_id}")
def update_guardian_contact(contact_id: str, req: ContactUpdateRequest):
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM guardian_contacts WHERE id = ?", (contact_id,))
        contact = cur.fetchone()
        if not contact:
            raise HTTPException(status_code=404, detail="Contact not found")

        name = req.name.strip() if req.name is not None else contact["name"]
        phone = req.phone.strip() if req.phone is not None else contact["phone"]
        rel = req.relationship.strip() if req.relationship is not None else contact["relationship"]

        with conn:
            conn.execute(
                "UPDATE guardian_contacts SET name = ?, phone = ?, relationship = ? WHERE id = ?",
                (name, phone, rel, contact_id)
            )
        return {"status": "success", "contact": {"id": contact_id, "name": name, "phone": phone, "relationship": rel}}
    finally:
        conn.close()

@app.delete("/api/guardian/contacts/{contact_id}")
def delete_guardian_contact(contact_id: str):
    conn = get_connection()
    try:
        with conn:
            cur = conn.cursor()
            cur.execute("DELETE FROM guardian_contacts WHERE id = ?", (contact_id,))
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Contact not found")
        return {"status": "success", "message": f"Contact '{contact_id}' removed"}
    finally:
        conn.close()

@app.post("/api/guardian/sessions/start")
def start_guardian_session(req: SessionStartRequest):
    import uuid, json
    session_id = f"sess_{uuid.uuid4().hex[:8]}"
    conn = get_connection()
    try:
        # Check active session
        cur = conn.cursor()
        cur.execute("SELECT * FROM guardian_sessions WHERE status = 'ACTIVE'")
        existing = cur.fetchone()
        if existing:
            return {
                "status": "existing_active",
                "message": "An active Guardian safety session is already in progress.",
                "session": dict(existing)
            }

        contacts_json = json.dumps(req.selected_contact_ids)
        with conn:
            conn.execute(
                "INSERT INTO guardian_sessions (id, case_id, status, incident_note, selected_contacts) VALUES (?, ?, 'ACTIVE', ?, ?)",
                (session_id, req.case_id, (req.incident_note or "").strip(), contacts_json)
            )
        return {
            "status": "success",
            "session": {
                "id": session_id,
                "case_id": req.case_id,
                "status": "ACTIVE",
                "incident_note": req.incident_note,
                "selected_contacts": req.selected_contact_ids,
                "message": "Safety session started. Manual sharing ready."
            }
        }
    finally:
        conn.close()

@app.get("/api/guardian/sessions/active")
def get_active_guardian_session():
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM guardian_sessions WHERE status = 'ACTIVE' ORDER BY started_at DESC LIMIT 1")
        session = cur.fetchone()
        if not session:
            return {"status": "none", "session": None}
        session_dict = dict(session)
        import json
        try:
            session_dict["selected_contacts"] = json.loads(session_dict.get("selected_contacts", "[]"))
        except:
            session_dict["selected_contacts"] = []
        
        cur.execute("SELECT * FROM guardian_alerts WHERE session_id = ? ORDER BY triggered_at ASC", (session_dict["id"],))
        session_dict["alerts"] = [dict(r) for r in cur.fetchall()]
        return {"status": "active", "session": session_dict}
    finally:
        conn.close()

@app.post("/api/guardian/sessions/{session_id}/sos")
def trigger_guardian_sos(session_id: str, req: SOSTriggerRequest):
    import uuid, json
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM guardian_sessions WHERE id = ? AND status = 'ACTIVE'", (session_id,))
        session = cur.fetchone()
        if not session:
            raise HTTPException(status_code=404, detail="Active session not found")

        # Determine target contacts
        target_ids = req.contact_ids
        if not target_ids:
            try:
                target_ids = json.loads(session["selected_contacts"] or "[]")
            except:
                target_ids = []

        if target_ids:
            placeholders = ",".join("?" for _ in target_ids)
            cur.execute(f"SELECT * FROM guardian_contacts WHERE id IN ({placeholders})", target_ids)
            contacts = [dict(r) for r in cur.fetchall()]
        else:
            cur.execute("SELECT * FROM guardian_contacts")
            contacts = [dict(r) for r in cur.fetchall()]

        alert_records = []
        msg_template = "EMERGENCY ALERT: ProofPath safety session triggered. I am requesting assistance. Please check on me."
        if session["incident_note"]:
            msg_template += f" Note: {session['incident_note']}"

        with conn:
            for c in contacts:
                alert_id = f"alt_{uuid.uuid4().hex[:8]}"
                # Delivery status is ATTRIBUTE-HONEST: Not claimed as confirmed without network receipt
                status = "ATTEMPTED"
                explanation = "Alert prepared for manual sharing via system SMS/Messaging. Delivery confirmation depends on carrier."
                conn.execute(
                    """
                    INSERT INTO guardian_alerts (id, session_id, contact_id, contact_name, channel, delivery_status, message_content, status_explanation)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (alert_id, session_id, c["id"], c["name"], req.share_channel, status, msg_template, explanation)
                )
                alert_records.append({
                    "id": alert_id,
                    "contact_id": c["id"],
                    "contact_name": c["name"],
                    "phone": c["phone"],
                    "channel": req.share_channel,
                    "delivery_status": status,
                    "explanation": explanation,
                    "message_content": msg_template
                })

        return {
            "status": "success",
            "session_id": session_id,
            "emergency_shortcut": "112 (National Emergency Helpline)",
            "alerts": alert_records,
            "disclaimer": "Notice: Alert recorded for manual dispatch. Real automated delivery requires an authenticated SMS gateway."
        }
    finally:
        conn.close()

@app.post("/api/guardian/sessions/{session_id}/end")
def end_guardian_session(session_id: str, req: SessionEndRequest):
    import uuid
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM guardian_sessions WHERE id = ?", (session_id,))
        session = cur.fetchone()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        with conn:
            conn.execute("UPDATE guardian_sessions SET status = 'ENDED', ended_at = CURRENT_TIMESTAMP WHERE id = ?", (session_id,))

        imported_artifact = None
        # Feature 13.D: Import Safety Session -> Evidence Vault as a structured event record
        if req.import_as_evidence and session["case_id"]:
            case_id = session["case_id"]
            cur.execute("SELECT * FROM guardian_alerts WHERE session_id = ?", (session_id,))
            alerts = [dict(r) for r in cur.fetchall()]

            session_summary = (
                f"ProofPath Guardian Safety Session Log\n"
                f"Session ID: {session_id}\n"
                f"Started: {session['started_at']}\n"
                f"Ended: {session['ended_at'] or 'Active'}\n"
                f"Incident Note: {session['incident_note'] or 'None'}\n"
                f"SOS Alerts Attempted: {len(alerts)}\n"
            )
            for a in alerts:
                session_summary += f"- Alert to {a['contact_name']}: Status {a['delivery_status']} via {a['channel']}\n"

            # Store in vault as event log artifact
            filename = f"guardian_session_{session_id}.txt"
            content_bytes = session_summary.encode('utf-8')
            stored = vault.store_file(filename, content_bytes)

            art_id = stored["artifact_id"]
            with conn:
                conn.execute(
                    """
                    INSERT INTO artifacts (id, case_id, filename, file_type, vault_path, sha256, file_size)
                    VALUES (?, ?, ?, 'session_log', ?, ?, ?)
                    """,
                    (art_id, case_id, filename, stored["vault_path"], stored["sha256"], stored["file_size"])
                )

                # Add timestamped observation
                obs_id = f"obs_{uuid.uuid4().hex[:8]}"
                conn.execute(
                    """
                    INSERT INTO observations (id, case_id, artifact_id, field, value, source_type, status)
                    VALUES (?, ?, ?, 'guardian_session_event', ?, 'safety_session', 'ACTIVE')
                    """,
                    (obs_id, case_id, art_id, f"Guardian Session {session_id} ended with {len(alerts)} alert attempts")
                )
            imported_artifact = {"artifact_id": art_id, "filename": filename, "sha256": stored["sha256"]}

        return {
            "status": "success",
            "session_id": session_id,
            "session_state": "ENDED",
            "imported_as_evidence": imported_artifact is not None,
            "artifact": imported_artifact
        }
    finally:
        conn.close()


# ============================================================================
# FEATURE 10: NEXT-STEP NAVIGATOR & ACTION CHECKLIST
# ============================================================================

class ChecklistToggleRequest(BaseModel):
    action_key: str = Field(..., description="Unique action key in the checklist")
    completed: bool = Field(..., description="Whether action is completed")
    title: Optional[str] = Field(None, description="Optional title of the action")


@app.get("/api/cases/{case_id}/navigator", tags=["Next-Step Navigator"])
def get_case_navigator(case_id: str):
    """
    Returns contextual next-step recommendations, safety guidance,
    verified Indian support/reporting resources, and action checklist state.
    """
    conn = get_connection()
    try:
        try:
            return get_navigator_data(conn, case_id)
        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e))
    finally:
        conn.close()


@app.post("/api/cases/{case_id}/checklist/toggle", tags=["Next-Step Navigator"])
def toggle_case_checklist_item(case_id: str, payload: ChecklistToggleRequest):
    """
    Persists checklist item toggle state in the database.
    """
    conn = get_connection()
    try:
        try:
            return toggle_checklist_item(
                conn,
                case_id=case_id,
                action_key=payload.action_key,
                completed=payload.completed,
                title=payload.title
            )
        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e))
    finally:
        conn.close()


# ============================================================================
# FEATURE 8: ACCOUNTABILITY TRAIL
# ============================================================================

class AccountabilityEntryCreateRequest(BaseModel):
    action_type: str = Field(..., description="Action type: REPORT_PREPARED, COMPLAINT_SUBMITTED, etc.")
    description: str = Field(..., description="Detailed description of the action taken")
    user_event_time: str = Field(..., description="User recorded date/time of the event (ISO or date string)")
    status: Optional[str] = Field("NOT_REPORTED", description="Case progress status (NOT_REPORTED, SUBMITTED, ACKNOWLEDGED, UNDER_REVIEW, RESOLVED, UNKNOWN)")
    organization: Optional[str] = Field(None, description="External organization or recipient")
    artifact_id: Optional[str] = Field(None, description="Optional supporting artifact ID belonging to this case")
    reference_number: Optional[str] = Field(None, description="Optional complaint / docket reference number")
    next_follow_up_date: Optional[str] = Field(None, description="Optional target date for next follow up (YYYY-MM-DD)")


class StatusTransitionRequest(BaseModel):
    new_status: str = Field(..., description="Target status: NOT_REPORTED, SUBMITTED, ACKNOWLEDGED, UNDER_REVIEW, RESOLVED, UNKNOWN")
    reason: str = Field(..., description="Reason / context for this recorded transition")
    user_event_time: str = Field(..., description="When the status transition occurred")
    organization: Optional[str] = None
    artifact_id: Optional[str] = None
    reference_number: Optional[str] = None
    next_follow_up_date: Optional[str] = None


class FollowUpCompleteRequest(BaseModel):
    completion_note: str = Field(..., description="Summary of action taken upon follow-up")
    completion_time: str = Field(..., description="When the follow-up was completed")


@app.get("/api/cases/{case_id}/accountability", tags=["Accountability Trail"])
def get_case_accountability_timeline(case_id: str):
    """
    Retrieves the complete append-only accountability trail for a case.
    Shows recorded statuses, provenance (USER_REPORTED vs DOCUMENT_SUPPORTED),
    linked evidence, and pending/overdue follow-ups.
    """
    conn = get_connection()
    try:
        try:
            return get_accountability_timeline(conn, case_id)
        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e))
    finally:
        conn.close()


@app.post("/api/cases/{case_id}/accountability/entries", tags=["Accountability Trail"])
def add_accountability_entry(case_id: str, payload: AccountabilityEntryCreateRequest):
    """
    Appends a new action or reporting entry to the accountability timeline.
    Validates case and strictly isolates artifacts to the same case.
    """
    conn = get_connection()
    try:
        try:
            entry = create_accountability_entry(
                conn=conn,
                case_id=case_id,
                action_type=payload.action_type,
                description=payload.description,
                user_event_time=payload.user_event_time,
                status=payload.status or "NOT_REPORTED",
                organization=payload.organization,
                artifact_id=payload.artifact_id,
                reference_number=payload.reference_number,
                next_follow_up_date=payload.next_follow_up_date
            )
            return {"status": "success", "entry": entry}
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()


@app.post("/api/cases/{case_id}/accountability/status", tags=["Accountability Trail"])
def record_case_status_transition(case_id: str, payload: StatusTransitionRequest):
    """
    Records an append-only case status transition. Never mutates or overwrites past statuses.
    """
    conn = get_connection()
    try:
        try:
            entry = record_status_transition(
                conn=conn,
                case_id=case_id,
                new_status=payload.new_status,
                reason=payload.reason,
                user_event_time=payload.user_event_time,
                organization=payload.organization,
                artifact_id=payload.artifact_id,
                reference_number=payload.reference_number,
                next_follow_up_date=payload.next_follow_up_date
            )
            return {"status": "success", "entry": entry}
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()


@app.post("/api/cases/{case_id}/accountability/entries/{entry_id}/complete-follow-up", tags=["Accountability Trail"])
def complete_entry_follow_up(case_id: str, entry_id: str, payload: FollowUpCompleteRequest):
    """
    Marks a follow-up as completed and appends a corresponding historical completion event.
    """
    conn = get_connection()
    try:
        try:
            res = complete_follow_up_action(
                conn=conn,
                case_id=case_id,
                entry_id=entry_id,
                completion_note=payload.completion_note,
                completion_time=payload.completion_time
            )
            return res
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()


# ============================================================================
# FEATURE 7: LEGAL CONTEXT MAPPER
# ============================================================================

@app.get("/api/cases/{case_id}/legal-context", tags=["Legal Context"])
def get_case_legal_context(case_id: str):
    """
    Evaluates applicable Indian legal frameworks (BNS 2023, IT Act 2000, POSH Act 2013)
    correlating with recorded claims and deterministic trace states.
    Does not provide legal advice or determine that an offense occurred.
    """
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

        trace_res = recompute_claim_states(claims, links, observations, artifacts)

        try:
            return evaluate_legal_context(
                conn=conn,
                case_id=case_id,
                claims=claims,
                trace_results=trace_res,
                observations=observations,
                artifacts=artifacts
            )
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()


# ============================================================================
# FEATURE 9: VICTIM JUSTICE & REMEDIES
# ============================================================================

@app.get("/api/cases/{case_id}/remedies", tags=["Victim Justice & Remedies"])
def get_case_remedies(case_id: str):
    """
    Evaluates curated Indian remedy pathways (NALSA Legal Aid, Victim Compensation,
    Cyber Crime Escalation, POSH IC, IT Rules 24hr Takedown, OSC Women Helplines).
    Includes deterministic eligibility states, known facts, and missing information.
    Does not promise financial compensation or guaranteed outcomes.
    """
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

        trace_res = recompute_claim_states(claims, links, observations, artifacts)

        try:
            return evaluate_remedies_for_case(
                conn=conn,
                case_id=case_id,
                claims=claims,
                trace_results=trace_res,
                observations=observations,
                artifacts=artifacts
            )
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()





