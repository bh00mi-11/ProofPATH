"""Demo authentication with scrypt password hashes and server-side opaque sessions."""
import hashlib
import hmac
import os
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException
from .db import get_connection

def password_hash(password: str) -> str:
    salt = os.urandom(16)
    key = hashlib.scrypt(password.encode(), salt=salt, n=16384, r=8, p=1)
    return salt.hex() + ":" + key.hex()

def check_password(password: str, stored: str) -> bool:
    try:
        salt, digest = stored.split(":")
        candidate = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=16384, r=8, p=1)
        return hmac.compare_digest(candidate, bytes.fromhex(digest))
    except (ValueError, TypeError):
        return False

def register(email: str, password: str):
    email = email.strip().lower()
    if len(password) < 12 or len(email) > 254 or "@" not in email:
        raise HTTPException(400, "Valid email and a password of at least 12 characters required")
    with get_connection() as conn:
        try:
            uid = "usr_" + uuid.uuid4().hex
            conn.execute("INSERT INTO users(id,email,password_hash,role) VALUES(?,?,?,'user')",
                         (uid, email, password_hash(password)))
        except Exception as exc:
            if "UNIQUE" in str(exc):
                raise HTTPException(409, "Email already registered")
            raise
    return {"id": uid, "email": email, "role": "user"}

def login(email: str, password: str):
    with get_connection() as conn:
        user = conn.execute("SELECT * FROM users WHERE email=?", (email.strip().lower(),)).fetchone()
        if not user or not check_password(password, user["password_hash"]):
            raise HTTPException(401, "Invalid credentials")
        token = secrets.token_urlsafe(32)
        expiry = (datetime.now(timezone.utc) + timedelta(hours=8)).isoformat()
        conn.execute("INSERT INTO sessions VALUES(?,?,?)", (hashlib.sha256(token.encode()).hexdigest(), user["id"], expiry))
    return {"access_token": token, "token_type": "bearer", "user": {"id": user["id"], "email": user["email"], "role": user["role"]}}

def authenticate(token: str):
    with get_connection() as conn:
        user = conn.execute("""SELECT u.id,u.email,u.role FROM sessions s JOIN users u ON u.id=s.user_id
                              WHERE s.token_hash=? AND s.expires_at>?""",
                            (hashlib.sha256(token.encode()).hexdigest(), datetime.now(timezone.utc).isoformat())).fetchone()
        return dict(user) if user else None

def logout(token: str):
    with get_connection() as conn:
        conn.execute("DELETE FROM sessions WHERE token_hash=?", (hashlib.sha256(token.encode()).hexdigest(),))

def owns_case(user_id: str, case_id: str) -> bool:
    with get_connection() as conn:
        return conn.execute("SELECT 1 FROM case_owners WHERE case_id=? AND user_id=?", (case_id,user_id)).fetchone() is not None
