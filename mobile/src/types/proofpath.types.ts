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
}

export interface Observation {
  id: string;
  evidenceId: string;
  text: string;
  recordedAt: string;
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
