export type ClaimStatus =
  | 'SUPPORTED'
  | 'CONFLICTED'
  | 'UNVERIFIED'
  | 'REVIEW_NEEDED';

export type RecipientType =
  | 'TRUSTED_CONTACT'
  | 'SUPPORT_ORGANIZATION'
  | 'LEGAL_PROFESSIONAL';

export interface Evidence {
  id: string;
  caseId: string;
  name: string;
  type: 'image' | 'document' | 'transcript' | 'url' | 'session';
  ingestedAt: string;
  integrity: 'MATCH' | 'MISMATCH' | 'NOT_CHECKED';
  sha256?: string;
  fileSize?: number;
}

export interface Observation {
  id: string;
  evidenceId: string;
  field?: string;
  value?: string;
  sourceType?: string;
  text: string;
  recordedAt: string;
}

export interface ObservationProposal {
  field: string;
  value: string;
  source_type: string;
  excerpt: string;
  suggested_relation?: 'SUPPORTS' | 'CONTRADICTS' | 'CONTEXT';
}

export interface Claim {
  id: string;
  text: string;
  status: ClaimStatus;
  supportingObservationIds: string[];
  conflictingObservationIds: string[];
  explanation: string;
}

export interface ClaimChange {
  claimId: string;
  before: ClaimStatus;
  after: ClaimStatus;
  reason: string;
}

export interface ScenarioResult {
  scenarioId: string;
  excludedEvidenceIds: string[];
  changes: ClaimChange[];
}

export interface DisclosurePreview {
  recipient: RecipientType;
  includedFields: string[];
  excludedFields: string[];
  warnings: string[];
  canExport: boolean;
}

export interface IncidentCase {
  id: string;
  title: string;
  description: string;
  createdAt: string;
}

export interface StressTestIssue {
  rule: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'WARNING';
  message: string;
  artifact_id?: string;
  observation_id?: string;
  claim_id?: string;
  duplicate_of?: string;
}

export interface StressTestChecklist {
  test: string;
  passed: boolean;
}

export interface StressTestResult {
  status: 'PASSED' | 'WARNINGS_FOUND' | 'FAILED';
  total_issues: number;
  issues: StressTestIssue[];
  checklist: StressTestChecklist[];
}

export interface VerifiedResource {
  id: string;
  name: string;
  organization: string;
  helpline: string;
  url: string;
  scope: string;
  category_tags: string[];
  is_emergency: boolean;
  last_verified: string;
}

export interface ChecklistItem {
  action_key: string;
  title: string;
  description: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  completed: boolean;
  completed_at: string | null;
}

export interface EmergencyShortcut {
  title: string;
  helpline: string;
  dial_url: string;
  advisory: string;
}

export interface NavigatorData {
  case_id: string;
  category: string;
  canonical_name: string;
  summary: string;
  safety_notes: string[];
  checklist_total: number;
  checklist_completed: number;
  checklist: ChecklistItem[];
  verified_resources: VerifiedResource[];
  emergency_shortcut: EmergencyShortcut;
  disclaimer: string;
}

export type CaseProgressStatus =
  | 'NOT_REPORTED'
  | 'SUBMITTED'
  | 'ACKNOWLEDGED'
  | 'UNDER_REVIEW'
  | 'RESOLVED'
  | 'UNKNOWN';

export type AccountabilityActionType =
  | 'REPORT_PREPARED'
  | 'COMPLAINT_SUBMITTED'
  | 'ACKNOWLEDGMENT_RECEIVED'
  | 'FOLLOW_UP_COMPLETED'
  | 'ADDITIONAL_EVIDENCE_SUPPLIED'
  | 'RESPONSE_RECEIVED'
  | 'CASE_STATUS_UPDATED'
  | 'CUSTOM_ACTION';

export interface AccountabilityEntry {
  id: string;
  case_id: string;
  action_type: AccountabilityActionType | string;
  description: string;
  user_event_time: string;
  created_at: string;
  organization?: string | null;
  status: CaseProgressStatus;
  source_classification: 'USER_REPORTED' | 'DOCUMENT_SUPPORTED';
  artifact_id?: string | null;
  linked_artifact?: {
    id: string;
    filename: string;
    sha256?: string;
  } | null;
  artifact_support_unavailable?: boolean;
  reference_number?: string | null;
  next_follow_up_date?: string | null;
  follow_up_completed: boolean;
  follow_up_completed_at?: string | null;
}

export interface PendingFollowUp {
  entry_id: string;
  action_type: string;
  due_date: string;
  is_overdue: boolean;
  organization?: string | null;
  description: string;
}

export interface AccountabilityTimeline {
  case_id: string;
  case_title: string;
  current_recorded_status: CaseProgressStatus;
  last_status_transition?: AccountabilityEntry | null;
  total_entries: number;
  timeline: AccountabilityEntry[];
  pending_follow_ups: PendingFollowUp[];
  honesty_notice: string;
}

export interface LegalProvision {
  id: string;
  law_name: string;
  short_law: string;
  section: string;
  title: string;
  plain_description: string;
  why_relevant: string;
  statutory_conditions: string[];
  missing_facts: string[];
  official_source_url: string;
  last_verified: string;
  verification_status: 'VERIFIED' | 'UNVERIFIED';
  trace_correlation: {
    supported_allegations_count: number;
    conflicted_allegations_count: number;
    unverified_allegations_count: number;
    neutral_disclaimer: string;
  };
}

export interface LegalContextResult {
  case_id: string;
  case_title: string;
  incident_categories: string[];
  relevant_provisions_count: number;
  provisions: LegalProvision[];
  evidence_summary: {
    total_claims: number;
    supported_claims_count: number;
    conflicted_claims_count: number;
    unverified_claims_count: number;
    total_artifacts: number;
    total_observations: number;
  };
  disclaimer: string;
}
export type RemedyEligibilityState =
  | 'POTENTIALLY_ELIGIBLE'
  | 'MORE_INFORMATION_NEEDED'
  | 'NOT_APPLICABLE'
  | 'REQUIRES_PROFESSIONAL_REVIEW';

export interface RemedyPathway {
  id: string;
  title: string;
  authority: string;
  governing_law: string;
  summary: string;
  eligibility_state: RemedyEligibilityState;
  eligibility_reason: string;
  statutory_criteria: string[];
  known_facts: string[];
  missing_info: string[];
  required_documents: string[];
  official_portal_url: string;
  helpline?: string;
  last_verified: string;
  verification_status: 'VERIFIED' | 'UNVERIFIED';
  disclaimer: string;
}

export interface RemediesResult {
  case_id: string;
  case_title: string;
  incident_categories: string[];
  total_pathways: number;
  pathways: RemedyPathway[];
  evidence_summary: {
    total_claims: number;
    supported_claims: number;
    conflicted_claims: number;
    total_artifacts: number;
  };
  disclaimer: string;
}
