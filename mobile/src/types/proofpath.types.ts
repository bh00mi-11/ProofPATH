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
  type: 'image' | 'document' | 'transcript' | 'url' | 'session' | string;
  ingestedAt: string;
  integrity: 'MATCH' | 'MISMATCH' | 'NOT_CHECKED';
  sha256?: string;
  fileSize?: number;
}

export interface Observation {
  id: string;
  evidenceId: string;
  text: string;
  recordedAt: string;
  field?: string;
  value?: string;
  sourceType?: string;
}

export interface Claim {
  id: string;
  text: string;
  status: ClaimStatus;
  supportingObservationIds: string[];
  conflictingObservationIds: string[];
  explanation: string;
  category?: string;
  incidentTime?: string;
}

export interface ClaimChange {
  claimId: string;
  before: ClaimStatus;
  after: ClaimStatus;
  reason: string;
  claimText?: string;
  baselineSupporting?: string[];
  scenarioSupporting?: string[];
}

export interface ScenarioResult {
  scenarioId: string;
  excludedEvidenceIds: string[];
  changes: ClaimChange[];
  claims?: Claim[];
  baselineClaims?: Claim[];
  affectedClaimsCount?: number;
}

export interface DisclosurePreview {
  recipient: RecipientType;
  includedFields: string[];
  excludedFields: string[];
  warnings: string[];
  canExport: boolean;
  disclaimer?: string;
  includedClaimsCount?: number;
}

export interface IncidentCase {
  id: string;
  title: string;
  description: string;
  createdAt: string;
}
