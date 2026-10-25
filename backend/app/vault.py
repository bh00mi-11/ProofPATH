import hashlib
import os
import re
from pathlib import Path
from typing import Dict, Any, Optional

ALLOWED_EXTENSIONS = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".pdf": "application/pdf",
    ".txt": "text/plain",
    ".csv": "text/csv"
}

# 10 MB default upload limit
MAX_UPLOAD_SIZE = int(os.getenv("PROOFPATH_MAX_UPLOAD_SIZE", 10 * 1024 * 1024))

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

def inspect_file_magic(header: bytes) -> Optional[str]:
    """Lightweight magic byte validation for safe file types."""
    if header.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    if header.startswith(b"\xff\xd8\xff"):
        return "jpeg"
    if header.startswith(b"%PDF-"):
        return "pdf"
    # Check if printable ascii/utf-8 text
    try:
        header.decode("utf-8")
        return "txt"
    except UnicodeDecodeError:
        pass
    return None

def sanitize_filename(filename: str) -> str:
    base = os.path.basename(filename)
    safe = re.sub(r"[^a-zA-Z0-9_\-\.]", "_", base)
    return safe or "unnamed_artifact"

class EvidenceVault:
    def __init__(self, vault_dir: Path, max_size: int = MAX_UPLOAD_SIZE):
        self.vault_dir = Path(vault_dir)
        self.vault_dir.mkdir(parents=True, exist_ok=True)
        self.max_size = max_size

    def store_file(self, filename: str, content: bytes) -> Dict[str, Any]:
        """
        Stores file in private vault using a unique artifact ID.
        Calculates SHA-256 for cryptographic tamper-proofing.
        Sanitizes filename and isolates path.
        """
        if len(content) > self.max_size:
            raise ValueError(f"File size exceeds upload limit of {self.max_size} bytes")

        safe_original_name = sanitize_filename(filename)
        ext = Path(safe_original_name).suffix.lower()
        if ext and ext not in ALLOWED_EXTENSIONS:
            raise ValueError(f"Unsupported file extension '{ext}'")

        # Validate content magic byte if possible
        if len(content) > 0 and ext in [".png", ".jpg", ".jpeg", ".pdf"]:
            detected = inspect_file_magic(content[:32])
            if ext == ".png" and detected != "png":
                raise ValueError("File content does not match PNG signature")
            elif ext in [".jpg", ".jpeg"] and detected != "jpeg":
                raise ValueError("File content does not match JPEG signature")
            elif ext == ".pdf" and detected != "pdf":
                raise ValueError("File content does not match PDF signature")

        sha = compute_sha256_bytes(content)
        import uuid
        # Synthetic demo runs on independent ephemeral instances; use stable IDs
        # so navigation and evidence links agree across cold starts.
        artifact_id = (
            "art_" + hashlib.sha256((safe_original_name + ":" + sha).encode("utf-8")).hexdigest()[:12]
            if os.getenv("PROOFPATH_ENV") == "synthetic_demo"
            else f"art_{uuid.uuid4().hex[:12]}"
        )
        safe_name = f"{artifact_id}{ext}"
        target_path = self.vault_dir / safe_name
        
        with open(target_path, "wb") as f:
            f.write(content)
            
        return {
            "artifact_id": artifact_id,
            "filename": safe_original_name,
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

    def remove_file(self, vault_path: str) -> None:
        """Safely clean up stored artifact file if database transaction fails."""
        try:
            p = Path(vault_path)
            if p.exists() and p.is_file():
                p.unlink()
        except Exception:
            pass
