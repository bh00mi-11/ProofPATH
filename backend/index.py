"""Read-only synthetic demonstration entrypoint for Vercel.

Do not use for real evidence. Vercel scratch storage is ephemeral;
this deployment rejects personal-data writes.
"""
import os

os.environ["PROOFPATH_ENV"] = "synthetic_demo"
os.environ["PROOFPATH_DB_PATH"] = "/tmp/proofpath_synthetic_demo.sqlite3"
os.environ["PROOFPATH_VAULT_DIR"] = "/tmp/proofpath_synthetic_demo_vault"
os.environ.setdefault("PROOFPATH_CORS_ORIGINS", "https://proofpath-jet.vercel.app,https://proofpath-bhoomi-2fd6.vercel.app")

from fastapi import Request
from fastapi.responses import JSONResponse
from app.main import app

DEMO_ALLOWED_POSTS = {"/api/scenarios/simulate", "/api/disclosure/preview", "/api/export/pdf"}

@app.middleware("http")
async def enforce_synthetic_demo(request: Request, call_next):
    if request.url.path == "/api/health":
        return JSONResponse({
            "status": "ok",
            "service": "ProofPath Synthetic Demonstration",
            "mode": "read_only_synthetic_demo",
            "persistent_storage": False,
            "real_user_data_allowed": False,
        })
    if request.method not in {"GET", "HEAD", "OPTIONS"} and request.url.path not in DEMO_ALLOWED_POSTS:
        return JSONResponse(status_code=403, content={
            "detail": "Synthetic, read-only demo. Do not submit personal data or real evidence. Local or secured persistent backend is required for real records."
        })
    return await call_next(request)
