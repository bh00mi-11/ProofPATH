"""
Accountability Trail Domain Module for ProofPath (Feature 8).
Enforces:
1. Append-only, chronological history of reporting actions, acknowledgments, follow-ups, and case status transitions.
2. Clear provenance distinction: USER_REPORTED vs. DOCUMENT_SUPPORTED.
3. Case progress states: NOT_REPORTED, SUBMITTED, ACKNOWLEDGED, UNDER_REVIEW, RESOLVED, UNKNOWN.
4. Transparent evidence linking with cross-case validation.
5. User-defined follow-ups with overdue/upcoming tracking.
6. Honest boundary: ProofPath never implies external verification or independent confirmation of official proceedings.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, date
import uuid

VALID_STATUSES = {
    "NOT_REPORTED",
    "SUBMITTED",
    "ACKNOWLEDGED",
    "UNDER_REVIEW",
    "RESOLVED",
    "UNKNOWN"
}

VALID_ACTION_TYPES = {
    "REPORT_PREPARED",
    "COMPLAINT_SUBMITTED",
    "ACKNOWLEDGMENT_RECEIVED",
    "FOLLOW_UP_COMPLETED",
    "ADDITIONAL_EVIDENCE_SUPPLIED",
    "RESPONSE_RECEIVED",
    "CASE_STATUS_UPDATED",
    "CUSTOM_ACTION"
}


def create_accountability_entry(
    conn,
    case_id: str,
    action_type: str,
    description: str,
    user_event_time: str,
    status: str = "NOT_REPORTED",
    organization: Optional[str] = None,
    artifact_id: Optional[str] = None,
    reference_number: Optional[str] = None,
    next_follow_up_date: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Appends an entry to the accountability trail.
    Validates:
    - Case existence
    - Artifact belongs strictly to the same case if provided
    - Classification: DOCUMENT_SUPPORTED if valid artifact attached, else USER_REPORTED
    - Valid status
    """
    cur = conn.cursor()

    # 1. Validate Case
    cur.execute("SELECT id FROM cases WHERE id = ?", (case_id,))
    if not cur.fetchone():
        raise ValueError(f"Case '{case_id}' does not exist.")

    # 2. Validate Status
    norm_status = status.upper().strip()
    if norm_status not in VALID_STATUSES:
        raise ValueError(f"Invalid status '{status}'. Must be one of: {sorted(list(VALID_STATUSES))}")

    # 3. Validate Action Type
    norm_action = action_type.upper().strip()
    if norm_action not in VALID_ACTION_TYPES:
        norm_action = "CUSTOM_ACTION"

    # 4. Cross-Case Artifact Validation
    source_classification = "USER_REPORTED"
    linked_artifact_meta = None

    if artifact_id:
        cur.execute("SELECT id, case_id, filename, sha256 FROM artifacts WHERE id = ?", (artifact_id,))
        art_row = cur.fetchone()
        if not art_row:
            raise ValueError(f"Artifact '{artifact_id}' does not exist.")
        if art_row["case_id"] != case_id:
            raise ValueError(f"Cross-case evidence violation: Artifact '{artifact_id}' does not belong to case '{case_id}'.")
        # Evidence exists and belongs to the case
        source_classification = "DOCUMENT_SUPPORTED"
        linked_artifact_meta = {
            "id": art_row["id"],
            "filename": art_row["filename"],
            "sha256": art_row["sha256"]
        }

    entry_id = f"acc_{uuid.uuid4().hex[:12]}"
    created_at_iso = datetime.now(timezone.utc).isoformat()

    with conn:
        conn.execute(
            """
            INSERT INTO accountability_entries (
                id, case_id, action_type, description, user_event_time,
                created_at, organization, status, source_classification,
                artifact_id, original_artifact_id, reference_number, next_follow_up_date,
                follow_up_completed, follow_up_completed_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL)
            """,
            (
                entry_id,
                case_id,
                norm_action,
                description.strip(),
                user_event_time.strip(),
                created_at_iso,
                organization.strip() if organization else None,
                norm_status,
                source_classification,
                artifact_id,
                artifact_id,
                reference_number.strip() if reference_number else None,
                next_follow_up_date.strip() if next_follow_up_date else None,
            )
        )

    return {
        "id": entry_id,
        "case_id": case_id,
        "action_type": norm_action,
        "description": description.strip(),
        "user_event_time": user_event_time.strip(),
        "created_at": created_at_iso,
        "organization": organization.strip() if organization else None,
        "status": norm_status,
        "source_classification": source_classification,
        "artifact_id": artifact_id,
        "linked_artifact": linked_artifact_meta,
        "reference_number": reference_number.strip() if reference_number else None,
        "next_follow_up_date": next_follow_up_date.strip() if next_follow_up_date else None,
        "follow_up_completed": False,
        "follow_up_completed_at": None
    }


def record_status_transition(
    conn,
    case_id: str,
    new_status: str,
    reason: str,
    user_event_time: str,
    organization: Optional[str] = None,
    artifact_id: Optional[str] = None,
    reference_number: Optional[str] = None,
    next_follow_up_date: Optional[str] = None
) -> Dict[str, Any]:
    """
    Records a historical case status transition as an append-only entry.
    Never overwrites or deletes prior statuses.
    """
    return create_accountability_entry(
        conn=conn,
        case_id=case_id,
        action_type="CASE_STATUS_UPDATED",
        description=reason,
        user_event_time=user_event_time,
        status=new_status,
        organization=organization,
        artifact_id=artifact_id,
        reference_number=reference_number,
        next_follow_up_date=next_follow_up_date
    )


