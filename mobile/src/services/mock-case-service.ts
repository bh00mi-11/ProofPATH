/**
 * Mock Case Service Implementation
 * -------------------------------------------------------------
 * DISCLAIMER: This service returns purely fictional mock demo data
 * and local calculations. It does NOT perform real cryptographic verification,
 * legal evidence analysis, or real privacy disclosure enforcement.
 */

import {
  ICaseService,
  ALL_DISCLOSURE_FIELDS,
} from '@/services/case-service';
import {
  IncidentCase,
  Evidence,
  Observation,
  Claim,
  ScenarioResult,
  DisclosurePreview,
  RecipientType,
} from '@/types/proofpath.types';
import {
  DEMO_CASE,
  DEMO_EVIDENCE,
  DEMO_OBSERVATIONS,
  DEMO_CLAIMS,
  DEMO_SCENARIO_RESULT,
} from '@/mocks/demo-case';

export class MockCaseService implements ICaseService {
  async getCase(_caseId?: string): Promise<IncidentCase | null> {
    return DEMO_CASE;
  }

  async getEvidence(_caseId?: string): Promise<Evidence[]> {
    return [...DEMO_EVIDENCE];
  }

  async getObservations(_caseId?: string): Promise<Observation[]> {
    return [...DEMO_OBSERVATIONS];
  }

  async getClaims(_caseId?: string): Promise<Claim[]> {
    return [...DEMO_CLAIMS];
  }

  async getPreparedScenarioResult(): Promise<ScenarioResult> {
    return DEMO_SCENARIO_RESULT;
  }

  async runTimeMachineScenario(
    excludedEvidenceIds: string[]
  ): Promise<ScenarioResult> {
    // Baseline: No evidence excluded
    if (excludedEvidenceIds.length === 0) {
      return {
        scenarioId: 'scenario-baseline',
        excludedEvidenceIds: [],
        changes: [],
      };
    }

    // Matching exclusion: ev-01 (CCTV Entry Hallway Timestamped Still)
    if (
      excludedEvidenceIds.length === 1 &&
      excludedEvidenceIds[0] === 'ev-01'
    ) {
      return DEMO_SCENARIO_RESULT;
    }

    // Other exclusions: Return empty changes without inventing forensic calculations
    return {
      scenarioId: 'scenario-unprepared',
      excludedEvidenceIds: [...excludedEvidenceIds],
      changes: [],
    };
  }

  async getDisclosurePreview(
    recipient: RecipientType,
    includedFields: string[]
  ): Promise<DisclosurePreview> {
    const excludedFields = ALL_DISCLOSURE_FIELDS.filter(
      (field) => !includedFields.includes(field)
    );

    const warnings: string[] = [];

    if (recipient === 'LEGAL_PROFESSIONAL') {
      if (!includedFields.includes('integrity')) {
        warnings.push(
          '[ILLUSTRATIVE MOCK CHECK] Notice: Legal Professional disclosure is missing cryptographic integrity validation.'
        );
      }
      if (!includedFields.includes('ingestedAt')) {
        warnings.push(
          '[ILLUSTRATIVE MOCK CHECK] Notice: Chain-of-custody ingestion timestamps are excluded from export.'
        );
      }
    } else if (recipient === 'TRUSTED_CONTACT') {
      if (includedFields.includes('integrity')) {
        warnings.push(
          '[ILLUSTRATIVE MOCK CHECK] Note: Technical integrity hashes are included for a personal trusted contact.'
        );
      }
    } else if (recipient === 'SUPPORT_ORGANIZATION') {
      if (!includedFields.includes('explanation')) {
        warnings.push(
          '[ILLUSTRATIVE MOCK CHECK] Note: Contextual claim explanations are omitted for support organization.'
        );
      }
    }

    if (includedFields.length === 0) {
      warnings.push(
        '[ILLUSTRATIVE MOCK CHECK] Alert: All disclosure fields are excluded. Report will contain no item details.'
      );
    }

    return {
      recipient,
      includedFields: [...includedFields],
      excludedFields,
      warnings,
      canExport: includedFields.length > 0,
    };
  }
}

// Singleton export of mock service
export const mockCaseService = new MockCaseService();
