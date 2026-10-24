/**
 * Case Service Interface
 * -------------------------------------------------------------
 * Defines typed contract for reading cases, evidence, observations,
 * claims, and running mock Time Machine and Privacy scenarios.
 */

import {
  IncidentCase,
  Evidence,
  Observation,
  Claim,
  ScenarioResult,
  DisclosurePreview,
  RecipientType,
} from '@/types/proofpath.types';

export const ALL_DISCLOSURE_FIELDS = [
  'name',
  'type',
  'ingestedAt',
  'integrity',
  'observations',
  'explanation',
] as const;

export type DisclosureField = (typeof ALL_DISCLOSURE_FIELDS)[number];

export interface ICaseService {
  getCase(caseId?: string): Promise<IncidentCase | null>;
  getEvidence(caseId?: string): Promise<Evidence[]>;
  getObservations(caseId?: string): Promise<Observation[]>;
  getClaims(caseId?: string): Promise<Claim[]>;
  getPreparedScenarioResult(): Promise<ScenarioResult>;
  runTimeMachineScenario(excludedEvidenceIds: string[]): Promise<ScenarioResult>;
  getDisclosurePreview(
    recipient: RecipientType,
    includedFields: string[]
  ): Promise<DisclosurePreview>;
}
