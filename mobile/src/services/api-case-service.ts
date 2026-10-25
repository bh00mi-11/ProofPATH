import { Platform } from 'react-native';
import Constants from 'expo-constants';
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
  // If explicitly configured in environment, use it
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    const configured = process.env.EXPO_PUBLIC_API_BASE_URL.replace(/\/+$/, '');
    // If in a browser on a phone/LAN IP, don't let a localhost env var break the connection
    if (typeof window !== 'undefined' && window.location && window.location.hostname) {
      const host = window.location.hostname;
      if (host !== 'localhost' && host !== '127.0.0.1' && configured.includes('localhost')) {
        return `http://${host}:8000`;
      }
    }
    return configured;
  }
  // Deployed Expo web builds reverse-proxy /api through Vercel to the Render API.
  // Never request insecure http://<host>:8000 from an HTTPS site.
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    if (window.location.hostname.endsWith('.vercel.app')) return window.location.origin;
    return `http://${window.location.hostname}:8000`;
  }
  // On a physical phone, localhost points to the phone, not the development computer.
  // Expo's LAN host identifies the computer running Metro during local development.
  const expoHost = Constants.expoConfig?.hostUri || Constants.expoGoConfig?.debuggerHost;
  if (__DEV__ && expoHost) {
    const host = expoHost.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') return `http://${host}:8000`;
  }
  // Production native builds must reach the public backend, never the device's localhost.
  if (!__DEV__) return 'https://proofpath-v2l4.onrender.com';
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

