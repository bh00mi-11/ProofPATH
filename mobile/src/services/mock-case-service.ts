import type { CaseService } from './case-service';
import {
  demoCase,
  demoClaims,
  demoEvidence,
  demoObservations,
  makeDemoDisclosurePreview,
  makeDemoScenario,
} from '@/mocks/demo-case';

export const mockCaseService: CaseService = {
  async getCases() {
    return [demoCase];
  },
  async getEvidence(caseId) {
    return demoEvidence.filter((item) => item.caseId === caseId);
  },
  async getObservations(caseId) {
    const evidenceIds = new Set(demoEvidence.filter((item) => item.caseId === caseId).map((item) => item.id));
    return demoObservations.filter((item) => evidenceIds.has(item.evidenceId));
  },
  async getClaims(caseId) {
    return caseId === demoCase.id ? demoClaims : [];
  },
  async runScenario(caseId, excludedEvidenceIds) {
    return caseId === demoCase.id ? makeDemoScenario(excludedEvidenceIds) : makeDemoScenario([]);
  },
  async getDisclosurePreview(recipient, includedFields) {
    return makeDemoDisclosurePreview(recipient, includedFields);
  },
};
