"""
Deterministic Next-Step Navigator Engine for ProofPath.
Maps recorded incident categories to verified next steps, checklists, and Indian official reporting resources.
Strictly adheres to safety rules:
- No automatic external transmission or reporting.
- Deterministic category mapping based on user-recorded claims/case context.
- Verified official Indian resources only (112, 1930 Cybercrime, NCW, NALSA, SHe-Box / POSH).
- Safe external URLs containing NO case IDs, user tokens, or case details.
- Disclaimer: Does not constitute legal advice, guarantee outcomes, or advise confronting abusers.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import uuid

# Verified Indian Support and Reporting Resources
# Researched and verified official portals and helplines
VERIFIED_RESOURCES: List[Dict[str, Any]] = [
    {
        "id": "res_erss_112",
        "name": "Emergency Response Support System (ERSS)",
        "organization": "Ministry of Home Affairs, Government of India",
        "helpline": "112",
        "url": "https://112.gov.in",
        "scope": "Pan-India 24/7 all-in-one emergency response for immediate physical danger, police, fire, or medical crisis.",
        "category_tags": ["all", "threats_and_intimidation", "cyberstalking", "workplace_harassment", "intimate_content"],
        "is_emergency": True,
        "last_verified": "2026-10-24"
    },
    {
        "id": "res_cybercrime_portal",
        "name": "National Cyber Crime Reporting Portal",
        "organization": "Indian Cyber Crime Coordination Centre (I4C), MHA",
        "helpline": "1930",
        "url": "https://cybercrime.gov.in",
        "scope": "Official Government portal to report cybercrimes, with specialized priority reporting for cyber crimes against women and children, cyberstalking, non-consensual content, and online harassment.",
        "category_tags": ["cyberstalking", "threats_and_intimidation", "impersonation", "intimate_content"],
        "is_emergency": False,
        "last_verified": "2026-10-24"
    },
    {
        "id": "res_ncw_helpline",
        "name": "National Commission for Women (NCW)",
        "organization": "NCW, Government of India",
        "helpline": "7827170170",
        "url": "http://ncw.nic.in",
        "scope": "24/7 dedicated helpline for women facing violence, domestic abuse, online harassment, or severe intimidation across India.",
        "category_tags": ["cyberstalking", "threats_and_intimidation", "workplace_harassment", "intimate_content"],
        "is_emergency": False,
        "last_verified": "2026-10-24"
    },
    {
        "id": "res_nalsa_legal_aid",
        "name": "National Legal Services Authority (NALSA)",
        "organization": "Statutory body under Legal Services Authorities Act, 1987",
        "helpline": "15100",
        "url": "https://nalsa.gov.in",
        "scope": "Provides free legal aid and counseling services for eligible citizens, including women and victims of violence/harassment under Section 12 of the LSA Act.",
        "category_tags": ["all", "workplace_harassment", "threats_and_intimidation", "cyberstalking", "intimate_content", "impersonation"],
        "is_emergency": False,
        "last_verified": "2026-10-24"
    },
    {
        "id": "res_shebox_posh",
        "name": "SHe-Box / Workplace Harassment Redressal",
        "organization": "Ministry of Women and Child Development, Government of India",
        "helpline": "181",
        "url": "https://shebox.wcd.gov.in",
        "scope": "Single-window access portal for women facing sexual harassment at workplace (POSH Act) to lodge formal grievances to the respective Internal Committee (IC) or Local Committee (LC).",
        "category_tags": ["workplace_harassment"],
        "is_emergency": False,
        "last_verified": "2026-10-24"
    }
]

# Standard deterministic action items available across categories
STANDARD_CHECKLIST_TEMPLATE = [
    {
        "action_key": "preserve_evidence",
        "title": "Preserve original digital evidence",
        "description": "Retain original files, unedited full-screen screenshots showing system clocks, URL bars, email headers, or chat exports without modifications.",
        "recommended_for": ["all"],
        "priority": "HIGH"
    },
    {
        "action_key": "review_timeline",
        "title": "Review the incident timeline",
        "description": "Inspect chronological sequence in the Evidence Time Machine to confirm event dependencies and clarify what happened when.",
        "recommended_for": ["all"],
        "priority": "HIGH"
    },
    {
        "action_key": "run_stress_test",
        "title": "Run the Record Stress Test",
        "description": "Execute deterministic contradiction, timestamp anomaly, and source coverage checks to resolve any factual inconsistencies.",
        "recommended_for": ["all"],
        "priority": "MEDIUM"
    },
    {
        "action_key": "review_sensitive_info",
        "title": "Review sensitive information before disclosure",
        "description": "Check phone numbers, email addresses, and private personal notes. Use recipient-specific field filtering to minimize data sharing.",
        "recommended_for": ["all"],
        "priority": "HIGH"
    },
    {
        "action_key": "prepare_action_pack",
        "title": "Prepare recipient-specific Incident Action Pack",
        "description": "Compile a tailored disclosure bundle for legal counsel, workplace committee, or support counselor with verified cryptographic hashes.",
        "recommended_for": ["all"],
        "priority": "MEDIUM"
    },
    {
        "action_key": "choose_reporting_channel",
        "title": "Choose an appropriate reporting or support channel",
        "description": "Select the appropriate official redressal forum (e.g., ICC for workplace, Cyber Crime portal 1930 for online harassment, or ERSS 112 in immediate danger).",
        "recommended_for": ["all"],
        "priority": "MEDIUM"
    }
]

# Category-specific guidance and extra checklist items
CATEGORY_SPECIFIC_GUIDANCE: Dict[str, Dict[str, Any]] = {
    "workplace_harassment": {
        "canonical_name": "Workplace Harassment",
        "summary": "Documented workplace misconduct, intimidation, or hostile working environment.",
        "safety_notes": [
            "Preserve written communications, performance evaluations, calendar invites, and meeting minutes.",
            "Under the POSH Act, you may file a formal complaint with your employer's Internal Committee (IC) or the District Local Committee (LC).",
            "Avoid deleting corporate communication logs; store independent records outside employer devices where permitted.",
            "Do not confront the perpetrator directly without institutional support."
        ],
        "extra_checklist": [
            {
                "action_key": "locate_ic_members",
                "title": "Identify Internal Committee (IC) or HR redressal contacts",
                "description": "Check company handbook or intranet for designated IC Presiding Officer details.",
                "recommended_for": ["workplace_harassment"],
                "priority": "MEDIUM"
            }
        ]
    },
    "cyberstalking": {
        "canonical_name": "Cyberstalking and Online Harassment",
        "summary": "Persistent unwanted online contact, surveillance, monitoring, or digital stalking.",
        "safety_notes": [
            "Capture screenshots showing sender handle/username, profile URL, date, and full system timestamp.",
            "Do not engage in arguments or warn the stalker before preserving the evidence trail.",
            "Report accounts directly through platform reporting tools and keep record of platform report reference numbers.",
            "File a complaint on the National Cyber Crime Reporting Portal (cybercrime.gov.in) or call 1930."
        ],
        "extra_checklist": [
            {
                "action_key": "secure_online_accounts",
                "title": "Enable Two-Factor Authentication (2FA) and review account sessions",
                "description": "Change passwords on critical email and social accounts, and log out of unrecognized active sessions.",
                "recommended_for": ["cyberstalking"],
                "priority": "HIGH"
            }
        ]
    },
    "threats_and_intimidation": {
        "canonical_name": "Threats and Intimidation",
        "summary": "Explicit or implicit threats of physical harm, extortion, or coercion.",
        "safety_notes": [
            "If in immediate physical danger, contact emergency services at 112 immediately.",
            "Preserve voicemail audio files, call logs, text messages, and physical letters.",
            "Do not meet or negotiate with the person making threats in isolated or private locations.",
            "Share your location with trusted emergency contacts or activate ProofPath Guardian Mode."
        ],
        "extra_checklist": [
            {
                "action_key": "activate_guardian_mode",
                "title": "Configure ProofPath Guardian Mode with trusted contacts",
                "description": "Add designated emergency contacts and know how to trigger SOS or record a safety session log.",
                "recommended_for": ["threats_and_intimidation"],
                "priority": "HIGH"
            }
        ]
    },
    "impersonation": {
        "canonical_name": "Impersonation and Account Misuse",
        "summary": "Creation of fake profiles, unauthorized account access, or deceptive identity representation.",
        "safety_notes": [
            "Document fake profile URLs, profile pictures used, account creation dates, and deceptive messages sent to contacts.",
            "Notify contacts through a secondary channel not to accept friend requests or money demands from the imposter account.",
            "Report the profile directly to the service provider under impersonation guidelines.",
            "File an official complaint with the Cyber Crime portal (1930 / cybercrime.gov.in)."
        ],
        "extra_checklist": [
            {
                "action_key": "report_impersonation_platform",
                "title": "Submit impersonation takedown request to host platform",
                "description": "Use the platform's official reporting flow for impersonation and save the confirmation email or ticket number.",
                "recommended_for": ["impersonation"],
                "priority": "HIGH"
            }
        ]
    },
    "intimate_content": {
        "canonical_name": "Non-Consensual Sharing of Intimate Content",
        "summary": "Non-consensual sharing or threatened dissemination of intimate images, videos, or private media.",
        "safety_notes": [
            "Do not delete evidence even if it is distressing; document the exact URLs, groups, or channels where content was posted.",
            "You can utilize StopNCII.org or platform hashes to prevent digital distribution without uploading unencrypted raw media.",
            "File a complaint under the special 'Cyber Crime against Women and Children' section at cybercrime.gov.in or call 1930.",
            "You may also reach out to NCW Women Helpline at 7827170170 for guidance."
        ],
        "extra_checklist": [
            {
                "action_key": "stopncii_hash_creation",
                "title": "Consider StopNCII or platform hash protection",
                "description": "Generate privacy-preserving digital hashes through official non-profit initiatives (like StopNCII.org) to prevent sharing across platforms.",
                "recommended_for": ["intimate_content"],
                "priority": "HIGH"
            }
        ]
    }
}


def normalize_category(raw_category: Optional[str]) -> str:
    """
    Deterministic mapping from case / claim category keywords to canonical navigator category.
    Does not assume guilt, outcome, or establish legal conclusion.
    """
    if not raw_category:
        return "workplace_harassment"
    
    cat = raw_category.lower().replace("-", " ").replace("_", " ")
    
    if any(k in cat for k in ["intimate", "ncvi", "ncii", "morph", "nudity", "private picture"]):
        return "intimate_content"
    if any(k in cat for k in ["impersonat", "fake profile", "account takeover", "misuse"]):
        return "impersonation"
    if any(k in cat for k in ["threat", "intimidation", "extort", "blackmail", "danger"]):
        return "threats_and_intimidation"
    if any(k in cat for k in ["stalk", "cyberstalk", "online harass", "doxx", "troll"]):
        return "cyberstalking"
    if any(k in cat for k in ["workplace", "posh", "office", "employer", "colleague", "manager", "grievance"]):
        return "workplace_harassment"
    
    # Default to workplace harassment if it matches "harassment", or fallback
    if "harass" in cat:
        return "workplace_harassment"
        
    return "workplace_harassment"


def get_navigator_data(conn, case_id: str) -> Dict[str, Any]:
    """
    Retrieve contextual next-step navigator data for a case,
    including mapped category, guidance, verified resources, and tracked checklist.
    """
    cur = conn.cursor()
    # 1. Fetch case details
    cur.execute("SELECT id, title, description FROM cases WHERE id = ?", (case_id,))
    case_row = cur.fetchone()
    if not case_row:
        raise ValueError(f"Case {case_id} not found")
    
    # 2. Determine category deterministically from claims or case title
    cur.execute("SELECT category, claim_text FROM claims WHERE case_id = ?", (case_id,))
    claim_rows = cur.fetchall()
    
    detected_category = None
    for row in claim_rows:
        if row["category"]:
            detected_category = normalize_category(row["category"])
            break
            
    if not detected_category:
        detected_category = normalize_category(case_row["title"] + " " + (case_row["description"] or ""))
        
    cat_guidance = CATEGORY_SPECIFIC_GUIDANCE.get(
        detected_category, 
        CATEGORY_SPECIFIC_GUIDANCE["workplace_harassment"]
    )
    
    # 3. Assemble checklist items
    items_to_render = []
    # Standard items
    for item in STANDARD_CHECKLIST_TEMPLATE:
        items_to_render.append({**item, "category": detected_category})
    # Extra category-specific items
    for item in cat_guidance.get("extra_checklist", []):
        items_to_render.append({**item, "category": detected_category})
        
    # 4. Fetch existing completed status from action_checklist table
    cur.execute(
        "SELECT action_key, completed, completed_at FROM action_checklist WHERE case_id = ?",
        (case_id,)
    )
    status_map = {row["action_key"]: {"completed": bool(row["completed"]), "completed_at": row["completed_at"]} for row in cur.fetchall()}
    
    checklist_results = []
    completed_count = 0
    for itm in items_to_render:
        key = itm["action_key"]
        st = status_map.get(key, {"completed": False, "completed_at": None})
        is_done = st["completed"]
        if is_done:
            completed_count += 1
        checklist_results.append({
            "action_key": key,
            "title": itm["title"],
            "description": itm["description"],
            "priority": itm["priority"],
            "completed": is_done,
            "completed_at": st["completed_at"]
        })
        
    # 5. Filter verified resources relevant for this category
    relevant_resources = []
    for res in VERIFIED_RESOURCES:
        tags = res["category_tags"]
        if "all" in tags or detected_category in tags:
            relevant_resources.append(res)
            
    return {
        "case_id": case_id,
        "category": detected_category,
        "canonical_name": cat_guidance["canonical_name"],
        "summary": cat_guidance["summary"],
        "safety_notes": cat_guidance["safety_notes"],
        "checklist_total": len(checklist_results),
        "checklist_completed": completed_count,
        "checklist": checklist_results,
        "verified_resources": relevant_resources,
        "emergency_shortcut": {
            "title": "Immediate Physical Danger (ERSS)",
            "helpline": "112",
            "dial_url": "tel:112",
            "advisory": "If you are in immediate physical danger, call 112 directly. Do not wait for evidence export."
        },
        "disclaimer": (
            "ProofPath provides organizational, timeline, and cryptographic evidence verification tools. "
            "It does not provide legal advice, guarantee law enforcement response, or predict outcome in court."
        )
    }


def toggle_checklist_item(conn, case_id: str, action_key: str, completed: bool, title: Optional[str] = None) -> Dict[str, Any]:
    """
    Toggle checklist item completion in the database.
    """
    cur = conn.cursor()
    # Check if case exists
    cur.execute("SELECT id FROM cases WHERE id = ?", (case_id,))
    if not cur.fetchone():
        raise ValueError(f"Case {case_id} not found")
        
    completed_int = 1 if completed else 0
    now_iso = datetime.now(timezone.utc).isoformat() if completed else None
    item_title = title or action_key.replace("_", " ").title()
    item_id = f"chk_{uuid.uuid4().hex[:10]}"
    
    with conn:
        conn.execute(
            """
            INSERT INTO action_checklist (id, case_id, action_key, title, completed, completed_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(case_id, action_key) DO UPDATE SET
                completed = excluded.completed,
                completed_at = excluded.completed_at
            """,
            (item_id, case_id, action_key, item_title, completed_int, now_iso)
        )
        
    return {
        "status": "success",
        "case_id": case_id,
        "action_key": action_key,
        "completed": completed,
        "completed_at": now_iso
    }
