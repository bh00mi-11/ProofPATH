/**
 * FICTIONAL DEMO DATA FOR PROOFPATH
 * -------------------------------------------------------------
 * DISCLAIMER: This data is entirely fictional and created solely
 * for frontend demonstration and mock testing purposes.
 * It does not represent real persons, real incidents, or verified
 * legal/cryptographic evidence.
 */

import {
  IncidentCase,
  Evidence,
  Observation,
  Claim,
  ScenarioResult,
} from '@/types/proofpath.types';

export const DEMO_CASE: IncidentCase = {
  id: 'case-demo-01',
  title: 'Unauthorized Building Access Report',
  description:
    'Fictional workplace security dispute regarding an unescorted entry after operating hours.',
  createdAt: '2026-10-22T08:30:00Z',
};

export const DEMO_EVIDENCE: Evidence[] = [
  {
    id: 'ev-01',
    caseId: 'case-demo-01',
    name: 'CCTV Entry Hallway Timestamped Still',
    type: 'image',
    ingestedAt: '2026-10-22T21:45:00Z',
    integrity: 'MATCH',
  },
  {
    id: 'ev-02',
    caseId: 'case-demo-01',
    name: 'Electronic Keycard Access Log (Server Export)',
    type: 'document',
    ingestedAt: '2026-10-22T21:50:00Z',
    integrity: 'MATCH',
  },
  {
    id: 'ev-03',
    caseId: 'case-demo-01',
    name: 'Security Desk Incident Audio Transcript',
    type: 'transcript',
    ingestedAt: '2026-10-22T22:15:00Z',
    integrity: 'MATCH',
  },
  {
    id: 'ev-04',
    caseId: 'case-demo-01',
    name: 'Public Transport Timetable & Route Log',
    type: 'url',
    ingestedAt: '2026-10-22T22:30:00Z',
    integrity: 'NOT_CHECKED',
  },
  {
    id: 'ev-05',
    caseId: 'case-demo-01',
    name: 'Vendor Check-in Terminal Session Snapshot',
    type: 'session',
    ingestedAt: '2026-10-22T22:45:00Z',
    integrity: 'MISMATCH',
  },
];

export const DEMO_OBSERVATIONS: Observation[] = [
  {
    id: 'obs-01',
    evidenceId: 'ev-01',
    text: 'Figure wearing high-visibility jacket captured entering rear loading dock door at 21:42.',
    recordedAt: '2026-10-22T21:46:00Z',
  },
  {
    id: 'obs-02',
    evidenceId: 'ev-02',
    text: 'Keycard ID #4092 assigned to contractor swiped at rear dock exterior reader at 21:41:52.',
    recordedAt: '2026-10-22T21:51:00Z',
  },
  {
    id: 'obs-03',
    evidenceId: 'ev-03',
    text: 'Duty guard stated over intercom that loading dock was locked from inside by 21:30.',
    recordedAt: '2026-10-22T22:16:00Z',
  },
  {
    id: 'obs-04',
    evidenceId: 'ev-04',
    text: 'Contractor bus schedule confirms drop-off at facility perimeter at 21:35.',
    recordedAt: '2026-10-22T22:31:00Z',
  },
  {
    id: 'obs-05',
    evidenceId: 'ev-05',
    text: 'Terminal session timestamp differs from network time by +47 minutes.',
    recordedAt: '2026-10-22T22:46:00Z',
  },
];

export const DEMO_CLAIMS: Claim[] = [
  {
    id: 'claim-01',
    text: 'Contractor accessed loading dock via rear exterior door around 21:42.',
    status: 'SUPPORTED',
    supportingObservationIds: ['obs-01', 'obs-02', 'obs-04'],
    conflictingObservationIds: ['obs-03'],
    explanation:
      'Supported by CCTV image, keycard access log, and perimeter bus timing, despite conflict with guard statement.',
  },
  {
    id: 'claim-02',
    text: 'Loading dock was securely locked from the inside by 21:30.',
    status: 'CONFLICTED',
    supportingObservationIds: ['obs-03'],
    conflictingObservationIds: ['obs-01', 'obs-02'],
    explanation:
      'Intercom statement asserts early lock, but badge swipe and visual CCTV show physical entry at 21:42.',
  },
  {
    id: 'claim-03',
    text: 'Visitor kiosk logged contractor departure before 22:00.',
    status: 'REVIEW_NEEDED',
    supportingObservationIds: [],
    conflictingObservationIds: ['obs-05'],
    explanation:
      'Kiosk session timestamp has an integrity mismatch with network NTP logs; clock drift requires review.',
  },
  {
    id: 'claim-04',
    text: 'Contractor had pre-authorized building escort on site.',
    status: 'UNVERIFIED',
    supportingObservationIds: [],
    conflictingObservationIds: [],
    explanation: 'No log or observation currently demonstrates escort presence.',
  },
];

/**
 * Pre-calculated Scenario Result for initial Time Machine demonstration:
 * Simulates the exclusion of CCTV entry footage (ev-01).
 */
export const DEMO_SCENARIO_RESULT: ScenarioResult = {
  scenarioId: 'scenario-tm-cctv-excluded',
  excludedEvidenceIds: ['ev-01'],
  changes: [
    {
      claimId: 'claim-01',
      before: 'SUPPORTED',
      after: 'CONFLICTED',
      reason:
        'Exclusion of CCTV footage removes visual confirmation; keycard swipe now directly conflicts with guard testimony.',
    },
    {
      claimId: 'claim-02',
      before: 'CONFLICTED',
      after: 'REVIEW_NEEDED',
      reason:
        'Without CCTV visual record, contradiction between electronic log and guard intercom statement requires manual review.',
    },
  ],
};