def complete_follow_up_action(
    conn,
    case_id: str,
    entry_id: str,
    completion_note: str,
    completion_time: str
) -> Dict[str, Any]:
    """
    Marks a pending follow-up as completed by updating the original entry's completion flag
    AND creating an append-only 'FOLLOW_UP_COMPLETED' event record in the trail.
    """
    cur = conn.cursor()
    cur.execute("SELECT * FROM accountability_entries WHERE id = ? AND case_id = ?", (entry_id, case_id))
    entry = cur.fetchone()
    if not entry:
        raise ValueError(f"Accountability entry '{entry_id}' not found in case '{case_id}'.")

    now_iso = datetime.now(timezone.utc).isoformat()

    with conn:
        conn.execute(
            """
            UPDATE accountability_entries
            SET follow_up_completed = 1, follow_up_completed_at = ?
            WHERE id = ?
            """,
            (now_iso, entry_id)
        )

    # Append an explicit historical follow-up completed entry
    completed_event = create_accountability_entry(
        conn=conn,
        case_id=case_id,
        action_type="FOLLOW_UP_COMPLETED",
        description=f"Completed follow-up for action '{entry['action_type']}': {completion_note}",
        user_event_time=completion_time,
        status=entry["status"],
        organization=entry["organization"],
        reference_number=entry["reference_number"]
    )

    return {
        "status": "success",
        "updated_entry_id": entry_id,
        "follow_up_completed": True,
        "follow_up_completed_at": now_iso,
        "historical_entry": completed_event
    }


def get_accountability_timeline(conn, case_id: str) -> Dict[str, Any]:
    """
    Retrieves full accountability timeline for a case,
    evaluating current recorded status, pending/overdue follow-ups, and evidence links.
    Handles missing evidence artifacts gracefully.
    """
    cur = conn.cursor()
    cur.execute("SELECT id, title FROM cases WHERE id = ?", (case_id,))
    case_row = cur.fetchone()
    if not case_row:
        raise ValueError(f"Case '{case_id}' does not exist.")

    cur.execute(
        """
        SELECT * FROM accountability_entries
        WHERE case_id = ?
        ORDER BY datetime(user_event_time) ASC, datetime(created_at) ASC
        """,
        (case_id,)
    )
    rows = cur.fetchall()

    timeline_entries = []
    current_recorded_status = "NOT_REPORTED"
    last_status_transition_entry = None
    pending_follow_ups = []
    today_iso = date.today().isoformat()

    for r in rows:
        entry = dict(r)
        
        # Link artifact status inspection
        linked_artifact = None
        artifact_missing = False
        original_art_id = entry.get("original_artifact_id") or entry.get("artifact_id")
        
        if entry["artifact_id"]:
            cur.execute("SELECT id, filename, sha256 FROM artifacts WHERE id = ?", (entry["artifact_id"],))
            art_row = cur.fetchone()
            if art_row:
                linked_artifact = {
                    "id": art_row["id"],
                    "filename": art_row["filename"],
                    "sha256": art_row["sha256"]
                }
            else:
                artifact_missing = True
        elif original_art_id or entry.get("source_classification") == "DOCUMENT_SUPPORTED":
            # Artifact was previously linked but has been deleted or is unavailable
            artifact_missing = True

        entry_dict = {
            "id": entry["id"],
            "case_id": entry["case_id"],
            "action_type": entry["action_type"],
            "description": entry["description"],
            "user_event_time": entry["user_event_time"],
            "created_at": entry["created_at"],
            "organization": entry["organization"],
            "status": entry["status"],
            "source_classification": entry["source_classification"],
            "artifact_id": entry["artifact_id"],
            "linked_artifact": linked_artifact,
            "artifact_support_unavailable": artifact_missing,
            "reference_number": entry["reference_number"],
            "next_follow_up_date": entry["next_follow_up_date"],
            "follow_up_completed": bool(entry["follow_up_completed"]),
            "follow_up_completed_at": entry["follow_up_completed_at"],
        }
        timeline_entries.append(entry_dict)

        # Track latest status
        if entry["status"] and entry["status"] != "NOT_REPORTED":
            current_recorded_status = entry["status"]
            last_status_transition_entry = entry_dict

        # Track pending follow-up
        if entry["next_follow_up_date"] and not entry["follow_up_completed"]:
            is_overdue = entry["next_follow_up_date"] < today_iso
            pending_follow_ups.append({
                "entry_id": entry["id"],
                "action_type": entry["action_type"],
                "due_date": entry["next_follow_up_date"],
                "is_overdue": is_overdue,
                "organization": entry["organization"],
                "description": entry["description"]
            })

    return {
        "case_id": case_id,
        "case_title": case_row["title"],
        "current_recorded_status": current_recorded_status,
        "last_status_transition": last_status_transition_entry,
        "total_entries": len(timeline_entries),
        "timeline": timeline_entries,
        "pending_follow_ups": pending_follow_ups,
        "honesty_notice": (
            "Status values are recorded by the user or derived from attached documentation. "
            "ProofPath does not independently confirm the official progress or legal standing of any external proceeding."
        )
    }
