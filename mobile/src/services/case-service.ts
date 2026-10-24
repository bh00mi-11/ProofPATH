import type {
  Claim,
  DisclosurePreview,
  Evidence,
  IncidentCase,
  Observation,
  RecipientType,
  ScenarioResult,
} from '@/types/proofpath.types';

export interface CaseService {
  getCases(): Promise<IncidentCase[]>;
  getCase(caseId: string): Promise<{
    case: IncidentCase;
    artifacts: Evidence[];
    observations: Observation[];
    claims: Claim[];
  }>;
  getEvidence(caseId: string): Promise<Evidence[]>;
  getObservations(caseId: string): Promise<Observation[]>;
  getClaims(caseId: string): Promise<Claim[]>;
  createCase(title: string, description?: string): Promise<IncidentCase>;
  uploadEvidence(caseId: string, file: Blob | File | { uri: string; name: string; type: string }): Promise<Evidence>;
  runScenario(caseId: string, excludedEvidenceIds: string[]): Promise<ScenarioResult>;
  getDisclosurePreview(
    recipient: RecipientType,
    includedFields?: string[],
    caseId?: string
  ): Promise<DisclosurePreview>;
  exportPdf(
    caseId: string,
    recipient: RecipientType,
    confirmedConfig: boolean,
    redactedTerms?: string[]
  ): Promise<Blob>;
}
