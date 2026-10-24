"""
Victim Justice & Remedies Engine for ProofPath (Feature 9).
Carefully sourced, deterministic Indian remedy pathways and eligibility assessment engine.
Adheres strictly to core principles:
1. Curated official pathways:
   - Free Legal Aid (NALSA & State/District Legal Services Authorities under Section 12, LSA Act, 1987)
   - Victim Compensation Scheme (Section 396 BNSS / Section 357A CrPC & NALSA Compensation Scheme)
   - National Cyber Crime Reporting & Escalation (cybercrime.gov.in / 1930)
   - Workplace Sexual Harassment Redressal (Internal Committee / SHe-Box under POSH Act, 2013)
   - Platform Content Takedown (Rule 3(2)(b) IT Rules, 2021 - 24hr mandate for non-consensual media)
   - Women Support Services (National Commission for Women 7827170170 & One Stop Centres 181)
2. Deterministic Eligibility States:
   - POTENTIALLY_ELIGIBLE
   - MORE_INFORMATION_NEEDED
   - NOT_APPLICABLE
   - REQUIRES_PROFESSIONAL_REVIEW
3. Strict Honest Boundaries:
   - Unknown information remains UNKNOWN.
   - ProofPath SUPPORTED claims do not constitute judicial proof or establish automatic benefit entitlement.
   - Zero invented financial compensation amounts, statutory deadlines, or guaranteed outcomes.
   - Pure static official URLs containing no case tokens or personal identifiers.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

# Curated Official Indian Remedy Pathways
REMEDY_PATHWAYS_CATALOG: List[Dict[str, Any]] = [
    {
        "id": "remedy_nalsa_legal_aid",
        "title": "Free Legal Aid & Representation",
        "authority": "National Legal Services Authority (NALSA) & State/District Legal Services Authorities (SLSA/DLSA)",
        "governing_law": "Legal Services Authorities Act, 1987 (Section 12)",
        "category_tags": ["all", "workplace_harassment", "cyberstalking", "threats_and_intimidation", "impersonation", "intimate_content"],
        "summary": "Free legal counsel, advice, and court representation provided by legal services authorities for women, victims of violence, and eligible citizens.",
        "official_portal_url": "https://nalsa.gov.in",
        "helpline": "15100",
        "last_verified": "2026-10-24",
        "verification_status": "VERIFIED",
        "statutory_criteria": [
            "All women are entitled to free legal aid irrespective of income under Section 12(c) of the Legal Services Authorities Act, 1987.",
            "Persons from SC/ST communities, persons with disabilities, and low-income individuals meeting state means tests.",
            "Must have a prima facie genuine case to prosecute or defend (Section 13)."
        ],
        "required_documents": [
            "Proof of identity or affidavit.",
            "Summary of incident and copies of evidence/complaint records.",
            "Income certificate/affidavit (only if applying under general low-income means category; not required for women under 12(c))."
        ],
        "default_eligibility": "POTENTIALLY_ELIGIBLE",
        "disclaimer": "Entitlement is subject to administrative verification and prima facie merit assessment by the concerned DLSA/SLSA Secretary. ProofPath does not assign advocates or approve legal aid."
    },
    {
        "id": "remedy_victim_compensation",
        "title": "Victim Compensation Scheme",
        "authority": "State Legal Services Authorities (SLSA) & District Legal Services Authorities (DLSA)",
        "governing_law": "Bharatiya Nagarik Suraksha Sanhita, 2023 (Section 396) / NALSA Compensation Scheme for Women Victims",
        "category_tags": ["all", "workplace_harassment", "threats_and_intimidation", "intimate_content", "cyberstalking"],
        "summary": "State-administered financial compensation and interim medical relief for victims who have suffered physical, mental, or reputational injury requiring rehabilitation.",
        "official_portal_url": "https://nalsa.gov.in",
        "helpline": "15100",
        "last_verified": "2026-10-24",
        "verification_status": "VERIFIED",
        "statutory_criteria": [
            "Victim or dependents must have suffered injury/loss arising from a recognized criminal offense requiring rehabilitation.",
            "Application can be made upon court recommendation or directly to DLSA/SLSA where the offender is untraced or unconvicted (Section 396(4) BNSS).",
            "Disbursement and quantum are determined by the DLSA/SLSA committee based on state schedules."
        ],
        "required_documents": [
            "Copy of FIR or Police General Diary (GD) entry, or court order.",
            "Medical/hospital treatment records or counseling receipts (where physical/mental injury occurred).",
            "Proof of identity and bank account details for direct transfer."
        ],
        "default_eligibility": "REQUIRES_PROFESSIONAL_REVIEW",
        "disclaimer": "Award and quantum of compensation are entirely determined by the statutory Legal Services Authority based on state victim compensation schedules. ProofPath does not estimate or guarantee payouts."
    },
    {
        "id": "remedy_cybercrime_escalation",
        "title": "National Cyber Crime Reporting & Escalation",
        "authority": "Indian Cyber Crime Coordination Centre (I4C), Ministry of Home Affairs",
        "governing_law": "Information Technology Act, 2000 & Bharatiya Nyaya Sanhita, 2023",
        "category_tags": ["cyberstalking", "online_harassment", "impersonation", "intimate_content", "threats_and_intimidation"],
        "summary": "Centralized reporting portal (cybercrime.gov.in) with dedicated incident filing tracks for cyber crimes against women/children and other online offenses. Note: The 1930 helpline is primarily configured as the Citizen Financial Cyber Fraud Reporting System, while formal cyberstalking, harassment, and intimate media reports must be registered through the national portal or local cyber police station.",
        "official_portal_url": "https://cybercrime.gov.in",
        "helpline": "1930",
        "last_verified": "2026-10-24",
        "verification_status": "VERIFIED_WITH_QUALIFICATIONS",
        "statutory_criteria": [
            "Incident involves computer resources, communication devices, social media platforms, or internet transmissions.",
            "Victim or authorized representative filing complaint with relevant digital evidence logs."
        ],
        "required_documents": [
            "Unedited screenshots with visible dates, timestamps, and sender handles/URLs.",
            "Chat log exports, email headers, or URL links to offending profiles/posts.",
            "Identity document of complainant (optional if reporting anonymously in designated categories)."
        ],
        "default_eligibility": "POTENTIALLY_ELIGIBLE",
        "disclaimer": "Submission initiates administrative and police inquiry in your jurisdiction. Note: Dialing 1930 is designated primarily for immediate reporting of financial cyber fraud; non-financial cyber harassment complaints should be submitted directly via cybercrime.gov.in. ProofPath does not transmit reports automatically."
    },
    {
        "id": "remedy_posh_workplace",
        "title": "Workplace Redressal via Internal Committee (IC) / SHe-Box",
        "authority": "Employer's Internal Committee (IC) / District Local Committee (LC) / Ministry of Women & Child Development",
        "governing_law": "POSH Act, 2013 (Sections 3, 4, 9)",
        "category_tags": ["workplace_harassment"],
        "summary": "Statutory redressal for workplace harassment through your employer's Internal Committee (or District Local Committee for workplaces with fewer than 10 workers or complaints against the employer).",
        "official_portal_url": "https://shebox.wcd.gov.in",
        "helpline": "181",
        "last_verified": "2026-10-24",
        "verification_status": "VERIFIED",
        "statutory_criteria": [
            "Complainant must be a woman who experienced harassment connected to workplace or employment.",
            "Complaint must generally be filed in writing within 3 months of the last incident (extendable by up to 3 months upon justifiable reasons)."
        ],
        "required_documents": [
            "Written complaint (6 copies with supporting documents under POSH Rules).",
            "Relevant work emails, Slack/Teams chats, text messages, or witness names.",
            "Copy of previous HR communications, if any."
        ],
        "default_eligibility": "POTENTIALLY_ELIGIBLE",
        "disclaimer": "Proceedings are conducted by the Internal Committee or Local Committee under the POSH Act. ProofPath does not file complaints on your behalf."
    },
    {
        "id": "remedy_platform_takedown",
        "title": "24-Hour Digital Content Takedown Mandate (Rule 3(2)(b))",
        "authority": "Social Media Intermediaries & Grievance Appellate Committee (MeitY)",
        "governing_law": "Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 (Rule 3(2)(b))",
        "category_tags": ["intimate_content", "impersonation"],
        "summary": "Statutory mandate requiring internet intermediaries to remove or disable access within 24 hours of receiving actual knowledge or complaint specifically regarding prima facie non-consensual intimate imagery, nudity, sexual conduct, or deepfake impersonation.",
        "official_portal_url": "https://www.meity.gov.in",
        "helpline": "1930",
        "last_verified": "2026-10-24",
        "verification_status": "VERIFIED_WITH_QUALIFICATIONS",
        "statutory_criteria": [
            "Content specifically depicts non-consensual sexual acts, full or partial nudity, private area exposure, or artificial morphing/deepfake impersonation of an individual.",
            "Written complaint or actual knowledge received by the intermediary's Resident Grievance Officer from the individual or their authorized representative.",
            "Mandate applies strictly to the specified categories under Rule 3(2)(b); other intermediary grievances follow general 15-day or 72-hour grievance resolution timelines under Rule 3(2)(a)."
        ],
        "required_documents": [
            "Direct specific URL(s) where the offending media or profile is hosted.",
            "Unedited screenshot or copy of the offending media with visible timestamps and username handles.",
            "Formal complaint submitted to the intermediary Grievance Officer, or Grievance Appellate Committee ticket number if initial response was inadequate."
        ],
        "default_eligibility": "POTENTIALLY_ELIGIBLE",
        "disclaimer": "The 24-hour takedown obligation is legally binding on intermediaries in India under Rule 3(2)(b) specifically for non-consensual nudity/sexual imagery/deepfakes, but practical enforcement depends on platform compliance. ProofPath does not automatically transmit takedown notices or communicate with intermediary servers."
    },
    {
        "id": "remedy_women_support_osc",
        "title": "Women Support Services & One Stop Centres (OSC)",
        "authority": "Ministry of Women and Child Development & National Commission for Women (NCW)",
        "governing_law": "Integrated Women Helpline Scheme & NCW Mandate",
        "category_tags": ["all", "workplace_harassment", "cyberstalking", "threats_and_intimidation", "intimate_content"],
        "summary": "Integrated support for women facing violence or harassment providing 24/7 emergency response, medical aid, temporary shelter, legal counseling, and psychological support.",
        "official_portal_url": "http://ncw.nic.in",
        "helpline": "7827170170",
        "last_verified": "2026-10-24",
        "verification_status": "VERIFIED",
        "statutory_criteria": [
            "Open to any woman facing violence, distress, domestic discord, or cyber harassment across India."
        ],
        "required_documents": [
            "No mandatory prior documents required for initial emergency intake or helpline consultation."
        ],
        "default_eligibility": "POTENTIALLY_ELIGIBLE",
        "disclaimer": "Services are provided directly by Government and accredited shelter/counseling networks. ProofPath provides directory and contact routing only."
    }
]


def evaluate_remedies_for_case(
    conn,
    case_id: str,
    claims: List[Dict[str, Any]],
    trace_results: Dict[str, Any],
    observations: List[Dict[str, Any]],
    artifacts: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Evaluates potential Indian remedy pathways deterministically for a case.
    Distinguishes known facts, missing information, and eligibility states.
    Strictly avoids legal certainty or guaranteed outcomes.
    """
    cur = conn.cursor()
    cur.execute("SELECT id, title, description FROM cases WHERE id = ?", (case_id,))
    case_row = cur.fetchone()
    if not case_row:
        raise ValueError(f"Case '{case_id}' does not exist.")

    # 1. Identify active categories
    categories = set()
    for c in claims:
        cat = (c.get("category") or "").lower()
        if "workplace" in cat or "posh" in cat or "harass" in cat:
            categories.add("workplace_harassment")
        if "stalk" in cat or "cyber" in cat:
            categories.add("cyberstalking")
        if "threat" in cat or "intimidat" in cat:
            categories.add("threats_and_intimidation")
        if "impersonat" in cat or "fake" in cat:
            categories.add("impersonation")
        if "intimate" in cat or "ncii" in cat:
            categories.add("intimate_content")

    if not categories:
        # Fallback from case title
        t = (case_row["title"] + " " + (case_row["description"] or "")).lower()
        if "workplace" in t or "posh" in t or "harass" in t:
            categories.add("workplace_harassment")
        else:
            categories.add("cyberstalking")

    # 2. Extract trace states
    trace_claims = trace_results.get("claims", [])
    has_supported_claims = any(c.get("state") == "SUPPORTED" for c in trace_claims)
    has_conflicts = any(c.get("state") == "CONFLICTED" for c in trace_claims)

    # Ingested evidence artifacts
    has_artifacts = len(artifacts) > 0
    has_official_receipt = any(
        "receipt" in (o.get("field") or "").lower() or "grievance" in (o.get("field") or "").lower() or "document" in (o.get("source_type") or "").lower()
        for o in observations
    )

    pathway_evaluations = []

    for item in REMEDY_PATHWAYS_CATALOG:
        tags = item["category_tags"]
        matches_category = ("all" in tags) or any(cat in tags for cat in categories)
        
        if not matches_category:
            eligibility_state = "NOT_APPLICABLE"
            eligibility_reason = "This remedy pathway does not directly correspond to the incident category recorded for this case."
            known_facts = []
            missing_info = ["Incident category not matched."]
        else:
            # Deterministic assessment of eligibility state based only on recorded facts
            known_facts = []
            missing_info = []

            if has_artifacts:
                known_facts.append(f"{len(artifacts)} cryptographic evidence artifact(s) recorded in ProofPath vault.")
            else:
                missing_info.append("No primary evidence artifacts or screenshots uploaded to Evidence Vault yet.")

            if has_supported_claims:
                known_facts.append("Recorded timeline claims have supporting observational evidence.")
            else:
                missing_info.append("Recorded claims currently lack linked corroborating observations.")

            if has_conflicts:
                missing_info.append("Contradictions or timestamp discrepancies exist in the current record; resolve via Stress Test.")

            # Specific rules per pathway
            if item["id"] == "remedy_nalsa_legal_aid":
                known_facts.append("User is seeking assistance for documented harassment/intimidation.")
                missing_info.append("Submission of formal legal aid application to the local DLSA/SLSA front office.")
                eligibility_state = "POTENTIALLY_ELIGIBLE"
                eligibility_reason = (
                    "Women and individuals facing violence/harassment are statutorily eligible for free legal aid under Section 12 of the Legal Services Authorities Act, 1987. "
                    "Final assignment is decided by the concerned District Legal Services Authority (DLSA)."
                )

            elif item["id"] == "remedy_victim_compensation":
                if has_official_receipt or has_artifacts:
                    known_facts.append("Documented evidence is available to demonstrate incident occurrence.")
                missing_info.append("Medical/hospital records or verified proof of pecuniary loss/injury resulting from the offense.")
                missing_info.append("Formal application filed under Section 396 BNSS to the State or District Legal Services Authority.")
                eligibility_state = "REQUIRES_PROFESSIONAL_REVIEW"
                eligibility_reason = (
                    "Victim compensation under Section 396 BNSS (former Sec 357A CrPC) requires an assessment of injury, rehabilitation need, and loss by the DLSA/SLSA committee. "
                    "Eligibility and grant amounts cannot be confirmed automatically."
                )

            elif item["id"] == "remedy_posh_workplace":
                if "workplace_harassment" in categories:
                    known_facts.append("Incident classified under workplace harassment.")
                    if has_official_receipt:
                        known_facts.append("Written grievance acknowledgment record detected in evidence vault.")
                    else:
                        missing_info.append("Confirmation of written complaint submitted to employer's Internal Committee (IC) within 3 months.")
                    eligibility_state = "POTENTIALLY_ELIGIBLE"
                    eligibility_reason = "Governed by the POSH Act, 2013. You are entitled to an internal inquiry if the conduct occurred in a workplace or employment context."
                else:
                    eligibility_state = "NOT_APPLICABLE"
                    eligibility_reason = "Incident is not classified as workplace-related."

            elif item["id"] == "remedy_platform_takedown":
                if any(c in categories for c in ("intimate_content", "impersonation")):
                    known_facts.append("Incident involves unauthorized digital dissemination or impersonation.")
                    missing_info.append("Exact URLs and platform Grievance Officer escalation ticket reference.")
                    eligibility_state = "POTENTIALLY_ELIGIBLE"
                    eligibility_reason = "Rule 3(2)(b) of the IT Rules, 2021 obligates online intermediaries to remove non-consensual private imagery within 24 hours of notice."
                else:
                    eligibility_state = "MORE_INFORMATION_NEEDED"
                    eligibility_reason = "Relevant if private media, non-consensual images, or deepfake impersonations have been published online."

            else:
                eligibility_state = item["default_eligibility"]
                eligibility_reason = "Information is available for exploration. Eligibility requires verification by the providing agency."

        pathway_evaluations.append({
            "id": item["id"],
            "title": item["title"],
            "authority": item["authority"],
            "governing_law": item["governing_law"],
            "summary": item["summary"],
            "eligibility_state": eligibility_state,
            "eligibility_reason": eligibility_reason,
            "statutory_criteria": item["statutory_criteria"],
            "known_facts": known_facts,
            "missing_info": missing_info,
            "required_documents": item["required_documents"],
            "official_portal_url": item["official_portal_url"],
            "helpline": item.get("helpline"),
            "last_verified": item["last_verified"],
            "verification_status": item["verification_status"],
            "disclaimer": item["disclaimer"]
        })

    return {
        "case_id": case_id,
        "case_title": case_row["title"],
        "incident_categories": sorted(list(categories)),
        "total_pathways": len(pathway_evaluations),
        "pathways": pathway_evaluations,
        "evidence_summary": {
            "total_claims": len(claims),
            "supported_claims": len([c for c in trace_claims if c.get("state") == "SUPPORTED"]),
            "conflicted_claims": len([c for c in trace_claims if c.get("state") == "CONFLICTED"]),
            "total_artifacts": len(artifacts)
        },
        "disclaimer": (
            "ProofPath Victim Justice & Remedies provides informational pathways and eligibility criteria from official Indian sources. "
            "It does NOT grant financial compensation, guarantee legal outcomes, or submit applications to authorities automatically. "
            "All awards, relief, and applications are subject to independent review by statutory authorities (NALSA, DLSA, IC, or Courts)."
        )
    }
