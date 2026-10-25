"""Local-only admin role provisioning. Run from backend/ after user registration.

Usage: python -m app.provision_admin user@example.com
Requires PROOFPATH_ADMIN_PROVISION=1 in the local process environment.
Never expose as a public HTTP endpoint.
"""
import os
import sys
from .db import get_connection

def main():
    if os.getenv("PROOFPATH_ADMIN_PROVISION") != "1":
        raise SystemExit("Set PROOFPATH_ADMIN_PROVISION=1 for explicit local provisioning")
    if len(sys.argv) != 2 or "@" not in sys.argv[1]:
        raise SystemExit("Usage: python -m app.provision_admin user@example.com")
    email = sys.argv[1].strip().lower()
    with get_connection() as conn:
        row = conn.execute("SELECT id FROM users WHERE email=?", (email,)).fetchone()
        if not row:
            raise SystemExit("User not found; register user first")
        with conn:
            conn.execute("UPDATE users SET role='admin' WHERE id=?", (row["id"],))
            conn.execute("INSERT INTO auth_audit(actor_id,action) VALUES(?,?)",
                         (row["id"], "local_admin_provision"))
    print("Admin role assigned locally to existing user:", email)

if __name__ == "__main__":
    main()
