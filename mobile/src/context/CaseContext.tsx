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
import { ALL_DISCLOSURE_FIELDS } from '@/services/case-service';

interface CaseContextValue {
  currentCase: IncidentCase | null;
  evidence: Evidence[];
  observations: Observation[];
  claims: Claim[];
  excludedEvidenceIds: string[];
  selectedRecipient: RecipientType;
  includedDisclosureFields: string[];
  scenarioResult: ScenarioResult | null;
  disclosurePreview: DisclosurePreview | null;
  isLoading: boolean;
  toggleEvidenceExclusion: (evidenceId: string) => Promise<void>;
  restoreOriginalState: () => Promise<void>;
  setSelectedRecipient: (recipient: RecipientType) => Promise<void>;
  toggleDisclosureField: (field: string) => Promise<void>;
  refreshData: () => Promise<void>;
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

  // Initial load of mock case data
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [caseData, evData, obsData, clmData, initialScenario, initialPreview] =
        await Promise.all([
          mockCaseService.getCase(),
          mockCaseService.getEvidence(),
          mockCaseService.getObservations(),
          mockCaseService.getClaims(),
          mockCaseService.runTimeMachineScenario([]),
          mockCaseService.getDisclosurePreview(
            'TRUSTED_CONTACT',
            [...ALL_DISCLOSURE_FIELDS]
          ),
        ]);

      setCurrentCase(caseData);
      setEvidence(evData);
      setObservations(obsData);
      setClaims(clmData);
      setExcludedEvidenceIds([]);
      setScenarioResult(initialScenario);
      setDisclosurePreview(initialPreview);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
      const newScenario = await mockCaseService.runTimeMachineScenario(
        nextExclusions
      );
      setScenarioResult(newScenario);
    },
    [excludedEvidenceIds]
  );

  // Restore Time Machine state back to baseline
  const restoreOriginalState = useCallback(async () => {
    setExcludedEvidenceIds([]);
    const baselineScenario = await mockCaseService.runTimeMachineScenario([]);
    setScenarioResult(baselineScenario);
  }, []);

  // Update selected recipient for Privacy Preview
  const setSelectedRecipient = useCallback(
    async (recipient: RecipientType) => {
      setSelectedRecipientState(recipient);
      const updatedPreview = await mockCaseService.getDisclosurePreview(
        recipient,
        includedDisclosureFields
      );
      setDisclosurePreview(updatedPreview);
    },
    [includedDisclosureFields]
  );

  // Toggle a field included/excluded for Privacy Preview
  const toggleDisclosureField = useCallback(
    async (field: string) => {
      const nextFields = includedDisclosureFields.includes(field)
        ? includedDisclosureFields.filter((f) => f !== field)
        : [...includedDisclosureFields, field];

      setIncludedDisclosureFields(nextFields);
      const updatedPreview = await mockCaseService.getDisclosurePreview(
        selectedRecipient,
        nextFields
      );
      setDisclosurePreview(updatedPreview);
    },
    [includedDisclosureFields, selectedRecipient]
  );

  return (
    <CaseContext.Provider
      value={{
        currentCase,
        evidence,
        observations,
        claims,
        excludedEvidenceIds,
        selectedRecipient,
        includedDisclosureFields,
        scenarioResult,
        disclosurePreview,
        isLoading,
        toggleEvidenceExclusion,
        restoreOriginalState,
        setSelectedRecipient,
        toggleDisclosureField,
        refreshData,
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
