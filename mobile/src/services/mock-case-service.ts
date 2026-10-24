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
  async getCase(caseId) {
    const art = demoEvidence.filter((item) => item.caseId === caseId);
    const obs = demoObservations.filter((item) => art.some((a) => a.id === item.evidenceId));
    const claims = caseId === demoCase.id ? demoClaims : [];
    return {
      case: demoCase,
      artifacts: art,
      observations: obs,
      claims,
    };
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
  async createCase(title, description = '') {
    return {
      id: `case_mock_${Date.now()}`,
      title,
      description,
      createdAt: new Date().toISOString(),
    };
  },
  async uploadEvidence(caseId, file) {
    return {
      id: `art_mock_${Date.now()}`,
      caseId,
      name: 'uploaded_artifact.png',
      type: 'image',
      ingestedAt: new Date().toISOString(),
      integrity: 'MATCH',
    };
  },
  async runScenario(caseId, excludedEvidenceIds) {
    return caseId === demoCase.id ? makeDemoScenario(excludedEvidenceIds) : makeDemoScenario([]);
  },
  async getDisclosurePreview(recipient, includedFields) {
    return makeDemoDisclosurePreview(recipient, includedFields ?? []);
  },
  async exportPdf() {
    return new Blob(['%PDF-1.4 Mock disclosure document'], { type: 'application/pdf' });
  },
};
