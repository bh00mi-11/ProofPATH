import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';

import { apiCaseService, ApiError } from '@/services/api-case-service';
import { mockCaseService } from '@/services/mock-case-service';
import type {
  Claim,
  DisclosurePreview,
  Evidence,
  IncidentCase,
  Observation,
  RecipientType,
  ScenarioResult,
} from '@/types/proofpath.types';
import { demoCase, makeDemoDisclosurePreview, makeDemoScenario } from '@/mocks/demo-case';

interface CaseContextValue {
  caseId: string;
  cases: IncidentCase[];
  activeCase: IncidentCase;
  evidence: Evidence[];
  observations: Observation[];
  claims: Claim[];
  excludedEvidenceIds: string[];
  recipient: RecipientType;
  includedFields: string[];
  scenario: ScenarioResult;
  disclosure: DisclosurePreview;
  loading: boolean;
  error: string | null;
  confirmedExport: boolean;
  refreshCase: () => Promise<void>;
  toggleEvidence: (id: string) => Promise<void>;
  restoreOriginalState: () => Promise<void>;
  setRecipient: (recipient: RecipientType) => void;
  toggleField: (field: string) => void;
  createCase: (title: string, description: string) => Promise<string>;
  selectCase: (caseId: string) => Promise<void>;
  setConfirmedExport: (confirmed: boolean) => void;
  uploadEvidence: (file: any) => Promise<Evidence>;
  exportPdfDocument: (redactedTerms?: string[]) => Promise<Blob>;
}

const CaseContext = createContext<CaseContextValue | null>(null);

