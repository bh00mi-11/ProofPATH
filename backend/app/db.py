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
            ''')
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
