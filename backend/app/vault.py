import hashlib
import shutil
import uuid
import os
from pathlib import Path
from typing import Dict, Any, Optional

def compute_sha256_bytes(data: bytes) -> str:
    h = hashlib.sha256()
    h.update(data)
    return h.hexdigest()

def compute_sha256_file(file_path: Path) -> str:
    h = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

class EvidenceVault:
    def __init__(self, vault_dir: Path):
        self.vault_dir = Path(vault_dir)
        self.vault_dir.mkdir(parents=True, exist_ok=True)

    def store_file(self, filename: str, content: bytes) -> Dict[str, Any]:
        """
        Stores file in private vault using a unique artifact ID.
        Calculates SHA-256 for cryptographic tamper-proofing.
        """
        sha = compute_sha256_bytes(content)
        artifact_id = f"art_{uuid.uuid4().hex[:12]}"
        ext = Path(filename).suffix
        safe_name = f"{artifact_id}{ext}"
        target_path = self.vault_dir / safe_name
        
        with open(target_path, "wb") as f:
            f.write(content)
            
        return {
            "artifact_id": artifact_id,
            "filename": filename,
            "vault_path": str(target_path),
            "sha256": sha,
            "file_size": len(content),
            "file_type": ext.lower().lstrip(".") or "unknown"
        }

    def verify_integrity(self, vault_path: str, expected_sha256: str) -> bool:
        """
        Checks whether the physical file matches its recorded SHA-256 hash.
        Flagged if tampered or missing.
        """
        p = Path(vault_path)
        if not p.exists():
            return False
        actual_sha = compute_sha256_file(p)
        return actual_sha.lower() == expected_sha256.lower()
