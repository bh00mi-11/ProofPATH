"""
Seed Synthetic Demo Fixture for ProofPath:
2 screenshots, 1 chat transcript, 1 document, 1 manually entered observation,
5 dependent incident claims with a planted date conflict to demonstrate the Time Machine.
"""
from pathlib import Path
from .db import get_connection, VAULT_DIR
from .vault import EvidenceVault

def seed_demo_fixture(db_conn, vault: EvidenceVault) -> str:
    case_id = "case_demo_01"
    
    with db_conn:
        db_conn.execute("DELETE FROM claim_evidence")
        db_conn.execute("DELETE FROM scenario_overrides")
        db_conn.execute("DELETE FROM scenarios")
        db_conn.execute("DELETE FROM claims")
        db_conn.execute("DELETE FROM observations")
        db_conn.execute("DELETE FROM artifacts")
        db_conn.execute("DELETE FROM cases")

        # 1. Create Case
        db_conn.execute(
            "INSERT INTO cases (id, title, description) VALUES (?, ?, ?)",
            (case_id, "Workplace Harassment Incident Timeline", "Evidence review record for October 2026 incident logs.")
        )

        # 2. Store 4 Synthetic Vault Artifacts (2 screenshots, 1 chat, 1 document)
        # Using real magic byte headers so content inspection succeeds
        png_header = b"\x89PNG\r\n\x1a\n"
        pdf_header = b"%PDF-1.4\n"
        art1 = vault.store_file("threat_message_screenshot.png", png_header + b"SYNTHETIC_IMAGE_BYTES_SLACK_DM_SCREENSHOT_OCT22")
        art2 = vault.store_file("followup_call_screenshot.png", png_header + b"SYNTHETIC_IMAGE_BYTES_CALL_LOG_SCREENSHOT_OCT22")
        art3 = vault.store_file("chat_export_whatsapp.txt", b"2026-10-22 21:45 [Sender: Manager] You better not report this meeting.")
        art4 = vault.store_file("hr_formal_grievance.pdf", pdf_header + b"OFFICIAL_HR_RECEIPT_OCT23_TIMESTAMP_CONFIRMED")

        artifacts_data = [
            (art1["artifact_id"], case_id, art1["filename"], "screenshot", art1["vault_path"], art1["sha256"], art1["file_size"]),
            (art2["artifact_id"], case_id, art2["filename"], "screenshot", art2["vault_path"], art2["sha256"], art2["file_size"]),
            (art3["artifact_id"], case_id, art3["filename"], "chat_log", art3["vault_path"], art3["sha256"], art3["file_size"]),
            (art4["artifact_id"], case_id, art4["filename"], "document", art4["vault_path"], art4["sha256"], art4["file_size"]),
        ]
        db_conn.executemany(
            "INSERT INTO artifacts (id, case_id, filename, file_type, vault_path, sha256, file_size) VALUES (?, ?, ?, ?, ?, ?, ?)",
            artifacts_data
        )

        # 3. Create Observations (including 1 manual observation with a planted conflicting time)
        obs_data = [
            ("obs_01", case_id, art1["artifact_id"], "timestamp", "2026-10-22 21:45", "screenshot", "ACTIVE"),
            ("obs_02", case_id, art1["artifact_id"], "sender_identity", "Executive X", "screenshot", "ACTIVE"),
            ("obs_03", case_id, art2["artifact_id"], "call_timestamp", "2026-10-22 22:10", "screenshot", "ACTIVE"),
            ("obs_04", case_id, art3["artifact_id"], "chat_content", "Direct threatening language", "chat_log", "ACTIVE"),
            ("obs_05", case_id, art4["artifact_id"], "hr_acknowledgment", "HR Formal Complaint Received", "document", "ACTIVE"),
            # Planted conflict: Manual observation claims incident occurred at 2026-10-22 18:00 instead of 21:45
            ("obs_06_manual", case_id, None, "timestamp", "2026-10-22 18:00", "manual", "ACTIVE"),
        ]
        db_conn.executemany(
            "INSERT INTO observations (id, case_id, artifact_id, field, value, source_type, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
            obs_data
        )

        # 4. Create 5 Dependent Claims
        claim_data = [
            ("claim_01", case_id, "Hostile message was received by target on evening of Oct 22", "2026-10-22", "Harassment"),
            ("claim_02", case_id, "Sender of hostile message was Executive X", "2026-10-22 21:45", "Identification"),
            ("claim_03", case_id, "Unsolicited follow-up call occurred shortly after threat message", "2026-10-22 22:10", "Pattern"),
            ("claim_04", case_id, "Formal grievance submitted to HR within 24 hours", "2026-10-23 09:30", "Reporting"),
            ("claim_05", case_id, "Incident took place during evening hours (timestamp consistency)", "2026-10-22", "Timeline")
        ]
        db_conn.executemany(
            "INSERT INTO claims (id, case_id, claim_text, incident_time, category) VALUES (?, ?, ?, ?, ?)",
            claim_data
        )

        # 5. Link Claims to Evidence Observations
        # claim_01 is supported by obs_01 (screenshot) and obs_04 (chat)
        # claim_02 is supported by obs_02 (screenshot)
        # claim_03 is supported by obs_03 (screenshot call)
        # claim_04 is supported by obs_05 (document)
        # claim_05 is linked to obs_01 (21:45) AND obs_06_manual (18:00) -> Plated conflict!
        links = [
            ("link_01", "claim_01", "obs_01", "SUPPORTS"),
            ("link_02", "claim_01", "obs_04", "SUPPORTS"),
            ("link_03", "claim_02", "obs_02", "SUPPORTS"),
            ("link_04", "claim_03", "obs_03", "SUPPORTS"),
            ("link_05", "claim_04", "obs_05", "SUPPORTS"),
            ("link_06", "claim_05", "obs_01", "SUPPORTS"),
            ("link_07", "claim_05", "obs_06_manual", "SUPPORTS"),
        ]
        db_conn.executemany(
            "INSERT INTO claim_evidence (id, claim_id, observation_id, relation) VALUES (?, ?, ?, ?)",
            links
        )

        # 6. Baseline Scenario
        db_conn.execute(
            "INSERT INTO scenarios (id, case_id, name, description) VALUES (?, ?, ?, ?)",
            ("scenario_baseline", case_id, "Baseline Record", "Default intake state with all original observations.")
        )

    return case_id
