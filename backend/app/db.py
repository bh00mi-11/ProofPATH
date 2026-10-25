import sqlite3
import os
from pathlib import Path
from contextlib import contextmanager
from typing import Generator

DB_PATH = Path(os.getenv('PROOFPATH_DB_PATH', Path(__file__).resolve().parent.parent / 'data' / 'proofpath.db'))
VAULT_DIR = Path(os.getenv('PROOFPATH_VAULT_DIR', Path(__file__).resolve().parent.parent / 'data' / 'vault'))

def init_db(db_path: Path = DB_PATH) -> None:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    VAULT_DIR.mkdir(parents=True, exist_ok=True)
    
    conn = sqlite3.connect(str(db_path))
    conn.execute('PRAGMA foreign_keys = ON;')
    
    try:
        with conn:
            conn.executescript('''
            CREATE TABLE IF NOT EXISTS cases (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                description TEXT
            );

            CREATE TABLE IF NOT EXISTS artifacts (
                id TEXT PRIMARY KEY,
                case_id TEXT NOT NULL,
                filename TEXT NOT NULL,
                file_type TEXT NOT NULL,
                vault_path TEXT NOT NULL,
                sha256 TEXT NOT NULL,
                file_size INTEGER NOT NULL,
                ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS observations (
                id TEXT PRIMARY KEY,
                case_id TEXT NOT NULL,
                artifact_id TEXT,
                field TEXT NOT NULL,
                value TEXT NOT NULL,
                source_type TEXT NOT NULL,
                status TEXT DEFAULT 'ACTIVE',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
                FOREIGN KEY (artifact_id) REFERENCES artifacts(id) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS claims (
                id TEXT PRIMARY KEY,
                case_id TEXT NOT NULL,
                claim_text TEXT NOT NULL,
                incident_time TEXT,
                category TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS claim_evidence (
                id TEXT PRIMARY KEY,
                claim_id TEXT NOT NULL,
                observation_id TEXT NOT NULL,
                relation TEXT DEFAULT 'SUPPORTS',
                FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE,
                FOREIGN KEY (observation_id) REFERENCES observations(id) ON DELETE CASCADE,
                UNIQUE(claim_id, observation_id)
            );

            CREATE TABLE IF NOT EXISTS scenarios (
                id TEXT PRIMARY KEY,
                case_id TEXT NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                parent_id TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
                FOREIGN KEY (parent_id) REFERENCES scenarios(id) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS scenario_overrides (
                id TEXT PRIMARY KEY,
                scenario_id TEXT NOT NULL,
                target_type TEXT NOT NULL,
                target_id TEXT NOT NULL,
                enabled INTEGER NOT NULL DEFAULT 1,
                replacement_value TEXT,
                disputed INTEGER NOT NULL DEFAULT 0,
                reason TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (scenario_id) REFERENCES scenarios(id) ON DELETE CASCADE,
                UNIQUE(scenario_id, target_id)
            );

            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                case_id TEXT,
                action TEXT NOT NULL,
                details TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS guardian_contacts (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                phone TEXT NOT NULL,
                relationship TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS guardian_sessions (
                id TEXT PRIMARY KEY,
                case_id TEXT,
                status TEXT NOT NULL DEFAULT 'ACTIVE',
                incident_note TEXT,
                selected_contacts TEXT NOT NULL DEFAULT '[]',
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ended_at TIMESTAMP,
                FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS guardian_alerts (
                id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL,
                contact_id TEXT,
                contact_name TEXT,
                channel TEXT NOT NULL DEFAULT 'MANUAL_SHARE',
                delivery_status TEXT NOT NULL DEFAULT 'ATTEMPTED',
                message_content TEXT,
                triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                acknowledged_at TIMESTAMP,
                status_explanation TEXT,
                FOREIGN KEY (session_id) REFERENCES guardian_sessions(id) ON DELETE CASCADE,
                FOREIGN KEY (contact_id) REFERENCES guardian_contacts(id) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS action_checklist (
                id TEXT PRIMARY KEY,
                case_id TEXT NOT NULL,
                action_key TEXT NOT NULL,
                title TEXT NOT NULL,
                category TEXT,
                completed INTEGER NOT NULL DEFAULT 0,
                completed_at TIMESTAMP,
                FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
                UNIQUE(case_id, action_key)
            );

            CREATE TABLE IF NOT EXISTS accountability_entries (
                id TEXT PRIMARY KEY,
                case_id TEXT NOT NULL,
                action_type TEXT NOT NULL,
                description TEXT NOT NULL,
                user_event_time TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                organization TEXT,
                status TEXT NOT NULL DEFAULT 'NOT_REPORTED',
                source_classification TEXT NOT NULL DEFAULT 'USER_REPORTED',
                artifact_id TEXT,
                original_artifact_id TEXT,
                reference_number TEXT,
                next_follow_up_date TEXT,
                follow_up_completed INTEGER NOT NULL DEFAULT 0,
                follow_up_completed_at TIMESTAMP,
                FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
                FOREIGN KEY (artifact_id) REFERENCES artifacts(id) ON DELETE SET NULL
            );
            ''')
            conn.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS sessions (
                token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL,
                expires_at TEXT NOT NULL, FOREIGN KEY(user_id) REFERENCES users(id)
            );
            CREATE TABLE IF NOT EXISTS case_owners (
                case_id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
                FOREIGN KEY(case_id) REFERENCES cases(id),
                FOREIGN KEY(user_id) REFERENCES users(id)
            );
            CREATE TABLE IF NOT EXISTS auth_audit (
                id INTEGER PRIMARY KEY AUTOINCREMENT, actor_id TEXT,
                case_id TEXT, action TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """)
            conn.executescript("""
            CREATE TABLE IF NOT EXISTS accountability_verifications (
                id TEXT PRIMARY KEY,
                entry_id TEXT NOT NULL,
                case_id TEXT NOT NULL,
                reviewer_id TEXT NOT NULL,
                decision TEXT NOT NULL CHECK(decision IN ('VERIFIED','REJECTED')),
                rationale TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(entry_id) REFERENCES accountability_entries(id),
                FOREIGN KEY(case_id) REFERENCES cases(id),
                FOREIGN KEY(reviewer_id) REFERENCES users(id)
            );
            """)
            # Ensure original_artifact_id column exists if table was created in an earlier migration
            try:
                conn.execute("ALTER TABLE accountability_entries ADD COLUMN original_artifact_id TEXT")
            except sqlite3.OperationalError:
                pass
    finally:
        conn.close()

def get_connection(db_path: Path = DB_PATH) -> sqlite3.Connection:
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA foreign_keys = ON;')
    return conn

@contextmanager
def db_session(db_path: Path = DB_PATH) -> Generator[sqlite3.Connection, None, None]:
    conn = get_connection(db_path)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
