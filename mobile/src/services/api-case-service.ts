import { Platform } from 'react-native';
import type { ICaseService } from './case-service';
import type {
  Claim,
  DisclosurePreview,
  Evidence,
  IncidentCase,
  Observation,
  RecipientType,
  ScenarioResult,
} from '@/types/proofpath.types';

function normalizeEvidenceType(typeStr?: string): Evidence['type'] {
  const t = (typeStr || '').toLowerCase();
  if (t.includes('image') || t === 'jpg' || t === 'png' || t === 'jpeg') return 'image';
  if (t.includes('transcript') || t.includes('audio')) return 'transcript';
  if (t.includes('url') || t.includes('link') || t.includes('web')) return 'url';
  if (t.includes('session')) return 'session';
  return 'document';
}

function resolveDefaultApiBase(): string {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL.replace(/\/+$/, '');
  }
  // Android emulator routes host localhost to 10.0.2.2
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  }
  return 'http://localhost:8000';
}

export const API_BASE_URL = resolveDefaultApiBase();

interface BackendCaseResponse {
  case: {
    id: string;
    title: string;
    description?: string;
    created_at?: string;
  };
  artifacts: Array<{
    id: string;
    case_id: string;
    filename: string;
    file_type: string;
    sha256?: string;
    file_size?: number;
    ingested_at?: string;
  }>;
  observations: Array<{
    id: string;
    case_id: string;
    artifact_id: string | null;
    field: string;
    value: string;
    source_type: string;
    status: string;
    created_at?: string;
  }>;
  claims: Array<{
    id: string;
    claim_text: string;
    incident_time?: string;
    category?: string;
    state: 'SUPPORTED' | 'CONFLICTED' | 'UNVERIFIED' | 'REVIEW_NEEDED';
    reason: string;
    active_sources_count?: number;
    supporting_observations?: string[];
    contradicting_observations?: string[];
  }>;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      let detail = `Server responded with status ${res.status}`;
      try {
        const body = await res.json();
        if (body.detail) detail = body.detail;
      } catch {
        // ignore json parse error
      }
      throw new ApiError(detail, res.status);
    }

    return (await res.json()) as T;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new ApiError('Request timed out while connecting to ProofPath backend.', 408);
    }
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(
      `Unable to connect to backend at ${API_BASE_URL}. Ensure the FastAPI server is running. (${err.message || err})`,
      0
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export const apiCaseService: ICaseService & {
  getCases: () => Promise<IncidentCase[]>;
  getFullCase: (caseId?: string) => Promise<{ case: IncidentCase; artifacts: Evidence[]; observations: Observation[]; claims: Claim[] }>;
  createCase: (title: string, description?: string) => Promise<IncidentCase>;
  uploadEvidence: (caseId: string, file: { uri: string; name: string; type: string }) => Promise<Evidence>;
  runScenario: (caseId: string, excludedEvidenceIds: string[]) => Promise<ScenarioResult>;
  exportPdf: (caseId: string, recipient: RecipientType, confirmedConfig: boolean, redactedTerms?: string[]) => Promise<Blob>;
} = {
  async getCases(): Promise<IncidentCase[]> {
    const data = await request<{ cases: Array<{ id: string; title: string; description?: string; created_at?: string }> }>('/api/cases');
    return (data.cases || []).map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description || '',
      createdAt: c.created_at || new Date().toISOString(),
    }));
  },

  async getFullCase(caseId: string = 'case_demo_01') {
    const data = await request<BackendCaseResponse>(`/api/cases/${encodeURIComponent(caseId)}`);

    const incident: IncidentCase = {
      id: data.case.id,
      title: data.case.title,
      description: data.case.description || '',
      createdAt: data.case.created_at || new Date().toISOString(),
    };

    const artifacts: Evidence[] = (data.artifacts || []).map((a) => ({
      id: a.id,
      caseId: a.case_id,
      name: a.filename,
      type: normalizeEvidenceType(a.file_type),
      ingestedAt: a.ingested_at || new Date().toISOString(),
      integrity: 'MATCH',
    }));

    const observations: Observation[] = (data.observations || []).map((o) => ({
      id: o.id,
      evidenceId: o.artifact_id || 'manual_entry',
      text: `${o.field}: ${o.value} (${o.source_type})`,
      recordedAt: o.created_at || new Date().toISOString(),
    }));

    const claims: Claim[] = (data.claims || []).map((c) => ({
      id: c.id,
      text: c.claim_text,
      status: c.state,
      supportingObservationIds: c.supporting_observations || [],
      conflictingObservationIds: c.contradicting_observations || [],
      explanation: c.reason || '',
    }));

    return {
      case: incident,
      artifacts,
      observations,
      claims,
    };
  },

  async getCase(caseId: string = 'case_demo_01'): Promise<IncidentCase | null> {
    try {
      const full = await this.getFullCase(caseId);
      return full.case;
    } catch {
      return null;
    }
  },

  async getEvidence(caseId: string = 'case_demo_01'): Promise<Evidence[]> {
    const res = await this.getFullCase(caseId);
    return res.artifacts;
  },

  async getObservations(caseId: string = 'case_demo_01'): Promise<Observation[]> {
    const res = await this.getFullCase(caseId);
    return res.observations;
  },

  async getClaims(caseId: string = 'case_demo_01'): Promise<Claim[]> {
    const res = await this.getFullCase(caseId);
    return res.claims;
  },

  async getPreparedScenarioResult(): Promise<ScenarioResult> {
    return this.runTimeMachineScenario(['ev-01']);
  },

  async runTimeMachineScenario(excludedEvidenceIds: string[]): Promise<ScenarioResult> {
    return this.runScenario('case_demo_01', excludedEvidenceIds);
  },

  async createCase(title: string, description: string = ''): Promise<IncidentCase> {
    const data = await request<{ status: string; case: { id: string; title: string; description: string; created_at?: string } }>('/api/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description }),
    });
    return {
      id: data.case.id,
      title: data.case.title,
      description: data.case.description || '',
      createdAt: data.case.created_at || new Date().toISOString(),
    };
  },

  async uploadEvidence(caseId: string, file: any): Promise<Evidence> {
    const formData = new FormData();
    formData.append('file', file);

    const data = await request<{ status: string; artifact: { artifact_id: string; filename: string; file_type: string; sha256: string; file_size: number } }>(
      `/api/artifacts/upload?case_id=${encodeURIComponent(caseId)}`,
      {
        method: 'POST',
        body: formData as any,
      }
    );

    return {
      id: data.artifact.artifact_id,
      caseId,
      name: data.artifact.filename,
      type: normalizeEvidenceType(data.artifact.file_type),
      ingestedAt: new Date().toISOString(),
      integrity: 'MATCH',
    };
  },

  async runScenario(caseId: string, excludedEvidenceIds: string[]): Promise<ScenarioResult> {
    // Map excluded evidence artifact IDs into backend overrides
    const overrides = excludedEvidenceIds.map((id) => ({
      target_id: id,
      enabled: false,
      reason: 'Excluded via Evidence Time Machine mobile scenario toggle',
    }));

    const res = await request<{
      status: string;
      scenario_name: string;
      claims: Array<{
        id: string;
        claim_text: string;
        state: 'SUPPORTED' | 'CONFLICTED' | 'UNVERIFIED' | 'REVIEW_NEEDED';
        reason: string;
        supporting_observations?: string[];
        contradicting_observations?: string[];
      }>;
      baseline_claims: Array<{
        id: string;
        claim_text: string;
        state: 'SUPPORTED' | 'CONFLICTED' | 'UNVERIFIED' | 'REVIEW_NEEDED';
        reason: string;
      }>;
      changes: Array<{
        claim_id: string;
        claim_text?: string;
        baseline_state: 'SUPPORTED' | 'CONFLICTED' | 'UNVERIFIED' | 'REVIEW_NEEDED';
        scenario_state: 'SUPPORTED' | 'CONFLICTED' | 'UNVERIFIED' | 'REVIEW_NEEDED';
        reason: string;
        baseline_supporting?: string[];
        scenario_supporting?: string[];
      }>;
      affected_claims_count: number;
    }>('/api/scenarios/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        case_id: caseId,
        scenario_name: 'Mobile What-If Simulation',
        overrides,
      }),
    });

    const changes = (res.changes || []).map((ch) => ({
      claimId: ch.claim_id,
      before: ch.baseline_state,
      after: ch.scenario_state,
      reason: ch.reason,
      claimText: ch.claim_text,
      baselineSupporting: ch.baseline_supporting,
      scenarioSupporting: ch.scenario_supporting,
    }));

    const claims: Claim[] = (res.claims || []).map((c) => ({
      id: c.id,
      text: c.claim_text,
      status: c.state,
      supportingObservationIds: c.supporting_observations || [],
      conflictingObservationIds: c.contradicting_observations || [],
      explanation: c.reason,
    }));

    return {
      scenarioId: `sim_${caseId}_${Date.now()}`,
      excludedEvidenceIds,
      changes,
    };
  },

  async getDisclosurePreview(
    recipient: RecipientType,
    includedFields: string[] = [],
    caseId: string = 'case_demo_01'
  ): Promise<DisclosurePreview> {
    const res = await request<{
      status: string;
      preview: {
        recipient_type: RecipientType;
        approved_fields: string[];
        excluded_fields: string[];
        warnings: string[];
        included_claims_count: number;
        raw_images_excluded: boolean;
        disclaimer?: string;
      };
    }>('/api/disclosure/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        case_id: caseId,
        recipient_type: recipient,
        include_unverified: true,
      }),
    });

    const p = res.preview;
    return {
      recipient: p.recipient_type,
      includedFields: p.approved_fields,
      excludedFields: p.excluded_fields,
      warnings: p.warnings,
      canExport: true,
    };
  },

  async exportPdf(
    caseId: string,
    recipient: RecipientType,
    confirmedConfig: boolean,
    redactedTerms: string[] = []
  ): Promise<Blob> {
    const url = `${API_BASE_URL}/api/export/pdf`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const res = await fetch(url, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/pdf',
        },
        body: JSON.stringify({
          case_id: caseId,
          recipient_type: recipient,
          confirmed_config: confirmedConfig,
          redacted_terms: redactedTerms,
          include_unverified: true,
        }),
      });

      if (!res.ok) {
        let detail = `PDF export failed with status ${res.status}`;
        try {
          const body = await res.json();
          if (body.detail) detail = body.detail;
        } catch {}
        throw new ApiError(detail, res.status);
      }

      return await res.blob();
    } catch (err: any) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(`Network error exporting PDF: ${err.message || err}`, 0);
    } finally {
      clearTimeout(timeoutId);
    }
  },
};