export let activeAuthToken: string | null = null;
export function setAuthToken(token: string | null) { activeAuthToken = token; }

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
        ...(activeAuthToken ? { Authorization: `Bearer ${activeAuthToken}` } : {}),
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      let detail = `Server responded with status ${res.status}`;
      try {
        const body = await res.json();
        if (body.detail) {
          detail = typeof body.detail === 'object' ? JSON.stringify(body.detail) : String(body.detail);
        }
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
  createClaim: (caseId: string, text: string, category?: string) => Promise<Claim>;
  createObservation: (caseId: string, field: string, value: string, artifactId?: string) => Promise<Observation>;
  uploadEvidence: (caseId: string, file: { uri: string; name: string; type: string }) => Promise<Evidence>;
  runScenario: (caseId: string, excludedEvidenceIds: string[]) => Promise<ScenarioResult>;
  runStressTest: (caseId?: string) => Promise<import('@/types/proofpath.types').StressTestResult>;
  getNavigator: (caseId?: string) => Promise<import('@/types/proofpath.types').NavigatorData>;
  toggleChecklistItem: (caseId: string, actionKey: string, completed: boolean, title?: string) => Promise<{ status: string; completed: boolean }>;
  getAccountabilityTimeline: (caseId?: string) => Promise<import('@/types/proofpath.types').AccountabilityTimeline>;
  addAccountabilityEntry: (caseId: string, payload: {
    action_type: string;
    description: string;
    user_event_time: string;
    status?: string;
    organization?: string;
    artifact_id?: string;
    reference_number?: string;
    next_follow_up_date?: string;
  }) => Promise<{ status: string; entry: import('@/types/proofpath.types').AccountabilityEntry }>;
  recordStatusTransition: (caseId: string, payload: {
    new_status: string;
    reason: string;
    user_event_time: string;
    organization?: string;
    artifact_id?: string;
    reference_number?: string;
    next_follow_up_date?: string;
  }) => Promise<{ status: string; entry: import('@/types/proofpath.types').AccountabilityEntry }>;
  completeFollowUp: (caseId: string, entryId: string, payload: {
    completion_note: string;
    completion_time: string;
  }) => Promise<{ status: string; follow_up_completed: boolean; historical_entry: import('@/types/proofpath.types').AccountabilityEntry }>;
  getLegalContext: (caseId?: string) => Promise<import('@/types/proofpath.types').LegalContextResult>;
  getRemedies: (caseId?: string) => Promise<import('@/types/proofpath.types').RemediesResult>;
  getArtifactContent: (artifactId: string, caseId?: string) => Promise<{ status: string; artifact_id: string; filename: string; file_type: string; is_text: boolean; content: string | null; message?: string; sha256: string; file_size: number }>;
  proposeObservations: (artifactId: string, caseId?: string) => Promise<{ status: string; artifact_id: string; filename: string; proposed: import('@/types/proofpath.types').ObservationProposal[]; message?: string }>;
  linkClaimObservation: (caseId: string, claimId: string, observationId: string, relation?: 'SUPPORTS' | 'CONTRADICTS' | 'CONTEXT') => Promise<{ status: string; link: { id: string; claim_id: string; observation_id: string; relation: string } }>;
  unlinkClaimObservation: (caseId: string, claimId: string, observationId: string) => Promise<{ status: string }>;
  exportPdf: (caseId: string, recipient: RecipientType, confirmedConfig: boolean, redactedTerms?: string[], includeAccountability?: boolean) => Promise<Blob>;
} = {
  async runStressTest(caseId: string = 'case_demo_01') {
    return request<import('@/types/proofpath.types').StressTestResult>(`/api/cases/${encodeURIComponent(caseId)}/stress-test`);
  },

  async getLegalContext(caseId: string = 'case_demo_01') {
    return request<import('@/types/proofpath.types').LegalContextResult>(`/api/cases/${encodeURIComponent(caseId)}/legal-context`);
  },

  async getRemedies(caseId: string = 'case_demo_01') {
    return request<import('@/types/proofpath.types').RemediesResult>(`/api/cases/${encodeURIComponent(caseId)}/remedies`);
  },

  async getNavigator(caseId: string = 'case_demo_01') {
    return request<import('@/types/proofpath.types').NavigatorData>(`/api/cases/${encodeURIComponent(caseId)}/navigator`);
  },

  async toggleChecklistItem(caseId: string, actionKey: string, completed: boolean, title?: string) {
    return request<{ status: string; completed: boolean }>(`/api/cases/${encodeURIComponent(caseId)}/checklist/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action_key: actionKey, completed, title }),
    });
  },

  async getAccountabilityTimeline(caseId: string = 'case_demo_01') {
    return request<import('@/types/proofpath.types').AccountabilityTimeline>(`/api/cases/${encodeURIComponent(caseId)}/accountability`);
  },

  async addAccountabilityEntry(caseId: string, payload: {
    action_type: string;
    description: string;
    user_event_time: string;
    status?: string;
    organization?: string;
    artifact_id?: string;
    reference_number?: string;
    next_follow_up_date?: string;
  }) {
    return request<{ status: string; entry: import('@/types/proofpath.types').AccountabilityEntry }>(
      `/api/cases/${encodeURIComponent(caseId)}/accountability/entries`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );
  },

  async recordStatusTransition(caseId: string, payload: {
    new_status: string;
    reason: string;
    user_event_time: string;
    organization?: string;
    artifact_id?: string;
    reference_number?: string;
    next_follow_up_date?: string;
  }) {
    return request<{ status: string; entry: import('@/types/proofpath.types').AccountabilityEntry }>(
      `/api/cases/${encodeURIComponent(caseId)}/accountability/status`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );
  },

  async completeFollowUp(caseId: string, entryId: string, payload: {
    completion_note: string;
    completion_time: string;
  }) {
    return request<{ status: string; follow_up_completed: boolean; historical_entry: import('@/types/proofpath.types').AccountabilityEntry }>(
      `/api/cases/${encodeURIComponent(caseId)}/accountability/entries/${encodeURIComponent(entryId)}/complete-follow-up`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );
  },

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
      sha256: a.sha256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      fileSize: a.file_size,
    }));

    const observations: Observation[] = (data.observations || []).map((o) => ({
      id: o.id,
      evidenceId: o.artifact_id || 'manual_entry',
      field: o.field,
      value: o.value,
      sourceType: o.source_type,
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

  async getArtifactContent(artifactId: string, caseId?: string) {
    const q = caseId ? `?case_id=${encodeURIComponent(caseId)}` : '';
    return request<{ status: string; artifact_id: string; filename: string; file_type: string; is_text: boolean; content: string | null; message?: string; sha256: string; file_size: number }>(
      `/api/artifacts/${encodeURIComponent(artifactId)}/content${q}`
    );
  },

  async proposeObservations(artifactId: string, caseId?: string) {
    const q = caseId ? `?case_id=${encodeURIComponent(caseId)}` : '';
    return request<{ status: string; artifact_id: string; filename: string; proposed: import('@/types/proofpath.types').ObservationProposal[]; message?: string }>(
      `/api/artifacts/${encodeURIComponent(artifactId)}/propose-observations${q}`
    );
  },

  async linkClaimObservation(caseId: string, claimId: string, observationId: string, relation: 'SUPPORTS' | 'CONTRADICTS' | 'CONTEXT' = 'SUPPORTS') {
    return request<{ status: string; link: { id: string; claim_id: string; observation_id: string; relation: string } }>(
      '/api/claim-links',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ case_id: caseId, claim_id: claimId, observation_id: observationId, relation }),
      }
    );
  },

  async unlinkClaimObservation(caseId: string, claimId: string, observationId: string) {
    return request<{ status: string }>(
      '/api/claim-links',
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ case_id: caseId, claim_id: claimId, observation_id: observationId }),
      }
    );
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

  async runTimeMachineScenario(excludedEvidenceIds: string[], caseId: string = 'case_demo_01'): Promise<ScenarioResult> {
    return this.runScenario(caseId, excludedEvidenceIds);
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

  async createClaim(caseId: string, text: string, category: string = 'Incident Observation'): Promise<Claim> {
    const data = await request<{ status: string; claim: { id: string; case_id: string; claim_text: string; incident_time?: string; category?: string; status: string } }>('/api/claims', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ case_id: caseId, claim_text: text, category }),
    });
    return {
      id: data.claim.id,
      text: data.claim.claim_text,
      status: 'UNVERIFIED',
      supportingObservationIds: [],
      conflictingObservationIds: [],
      explanation: 'Newly recorded claim awaiting observation correlation.',
    };
  },

  async createObservation(caseId: string, field: string, value: string, artifactId?: string): Promise<Observation> {
    const data = await request<{ status: string; observation: { id: string; case_id: string; artifact_id?: string; field: string; value: string; source_type: string; status: string } }>('/api/observations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ case_id: caseId, artifact_id: artifactId, field, value, source_type: 'manual_observation' }),
    });
    return {
      id: data.observation.id,
      evidenceId: data.observation.artifact_id || '',
      text: `${data.observation.field}: ${data.observation.value}`,
      recordedAt: new Date().toISOString(),
    };
  },

  async uploadEvidence(caseId: string, file: any): Promise<Evidence> {
    const formData = new FormData();
    let appendFile: any = file;

    // Web handling: If file is an asset with a blob: or data: uri or raw file
    if (file && file.file instanceof Blob) {
      appendFile = file.file;
      formData.append('file', appendFile, file.name || 'uploaded_artifact');
    } else if (file instanceof Blob || (typeof File !== 'undefined' && file instanceof File)) {
      formData.append('file', file, (file as any).name || 'uploaded_artifact');
    } else if (typeof window !== 'undefined' && file && file.uri && (file.uri.startsWith('blob:') || file.uri.startsWith('data:'))) {
      // In web browser, fetch the blob from the object/data URL
      const blobRes = await fetch(file.uri);
      const blob = await blobRes.blob();
      formData.append('file', blob, file.name || 'uploaded_artifact');
    } else if (file && file.uri) {
      // React Native Mobile
      formData.append('file', {
        uri: file.uri,
        name: file.name || 'uploaded_artifact',
        type: file.type || 'application/octet-stream',
      } as any);
    } else {
      formData.append('file', file);
    }

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
      sha256: data.artifact.sha256,
      fileSize: data.artifact.file_size,
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
          ...(activeAuthToken ? { Authorization: `Bearer ${activeAuthToken}` } : {}),
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

      const arrayBuffer = await res.arrayBuffer();
      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        throw new ApiError('Received empty PDF payload from server', 500);
      }

      // Validate PDF signature magic bytes (%PDF-)
      const headerBytes = new Uint8Array(arrayBuffer.slice(0, 5));
      const headerString = String.fromCharCode(...headerBytes);
      if (headerString !== '%PDF-') {
        throw new ApiError('Invalid PDF format returned from server (missing %PDF- header)', 500);
      }

      return new Blob([arrayBuffer], { type: 'application/pdf' });
    } catch (err: any) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(`Network error exporting PDF: ${err.message || err}`, 0);
    } finally {
      clearTimeout(timeoutId);
    }
  },
};
