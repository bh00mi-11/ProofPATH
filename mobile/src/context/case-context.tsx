import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { mockCaseService } from '@/services/mock-case-service';
import type { DisclosurePreview, IncidentCase, RecipientType, ScenarioResult } from '@/types/proofpath.types';
import { demoCase, disclosureFields, makeDemoDisclosurePreview, makeDemoScenario } from '@/mocks/demo-case';

interface CaseContextValue {
  caseId: string;
  cases: IncidentCase[];
  activeCase: IncidentCase;
  excludedEvidenceIds: string[];
  recipient: RecipientType;
  includedFields: string[];
  scenario: ScenarioResult;
  disclosure: DisclosurePreview;
  toggleEvidence(id: string): void;
  restoreOriginalState(): void;
  setRecipient(recipient: RecipientType): void;
  toggleField(field: string): void;
  createCase(title: string, description: string): string;
  selectCase(caseId: string): void;
}

const CaseContext = createContext<CaseContextValue | null>(null);

export function CaseProvider({ children }: { children: ReactNode }) {
  const [cases, setCases] = useState<IncidentCase[]>([demoCase]);
  const [caseId, setCaseId] = useState(demoCase.id);
  const [excludedEvidenceIds, setExcludedEvidenceIds] = useState<string[]>([]);
  const [recipient, setRecipient] = useState<RecipientType>('TRUSTED_CONTACT');
  const [includedFields, setIncludedFields] = useState<string[]>(disclosureFields.slice(0, 3));

  const scenario = useMemo(
    () => makeDemoScenario(excludedEvidenceIds),
    [excludedEvidenceIds],
  );
  const disclosure = useMemo(
    () => makeDemoDisclosurePreview(recipient, includedFields),
    [recipient, includedFields],
  );

  const value = useMemo<CaseContextValue>(
    () => ({
      caseId,
      cases,
      activeCase: cases.find((item) => item.id === caseId) ?? demoCase,
      excludedEvidenceIds,
      recipient,
      includedFields,
      scenario,
      disclosure,
      toggleEvidence(id) {
        setExcludedEvidenceIds((current) =>
          current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
        );
      },
      restoreOriginalState() {
        setExcludedEvidenceIds([]);
      },
      setRecipient,
      selectCase(nextCaseId) {
        setCaseId(nextCaseId);
        setExcludedEvidenceIds([]);
      },
      createCase(title, description) {
        const id = `case_demo_${Date.now()}`;
        const nextCase: IncidentCase = { id, title, description, createdAt: new Date().toISOString() };
        setCases((current) => [nextCase, ...current]);
        setCaseId(id);
        setExcludedEvidenceIds([]);
        return id;
      },
      toggleField(field) {
        setIncludedFields((current) =>
          current.includes(field) ? current.filter((item) => item !== field) : [...current, field],
        );
      },
    }),
    [caseId, cases, excludedEvidenceIds, recipient, includedFields, scenario, disclosure],
  );

  return <CaseContext.Provider value={value}>{children}</CaseContext.Provider>;
}

export function useCaseContext() {
  const context = useContext(CaseContext);
  if (!context) throw new Error('useCaseContext must be used inside CaseProvider');
  return context;
}

export { mockCaseService };
