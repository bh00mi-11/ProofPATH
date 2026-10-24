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
  getEvidence(caseId: string): Promise<Evidence[]>;
  getObservations(caseId: string): Promise<Observation[]>;
  getClaims(caseId: string): Promise<Claim[]>;
  runScenario(caseId: string, excludedEvidenceIds: string[]): Promise<ScenarioResult>;
  getDisclosurePreview(
    recipient: RecipientType,
    includedFields: string[],
  ): Promise<DisclosurePreview>;
}
