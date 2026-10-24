import type {
  Claim,
  ClaimChange,
  DisclosurePreview,
  Evidence,
  IncidentCase,
  Observation,
  RecipientType,
  ScenarioResult,
} from '@/types/proofpath.types';

export const demoCase: IncidentCase = {
  id: 'case_demo_01',
  title: 'Workplace message timeline',
  description: 'A fictional example for exploring how records and claims connect.',
  createdAt: '2026-10-23T09:30:00.000Z',
};

export const demoEvidence: Evidence[] = [
  {
    id: 'ev_screen_01',
    caseId: demoCase.id,
    name: 'Message screenshot',
    type: 'image',
    ingestedAt: '2026-10-22T22:00:00.000Z',
    integrity: 'MATCH',
  },
  {
    id: 'ev_call_02',
    caseId: demoCase.id,
    name: 'Follow-up call screenshot',
    type: 'image',
    ingestedAt: '2026-10-22T22:18:00.000Z',
    integrity: 'NOT_CHECKED',
  },
  {
    id: 'ev_chat_03',
    caseId: demoCase.id,
    name: 'Chat transcript',
    type: 'transcript',
    ingestedAt: '2026-10-22T22:26:00.000Z',
    integrity: 'NOT_CHECKED',
  },
  {
    id: 'ev_hr_04',
    caseId: demoCase.id,
    name: 'HR acknowledgement',
    type: 'document',
    ingestedAt: '2026-10-23T10:05:00.000Z',
    integrity: 'MATCH',
  },
  {
    id: 'ev_note_05',
    caseId: demoCase.id,
    name: 'Personal time note',
    type: 'session',
    ingestedAt: '2026-10-23T10:20:00.000Z',
    integrity: 'NOT_CHECKED',
  },
];

export const demoObservations: Observation[] = [
  { id: 'obs_01', evidenceId: 'ev_screen_01', text: 'Screenshot shows a message timestamp of 9:45 PM.', recordedAt: '2026-10-22T21:45:00.000Z' },
  { id: 'obs_02', evidenceId: 'ev_screen_01', text: 'The sender label shown in the screenshot is “Executive X”.', recordedAt: '2026-10-22T21:45:00.000Z' },
  { id: 'obs_03', evidenceId: 'ev_call_02', text: 'Call log screenshot shows a call at 10:10 PM.', recordedAt: '2026-10-22T22:10:00.000Z' },
  { id: 'obs_04', evidenceId: 'ev_chat_03', text: 'Transcript contains a message the user marked for review.', recordedAt: '2026-10-22T21:45:00.000Z' },
  { id: 'obs_05', evidenceId: 'ev_hr_04', text: 'Document text records receipt of a workplace complaint.', recordedAt: '2026-10-23T09:30:00.000Z' },
  { id: 'obs_06', evidenceId: 'ev_note_05', text: 'User-entered note records a different time: 6:00 PM.', recordedAt: '2026-10-22T18:00:00.000Z' },
];

export const demoClaims: Claim[] = [
  {
    id: 'claim_01',
    text: 'A message was recorded on the evening of October 22.',
    status: 'SUPPORTED',
    supportingObservationIds: ['obs_01', 'obs_04'],
    conflictingObservationIds: [],
    explanation: 'Two linked demo observations refer to the message and its time. This status describes the links in this sample only.',
  },
  {
    id: 'claim_02',
    text: 'The displayed sender label is Executive X.',
    status: 'UNVERIFIED',
    supportingObservationIds: ['obs_02'],
    conflictingObservationIds: [],
    explanation: 'The screenshot contains this label. The label alone does not verify who sent the message.',
  },
  {
    id: 'claim_03',
    text: 'The incident time is consistent across the available notes.',
    status: 'CONFLICTED',
    supportingObservationIds: ['obs_01'],
    conflictingObservationIds: ['obs_06'],
    explanation: 'The linked demo records contain different times. Review the original records before drawing conclusions.',
  },
  {
    id: 'claim_04',
    text: 'A workplace complaint receipt is recorded for October 23.',
    status: 'SUPPORTED',
    supportingObservationIds: ['obs_05'],
    conflictingObservationIds: [],
    explanation: 'One linked demo observation records an acknowledgement. This does not confirm any later outcome.',
  },
];

export const demoScenario: ScenarioResult = {
  scenarioId: 'scenario_demo_exclude_screenshot',
  excludedEvidenceIds: ['ev_screen_01'],
  changes: [
    {
      claimId: 'claim_01',
      before: 'SUPPORTED',
      after: 'UNVERIFIED',
      reason: 'In this prepared demo scenario, excluding the screenshot removes one linked observation.',
    },
    {
      claimId: 'claim_03',
      before: 'CONFLICTED',
      after: 'UNVERIFIED',
      reason: 'In this prepared demo scenario, excluding the screenshot removes one side of the recorded time conflict.',
    },
  ],
};

export const demoRecipients: { id: RecipientType; label: string; helper: string }[] = [
  { id: 'TRUSTED_CONTACT', label: 'Trusted contact', helper: 'A short, user-approved summary' },
  { id: 'SUPPORT_ORGANIZATION', label: 'Support organization', helper: 'Selected incident details' },
  { id: 'LEGAL_PROFESSIONAL', label: 'Legal professional', helper: 'A fuller review preview' },
];

export const disclosureFields = [
  'Incident summary',
  'Evidence names',
  'Timeline dates',
  'Observation notes',
  'Exact location',
  'Contact identifiers',
];

export function makeDemoDisclosurePreview(
  recipient: RecipientType,
  includedFields: string[],
): DisclosurePreview {
  const excludedFields = disclosureFields.filter((field) => !includedFields.includes(field));
  return {
    recipient,
    includedFields,
    excludedFields,
    warnings: ['Demo preview only. Backend privacy verification is not connected.'],
    canExport: false,
  };
}

export function makeDemoScenario(excludedEvidenceIds: string[]): ScenarioResult {
  const isPreparedScenario =
    excludedEvidenceIds.length === 1 && excludedEvidenceIds[0] === demoScenario.excludedEvidenceIds[0];
  return {
    scenarioId: isPreparedScenario ? demoScenario.scenarioId : 'scenario_demo_unprepared',
    excludedEvidenceIds,
    changes: isPreparedScenario ? demoScenario.changes : [],
  };
}

export function getClaimChange(claimId: string, changes: ClaimChange[]) {
  return changes.find((change) => change.claimId === claimId);
}