export function CaseProvider({ children }: { children: ReactNode }) {
  const [cases, setCases] = useState<IncidentCase[]>([demoCase]);
  const [caseId, setCaseId] = useState<string>(demoCase.id);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [excludedEvidenceIds, setExcludedEvidenceIds] = useState<string[]>([]);
  const [recipient, setRecipientState] = useState<RecipientType>('TRUSTED_CONTACT');
  const [includedFields, setIncludedFields] = useState<string[]>([]);
  const [scenario, setScenario] = useState<ScenarioResult>(() => makeDemoScenario([]));
  const [disclosure, setDisclosure] = useState<DisclosurePreview>(() =>
    makeDemoDisclosurePreview('TRUSTED_CONTACT', [])
  );
  const [confirmedExport, setConfirmedExport] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load cases list and current case from FastAPI backend
  const loadCaseData = useCallback(async (targetCaseId: string) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch available cases list
      try {
        const caseList = await apiCaseService.getCases();
        if (caseList.length > 0) {
          setCases(caseList);
        }
      } catch {
        // Fall back gracefully if /api/cases is still populating
      }

      // 2. Fetch active case details
      const caseDetail = await apiCaseService.getCase(targetCaseId);
      setEvidence(caseDetail.artifacts);
      setObservations(caseDetail.observations);
      setClaims(caseDetail.claims);
      setCases((prev) => {
        const existing = prev.find((c) => c.id === caseDetail.case.id);
        if (existing) return prev;
        return [caseDetail.case, ...prev];
      });

      // 3. Fetch server-side disclosure preview allowlist
      try {
        const prev = await apiCaseService.getDisclosurePreview(recipient, [], targetCaseId);
        setDisclosure(prev);
        setIncludedFields(prev.includedFields);
      } catch (err: any) {
        console.warn('Disclosure preview initial load warning:', err.message);
      }

      // Reset scenario state to clean baseline
      setExcludedEvidenceIds([]);
      setScenario({
        scenarioId: `baseline_${targetCaseId}`,
        excludedEvidenceIds: [],
        changes: [],
        claims: caseDetail.claims,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to connect to ProofPath backend');
    } finally {
      setLoading(false);
    }
  }, [recipient]);

  // Initial mount load
  useEffect(() => {
    loadCaseData(caseId);
  }, []);

  // Update disclosure preview when recipient changes
  useEffect(() => {
    let isCancelled = false;
    async function updatePreview() {
      try {
        const prev = await apiCaseService.getDisclosurePreview(recipient, includedFields, caseId);
        if (!isCancelled) {
          setDisclosure(prev);
          setIncludedFields(prev.includedFields);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message);
        }
      }
    }
    updatePreview();
    return () => {
      isCancelled = true;
    };
  }, [recipient, caseId]);

  // What-If Scenario toggle
  const toggleEvidence = async (id: string) => {
    const nextExcluded = excludedEvidenceIds.includes(id)
      ? excludedEvidenceIds.filter((item) => item !== id)
      : [...excludedEvidenceIds, id];

    setExcludedEvidenceIds(nextExcluded);
    setLoading(true);
    setError(null);

    try {
      const res = await apiCaseService.runScenario(caseId, nextExcluded);
      setScenario(res);
      if (res.claims) {
        setClaims(res.claims);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to simulate scenario on backend');
    } finally {
      setLoading(false);
    }
  };

  // Restore exact original baseline
  const restoreOriginalState = async () => {
    setExcludedEvidenceIds([]);
    setLoading(true);
    setError(null);

    try {
      const res = await apiCaseService.runScenario(caseId, []);
      setScenario(res);
      if (res.claims) {
        setClaims(res.claims);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to restore baseline');
    } finally {
      setLoading(false);
    }
  };

  const setRecipient = (nextRecipient: RecipientType) => {
    setRecipientState(nextRecipient);
    setConfirmedExport(false); // Reset confirmation on profile switch
  };

  const selectCase = async (nextCaseId: string) => {
    setCaseId(nextCaseId);
    setConfirmedExport(false);
    await loadCaseData(nextCaseId);
  };

  const createCase = async (title: string, description: string = ''): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      const newCase = await apiCaseService.createCase(title, description);
      setCases((prev) => [newCase, ...prev]);
      setCaseId(newCase.id);
      await loadCaseData(newCase.id);
      return newCase.id;
    } catch (err: any) {
      setError(err.message || 'Failed to create case on server');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const toggleField = (field: string) => {
    setIncludedFields((current) =>
      current.includes(field) ? current.filter((item) => item !== field) : [...current, field]
    );
  };

  const exportPdfDocument = async (redactedTerms: string[] = []): Promise<Blob> => {
    if (!confirmedExport) {
      throw new ApiError('Explicit confirmation required before generating disclosure report.', 400);
    }
    return await apiCaseService.exportPdf(caseId, recipient, confirmedExport, redactedTerms);
  };

  const uploadEvidence = async (file: any): Promise<Evidence> => {
    setLoading(true);
    setError(null);
    try {
      const art = await apiCaseService.uploadEvidence(caseId, file);
      setEvidence((prev) => [art, ...prev]);
      await loadCaseData(caseId);
      return art;
    } catch (err: any) {
      setError(err.message || 'Evidence upload failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const activeCase: IncidentCase =
    cases.find((item) => item.id === caseId) ?? {
      id: caseId,
      title: 'Current Incident Case',
      description: 'Active incident record',
      createdAt: new Date().toISOString(),
    };

  const value: CaseContextValue = {
    caseId,
    cases,
    activeCase,
    evidence,
    observations,
    claims,
    excludedEvidenceIds,
    recipient,
    includedFields,
    scenario,
    disclosure,
    loading,
    error,
    confirmedExport,
    refreshCase: () => loadCaseData(caseId),
    toggleEvidence,
    restoreOriginalState,
    setRecipient,
    toggleField,
    createCase,
    selectCase,
    setConfirmedExport,
    uploadEvidence,
    exportPdfDocument,
  };

  return <CaseContext.Provider value={value}>{children}</CaseContext.Provider>;
}

export function useCaseContext() {
  const context = useContext(CaseContext);
  if (!context) throw new Error('useCaseContext must be used inside CaseProvider');
  return context;
}

export { apiCaseService, mockCaseService };
