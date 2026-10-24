import type { CaseService } from './case-service';

/** Future integration point. No network calls are made in this prototype. */
export const apiCaseService: CaseService = {
  async getCases() {
    throw new Error('API service is not connected yet.');
  },
  async getEvidence() {
    throw new Error('API service is not connected yet.');
  },
  async getObservations() {
    throw new Error('API service is not connected yet.');
  },
  async getClaims() {
    throw new Error('API service is not connected yet.');
  },
  async runScenario() {
    throw new Error('API service is not connected yet.');
  },
  async getDisclosurePreview() {
    throw new Error('API service is not connected yet.');
  },
};
