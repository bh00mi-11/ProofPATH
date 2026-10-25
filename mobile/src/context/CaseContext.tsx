/**
 * Case State Store (React Context)
 * -------------------------------------------------------------
 * Manages in-memory state for:
 * - Selected Incident Case
 * - Temporary Time Machine Evidence Exclusions
 * - Recipient Selection
 * - Included Disclosure Fields
 * - Scenario Result (Time Machine)
 * - Disclosure Preview (Privacy)
 *
 * NOTE: All data is in-memory and clearly labelled as mock demo data.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import {
  IncidentCase,
  Evidence,
  Observation,
  Claim,
  ScenarioResult,
  DisclosurePreview,
  RecipientType,
} from '@/types/proofpath.types';
import { mockCaseService } from '@/services/mock-case-service';
import { apiCaseService } from '@/services/api-case-service';
import { ALL_DISCLOSURE_FIELDS, ICaseService } from '@/services/case-service';

interface CaseContextValue {
  currentCase: IncidentCase | null;
  availableCases: IncidentCase[];
  evidence: Evidence[];
  observations: Observation[];
  claims: Claim[];
  excludedEvidenceIds: string[];
  selectedRecipient: RecipientType;
  includedDisclosureFields: string[];
  scenarioResult: ScenarioResult | null;
  disclosurePreview: DisclosurePreview | null;
  isLoading: boolean;
  backendError: string | null;
  toggleEvidenceExclusion: (evidenceId: string) => Promise<void>;
  restoreOriginalState: () => Promise<void>;
  setSelectedRecipient: (recipient: RecipientType) => Promise<void>;
  toggleDisclosureField: (field: string) => Promise<void>;
  refreshData: (targetCaseId?: string) => Promise<void>;
  selectCase: (caseId: string) => Promise<void>;
  createNewCase: (title: string, description?: string) => Promise<IncidentCase>;
  addClaimToCase: (caseId: string, text: string, category?: string) => Promise<Claim>;
  addObservationToCase: (caseId: string, field: string, value: string, artifactId?: string) => Promise<Observation>;
  uploadEvidenceToCase: (caseId: string, file: any) => Promise<Evidence>;
  linkClaimObservation: (caseId: string, claimId: string, observationId: string, relation?: 'SUPPORTS' | 'CONTRADICTS' | 'CONTEXT') => Promise<void>;
  unlinkClaimObservation: (caseId: string, claimId: string, observationId: string) => Promise<void>;
}

const CaseContext = createContext<CaseContextValue | undefined>(undefined);

export function CaseProvider({ children }: { children: ReactNode }) {
  const [currentCase, setCurrentCase] = useState<IncidentCase | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [excludedEvidenceIds, setExcludedEvidenceIds] = useState<string[]>([]);
  const [selectedRecipient, setSelectedRecipientState] =
    useState<RecipientType>('TRUSTED_CONTACT');
  const [includedDisclosureFields, setIncludedDisclosureFields] = useState<
    string[]
  >([...ALL_DISCLOSURE_FIELDS]);
  const [scenarioResult, setScenarioResult] = useState<ScenarioResult | null>(
    null
  );
  const [disclosurePreview, setDisclosurePreview] =
    useState<DisclosurePreview | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Live backend connection state
  const [backendError, setBackendError] = useState<string | null>(null);

  const [availableCases, setAvailableCases] = useState<IncidentCase[]>([]);
  const [currentCaseId, setCurrentCaseId] = useState<string>('case_demo_01');

  // Initial load and reload of case data
  const refreshData = useCallback(async (targetCaseId?: string) => {
    setIsLoading(true);
    setBackendError(null);
    try {
      const allCases = await apiCaseService.getCases().catch(() => []);
      setAvailableCases(allCases);

      let activeId = targetCaseId || currentCaseId;
      if (!activeId || activeId === 'case_demo_01') {
        if (targetCaseId) {
          activeId = targetCaseId;
        } else if (currentCaseId && allCases.some((c) => c.id === currentCaseId)) {
          activeId = currentCaseId;
        } else if (allCases.length > 0) {
          const nonDemoCases = allCases.filter((c) => c.id !== 'case_demo_01');
          activeId = nonDemoCases.length > 0 ? nonDemoCases[nonDemoCases.length - 1].id : allCases[0].id;
        } else {
          activeId = 'case_demo_01';
        }
      }

      const [fullData, initialScenario, initialPreview] =
        await Promise.all([
          apiCaseService.getFullCase(activeId),
          apiCaseService.runScenario(activeId, []).catch(() => null),
          apiCaseService.getDisclosurePreview(
            selectedRecipient,
            [...ALL_DISCLOSURE_FIELDS],
            activeId
          ).catch(() => null),
        ]);

      setCurrentCase(fullData.case);
      setCurrentCaseId(fullData.case.id);
      setEvidence(fullData.artifacts);
      setObservations(fullData.observations);
      setClaims(fullData.claims);
      setExcludedEvidenceIds([]);
      setScenarioResult(initialScenario);
      setDisclosurePreview(initialPreview);
    } catch (err: any) {
      const errMsg = err?.message || 'Cannot reach ProofPath FastAPI backend at http://localhost:8000';
      setBackendError(errMsg);
      setCurrentCase(null);
      setEvidence([]);
      setObservations([]);
      setClaims([]);
      setScenarioResult(null);
      setDisclosurePreview(null);
    } finally {
      setIsLoading(false);
    }
  }, [currentCaseId, selectedRecipient]);

  const selectCase = useCallback(async (caseId: string) => {
    setCurrentCaseId(caseId);
    await refreshData(caseId);
  }, [refreshData]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Toggle evidence item exclusion in Time Machine
  const toggleEvidenceExclusion = useCallback(
    async (evidenceId: string) => {
      const nextExclusions = excludedEvidenceIds.includes(evidenceId)
        ? excludedEvidenceIds.filter((id) => id !== evidenceId)
        : [...excludedEvidenceIds, evidenceId];

      setExcludedEvidenceIds(nextExclusions);
      try {
        const newScenario = await apiCaseService.runTimeMachineScenario(nextExclusions);
        setScenarioResult(newScenario);
      } catch (err: any) {
        setBackendError(err?.message || 'Scenario calculation failed on backend');
      }
    },
    [excludedEvidenceIds]
  );

  // Restore Time Machine state back to baseline
  const restoreOriginalState = useCallback(async () => {
    setExcludedEvidenceIds([]);
    try {
      const baselineScenario = await apiCaseService.runTimeMachineScenario([]);
      setScenarioResult(baselineScenario);
    } catch (err: any) {
      setBackendError(err?.message || 'Scenario restore failed on backend');
    }
  }, []);

  // Update selected recipient for Privacy Preview
  const setSelectedRecipient = useCallback(
    async (recipient: RecipientType) => {
      setSelectedRecipientState(recipient);
      try {
        const activeId = currentCaseId || currentCase?.id || 'case_demo_01';
        const updatedPreview = await apiCaseService.getDisclosurePreview(
          recipient,
          includedDisclosureFields,
          activeId
        );
        setDisclosurePreview(updatedPreview);
      } catch (err: any) {
        setBackendError(err?.message || 'Privacy disclosure preview failed on backend');
      }
    },
    [currentCase, currentCaseId, includedDisclosureFields]
  );

  // Toggle a field included/excluded for Privacy Preview
  const toggleDisclosureField = useCallback(
    async (field: string) => {
      const nextFields = includedDisclosureFields.includes(field)
        ? includedDisclosureFields.filter((f) => f !== field)
        : [...includedDisclosureFields, field];

      setIncludedDisclosureFields(nextFields);
      try {
        const activeId = currentCaseId || currentCase?.id || 'case_demo_01';
        const updatedPreview = await apiCaseService.getDisclosurePreview(
          selectedRecipient,
          nextFields,
          activeId
        );
        setDisclosurePreview(updatedPreview);
      } catch (err: any) {
        setBackendError(err?.message || 'Field toggle failed on backend');
      }
    },
    [currentCase, currentCaseId, includedDisclosureFields, selectedRecipient]
  );

  const createNewCase = useCallback(
    async (title: string, description: string = ''): Promise<IncidentCase> => {
      setIsLoading(true);
      setBackendError(null);
      try {
        const newCase = await apiCaseService.createCase(title, description);
        setCurrentCaseId(newCase.id);
        setCurrentCase(newCase);
        setEvidence([]);
        setObservations([]);
        setClaims([]);
        setExcludedEvidenceIds([]);
        setAvailableCases((prev) => [...prev.filter((c) => c.id !== newCase.id), newCase]);
        return newCase;
      } catch (err: any) {
        const msg = err?.message || 'Failed to create new case record';
        setBackendError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const addClaimToCase = useCallback(
    async (caseId: string, text: string, category: string = 'Incident Observation'): Promise<Claim> => {
      try {
        const newClaim = await apiCaseService.createClaim(caseId, text, category);
        setClaims((prev) => [...prev, newClaim]);
        return newClaim;
      } catch (err: any) {
        const msg = err?.message || 'Failed to record claim';
        setBackendError(msg);
        throw err;
      }
    },
    []
  );

  const addObservationToCase = useCallback(
    async (caseId: string, field: string, value: string, artifactId?: string): Promise<Observation> => {
      try {
        const newObs = await apiCaseService.createObservation(caseId, field, value, artifactId);
        setObservations((prev) => [...prev, newObs]);
        return newObs;
      } catch (err: any) {
        const msg = err?.message || 'Failed to record observation';
        setBackendError(msg);
        throw err;
      }
    },
    []
  );

  const uploadEvidenceToCase = useCallback(
    async (caseId: string, file: any): Promise<Evidence> => {
      setIsLoading(true);
      try {
        const newEvidence = await apiCaseService.uploadEvidence(caseId, file);
        setEvidence((prev) => [...prev, newEvidence]);
        await refreshData(caseId);
        return newEvidence;
      } catch (err: any) {
        const msg = err?.message || 'Failed to upload evidence artifact';
        setBackendError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [refreshData]
  );

  const linkClaimObservation = useCallback(
    async (caseId: string, claimId: string, observationId: string, relation: 'SUPPORTS' | 'CONTRADICTS' | 'CONTEXT' = 'SUPPORTS') => {
      try {
        await apiCaseService.linkClaimObservation(caseId, claimId, observationId, relation);
        await refreshData(caseId);
      } catch (err: any) {
        const msg = err?.message || 'Failed to link observation to claim';
        setBackendError(msg);
        throw err;
      }
    },
    [refreshData]
  );

  const unlinkClaimObservation = useCallback(
    async (caseId: string, claimId: string, observationId: string) => {
      try {
        await apiCaseService.unlinkClaimObservation(caseId, claimId, observationId);
        await refreshData(caseId);
      } catch (err: any) {
        const msg = err?.message || 'Failed to unlink observation from claim';
        setBackendError(msg);
        throw err;
      }
    },
    [refreshData]
  );

  return (
    <CaseContext.Provider
      value={{
        currentCase,
        availableCases,
        evidence,
        observations,
        claims,
        excludedEvidenceIds,
        selectedRecipient,
        includedDisclosureFields,
        scenarioResult,
        disclosurePreview,
        isLoading,
        backendError,
        toggleEvidenceExclusion,
        restoreOriginalState,
        setSelectedRecipient,
        toggleDisclosureField,
        refreshData,
        selectCase,
        createNewCase,
        addClaimToCase,
        addObservationToCase,
        uploadEvidenceToCase,
        linkClaimObservation,
        unlinkClaimObservation,
      }}>
      {children}
    </CaseContext.Provider>
  );
}

export function useCaseState(): CaseContextValue {
  const context = useContext(CaseContext);
  if (!context) {
    throw new Error('useCaseState must be used within a CaseProvider');
  }
  return context;
}
