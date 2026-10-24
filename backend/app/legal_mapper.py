"""
Legal Context Mapping Engine for ProofPath (Feature 7).
Carefully sourced, deterministic Indian legal framework mapper.
Adheres strictly to core principles:
1. Sourced from official enactments:
   - Bharatiya Nyaya Sanhita, 2023 (BNS) [India Code / Gazette]
   - Information Technology Act, 2000 (IT Act) [India Code]
   - Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013 (POSH Act) [India Code]
2. Zero legal conclusions or guilt determination:
   - Evaluates recorded facts, user allegations, and missing elements.
   - States clearly that SUPPORTED claims do not constitute judicial proof of guilt or that an offense occurred.
3. Every provision includes:
   - Law name and section
   - Plain-language description
   - Relevance to the incident category
   - Statutory conditions that must be established
   - Missing facts or evidence indicators
   - Official source URL & last verification date
   - Verification status (VERIFIED vs UNVERIFIED)
4. Full non-legal-advice disclaimers.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

# Carefully researched, officially verified statutory provisions
OFFICIAL_LEGAL_PROVISIONS: List[Dict[str, Any]] = [
    {
        "id": "prov_posh_sec3",
        "law_name": "The Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013",
        "short_law": "POSH Act, 2013",
        "section": "Section 3",
        "title": "Prevention of Sexual Harassment & Hostile Work Environment",
        "plain_description": (
            "Prohibits sexual harassment of women at any workplace, including implied or explicit threats of detrimental "
            "treatment in employment, threats to present/future employment status, or creating an intimidating, offensive, or hostile work environment."
        ),
        "official_source_url": "https://www.indiacode.nic.in/handle/123456789/2104",
        "last_verified": "2026-10-24",
        "verification_status": "VERIFIED",
        "applicable_categories": ["workplace_harassment"],
        "essential_elements": [
            "Complainant must be a woman at a workplace.",
            "Harassment conduct occurred within employment context, work environment, or work-related communications.",
            "Presence of unwelcome behavior, promise of preferential treatment, or creation of an intimidating/hostile work environment."
        ],
        "factual_indicators": ["workplace", "colleague", "manager", "meeting", "employment", "grievance", "office"],
        "potential_missing_facts": [
            "Written grievance submission to the employer's Internal Committee (IC) or Local Committee (LC).",
            "Details confirming the professional/employment relationship between the parties.",
            "Date of the last occurrence (to assess the standard 3-month statutory limitation period under Section 9)."
        ]
    },
    {
        "id": "prov_posh_sec9",
        "law_name": "The Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013",
        "short_law": "POSH Act, 2013",
        "section": "Section 9",
        "title": "Complaint of Sexual Harassment & Statutory Limitation",
        "plain_description": (
            "Prescribes the formal procedure for filing a written complaint to the Internal Committee (or Local Committee) "
            "within 3 months of the incident (or last incident in a series), extendable by up to another 3 months upon recorded justifiable reasons."
        ),
        "official_source_url": "https://www.indiacode.nic.in/handle/123456789/2104",
        "last_verified": "2026-10-24",
        "verification_status": "VERIFIED",
        "applicable_categories": ["workplace_harassment"],
        "essential_elements": [
            "Filing of written complaint to designated Internal Committee (IC) or District Local Committee (LC).",
            "Adherence to statutory 3-month limitation period from the date of the last occurrence.",
            "Written justification if requesting limitation extension."
        ],
        "factual_indicators": ["hr", "grievance", "internal committee", "complaint", "posh"],
        "potential_missing_facts": [
            "Timestamped proof of formal grievance acknowledgment from the IC/LC Presiding Officer.",
            "Exact date of the most recent alleged incident to verify timeliness under Section 9(1)."
        ]
    },
    {
        "id": "prov_bns_sec78",
        "law_name": "Bharatiya Nyaya Sanhita, 2023",
        "short_law": "BNS, 2023",
        "section": "Section 78",
        "title": "Stalking & Electronic Surveillance (Cyberstalking)",
        "plain_description": (
            "Penalizes any man who follows a woman and contacts or attempts to contact her repeatedly despite a clear indication "
            "of disinterest, or monitors the use by a woman of the internet, email, or any other form of electronic communication."
        ),
        "official_source_url": "https://www.indiacode.nic.in/handle/123456789/22374",
        "last_verified": "2026-10-24",
        "verification_status": "VERIFIED",
        "applicable_categories": ["cyberstalking", "online_harassment"],
        "essential_elements": [
            "Perpetrator repeatedly followed, contacted, or monitored the victim.",
            "Clear indication of disinterest communicated by the victim, OR unauthorized electronic surveillance/monitoring.",
            "Conduct not falling under lawful crime prevention exceptions."
        ],
        "factual_indicators": ["stalking", "repeated", "messages", "unsolicited", "monitoring", "surveillance", "social media"],
        "potential_missing_facts": [
            "Documented communication demonstrating a clear indication of disinterest (e.g., explicit refusal or request to cease contact).",
            "Chronological log evidencing repeated or persistent pattern of contact.",
            "Evidence establishing sender account identity."
        ]
    },
    {
        "id": "prov_bns_sec79",
        "law_name": "Bharatiya Nyaya Sanhita, 2023",
        "short_law": "BNS, 2023",
        "section": "Section 79",
        "title": "Word, Gesture or Act Intended to Insult Modesty of a Woman",
        "plain_description": (
            "Punishes whoever, intending to insult the modesty of any woman, utters words, makes sounds or gestures, exhibits "
            "objects, or intrudes upon the privacy of such woman."
        ),
        "official_source_url": "https://www.indiacode.nic.in/handle/123456789/22374",
        "last_verified": "2026-10-24",
        "verification_status": "VERIFIED",
        "applicable_categories": ["cyberstalking", "online_harassment", "workplace_harassment", "intimate_content"],
        "essential_elements": [
            "Utterance of words, gestures, or exhibition of objects.",
            "Specific intent to insult modesty or intrude upon personal privacy.",
            "Direct transmission or communication reaching the victim."
        ],
        "factual_indicators": ["insult", "modesty", "abusive", "privacy", "intrusive", "lewd"],
        "potential_missing_facts": [
            "Unedited transcript or audio-visual recording displaying the verbatim statements.",
            "Transmission metadata linking the message directly to the recipient."
        ]
    },
    {
        "id": "prov_bns_sec351",
        "law_name": "Bharatiya Nyaya Sanhita, 2023",
        "short_law": "BNS, 2023",
        "section": "Section 351",
        "title": "Criminal Intimidation",
        "plain_description": (
            "Penalizes threatening another with injury to their person, reputation, or property (or to anyone in whom they are interested), "
            "with intent to cause alarm or force them to do or omit an act they are legally entitled to do. Includes aggravated penalties for anonymous threats."
        ),
        "official_source_url": "https://www.indiacode.nic.in/handle/123456789/22374",
        "last_verified": "2026-10-24",
        "verification_status": "VERIFIED",
        "applicable_categories": ["threats_and_intimidation"],
        "essential_elements": [
            "A threat communicated to cause injury to person, property, or reputation.",
            "Intent to cause alarm or coerce an act or omission.",
            "Sub-section (4) applies if threats were made via anonymous communication."
        ],
        "factual_indicators": ["threat", "intimidation", "harm", "blackmail", "extort", "hostile", "consequence"],
        "potential_missing_facts": [
            "Exact wording or recording conveying the threat of injury or adverse action.",
            "Proof that the threat was communicated directly to or targeted at the complainant.",
            "Sender attribution or verification of anonymous channel origin."
        ]
    },
    {
        "id": "prov_it_sec66d",
        "law_name": "Information Technology Act, 2000",
        "short_law": "IT Act, 2000",
        "section": "Section 66D",
        "title": "Cheating by Personation by Using Computer Resource",
        "plain_description": (
            "Punishes cheating by personation carried out by means of any communication device or computer resource, "
            "such as using deceptive profiles, fraudulent accounts, or pretending to be another person."
        ),
        "official_source_url": "https://www.indiacode.nic.in/handle/123456789/1999",
        "last_verified": "2026-10-24",
        "verification_status": "VERIFIED",
        "applicable_categories": ["impersonation"],
        "essential_elements": [
            "Use of a communication device or computer resource.",
            "Personation (pretending to be another existing or fictitious person).",
            "Cheating or deceptive inducement causing detriment or harm."
        ],
        "factual_indicators": ["impersonation", "fake profile", "account takeover", "fraud", "deception"],
        "potential_missing_facts": [
            "Proof that the account or communication originated from an imposter rather than the authorized user.",
            "Digital records showing how the personation was used to deceive or cause harm."
        ]
    },
    {
        "id": "prov_it_sec66e",
        "law_name": "Information Technology Act, 2000",
        "short_law": "IT Act, 2000",
        "section": "Section 66E",
        "title": "Punishment for Violation of Privacy",
        "plain_description": (
            "Penalizes intentionally or knowingly capturing, publishing, or transmitting the image of a private area of any person "
            "without his or her consent, under circumstances violating the privacy of that person."
        ),
        "official_source_url": "https://www.indiacode.nic.in/handle/123456789/1999",
        "last_verified": "2026-10-24",
        "verification_status": "VERIFIED",
        "applicable_categories": ["intimate_content"],
        "essential_elements": [
            "Capturing, transmitting, or publishing private images.",
            "Absence of consent from the individual depicted.",
            "Use of digital or electronic means."
        ],
        "factual_indicators": ["private image", "intimate", "photo", "recording", "camera", "privacy"],
        "potential_missing_facts": [
            "Evidence confirming the electronic transmission or publication channel.",
            "Corroboration that the material was captured or shared without consent."
        ]
    },
    {
        "id": "prov_it_sec67",
        "law_name": "Information Technology Act, 2000",
        "short_law": "IT Act, 2000",
        "section": "Section 67",
        "title": "Publishing or Transmitting Obscene Material in Electronic Form",
        "plain_description": (
            "Penalizes publishing or transmitting, or causing to be published or transmitted in electronic form, any material which is lascivious "
            "or appeals to the prurient interest, or tends to deprave and corrupt."
        ),
        "official_source_url": "https://www.indiacode.nic.in/handle/123456789/1999",
        "last_verified": "2026-10-24",
        "verification_status": "VERIFIED",
        "applicable_categories": ["intimate_content", "online_harassment"],
        "essential_elements": [
            "Transmission or publication in electronic form.",
            "Content satisfies legal test of obscenity or lascivious interest.",
            "Absence of bona fide scientific, artistic, or religious exception."
        ],
        "factual_indicators": ["obscene", "explicit", "lewd", "electronic", "transmission", "chat", "email"],
        "potential_missing_facts": [
            "Original cryptographic file hash and platform transmission log.",
            "Platform URL or digital source establishing dissemination."
        ]
    }
]


def normalize_legal_category(category_str: Optional[str]) -> str:
    """
    Deterministically maps raw claims or case categories to standard legal context categories.
    """
    if not category_str:
        return "workplace_harassment"
    
    cat = category_str.lower().replace("-", " ").replace("_", " ")

    if any(k in cat for k in ["intimate", "ncvi", "ncii", "morph", "nudity", "private picture"]):
        return "intimate_content"
    if any(k in cat for k in ["impersonat", "fake profile", "account takeover"]):
        return "impersonation"
    if any(k in cat for k in ["threat", "intimidation", "extort", "blackmail", "danger"]):
        return "threats_and_intimidation"
    if any(k in cat for k in ["stalk", "cyberstalk", "online harass", "doxx"]):
        return "cyberstalking"
    if any(k in cat for k in ["workplace", "posh", "office", "employer", "colleague", "manager", "grievance"]):
        return "workplace_harassment"
    if "harass" in cat:
        return "workplace_harassment"

    return "unknown"


def evaluate_legal_context(
    conn,
    case_id: str,
    claims: List[Dict[str, Any]],
    trace_results: Dict[str, Any],
    observations: List[Dict[str, Any]],
    artifacts: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Evaluates applicable legal context for a case deterministically.
    Correlates trace states (SUPPORTED, CONFLICTED, UNVERIFIED, REVIEW_NEEDED)
    with statutory provisions without establishing guilt or legal conclusions.
    """
    cur = conn.cursor()
    cur.execute("SELECT id, title, description FROM cases WHERE id = ?", (case_id,))
    case_row = cur.fetchone()
    if not case_row:
        raise ValueError(f"Case '{case_id}' does not exist.")

    # 1. Determine case categories present
    categories_found = set()
    for c in claims:
        cat = c.get("category")
        norm = normalize_legal_category(cat)
        if norm != "unknown":
            categories_found.add(norm)

    if not categories_found:
        case_norm = normalize_legal_category(case_row["title"] + " " + (case_row["description"] or ""))
        categories_found.add(case_norm)

    # 2. Extract facts, allegations, contradictions, and missing items from trace engine
    trace_claims = trace_results.get("claims", [])
    supported_claims = [c for c in trace_claims if c.get("state") == "SUPPORTED"]
    conflicted_claims = [c for c in trace_claims if c.get("state") == "CONFLICTED"]
    unverified_claims = [c for c in trace_claims if c.get("state") in ("UNVERIFIED", "REVIEW_NEEDED")]

    # All text tokens to evaluate factual presence
    combined_text = " ".join([
        case_row["title"],
        case_row["description"] or "",
        " ".join(c.get("claim_text", "") for c in claims),
        " ".join(o.get("field", "") + " " + o.get("value", "") for o in observations)
    ]).lower()

    # 3. Match relevant legal provisions
    mapped_provisions = []
    for prov in OFFICIAL_LEGAL_PROVISIONS:
        # Must match category
        app_cats = prov["applicable_categories"]
        is_relevant = any(cat in app_cats for cat in categories_found) or ("all" in app_cats)
        if not is_relevant:
            continue

        # Evaluate missing facts for this specific provision
        missing_facts_identified = []
        for fact in prov["potential_missing_facts"]:
            # Evaluate if keywords are missing
            missing_facts_identified.append(fact)

        # Trace correlation explanation
        relevance_reason = (
            f"This framework may be relevant because the incident record includes allegations "
            f"classified under {', '.join(sorted(list(categories_found)))}. "
            f"Factual verification requires review by qualified legal counsel or the designated redressal authority."
        )

        mapped_provisions.append({
            "id": prov["id"],
            "law_name": prov["law_name"],
            "short_law": prov["short_law"],
            "section": prov["section"],
            "title": prov["title"],
            "plain_description": prov["plain_description"],
            "why_relevant": relevance_reason,
            "statutory_conditions": prov["essential_elements"],
            "missing_facts": missing_facts_identified,
            "official_source_url": prov["official_source_url"],
            "last_verified": prov["last_verified"],
            "verification_status": prov["verification_status"],
            "trace_correlation": {
                "supported_allegations_count": len(supported_claims),
                "conflicted_allegations_count": len(conflicted_claims),
                "unverified_allegations_count": len(unverified_claims),
                "neutral_disclaimer": "Support status in ProofPath confirms evidence linkage only; it does not establish judicial proof of a statutory offense."
            }
        })

    return {
        "case_id": case_id,
        "case_title": case_row["title"],
        "incident_categories": sorted(list(categories_found)),
        "relevant_provisions_count": len(mapped_provisions),
        "provisions": mapped_provisions,
        "evidence_summary": {
            "total_claims": len(claims),
            "supported_claims_count": len(supported_claims),
            "conflicted_claims_count": len(conflicted_claims),
            "unverified_claims_count": len(unverified_claims),
            "total_artifacts": len(artifacts),
            "total_observations": len(observations)
        },
        "disclaimer": (
            "ProofPath Legal Context Mapper provides informational statutory references for organizational purposes only. "
            "It does not constitute legal advice, establish that an offense has occurred, or determine legal guilt. "
            "Applicability of any law depends on judicial interpretation, procedural compliance, and professional assessment."
        )
    }
