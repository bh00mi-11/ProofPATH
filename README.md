# ProofPath

ProofPath is a women’s-safety hackathon prototype for organizing incident records and giving people control over what they choose to share.

## Project areas

- `backend/` — existing backend prototype and API contract.
- `mobile/` — Expo Router app for the frontend demo. It currently uses fictional, in-memory mock data and does not call the backend.

## Mobile demo scope

The current frontend demonstrates an incident overview, evidence timeline, linked claim review, reversible what-if simulation, privacy preview, and a watermarked sample report preview. Guardian Mode and Support are clearly marked future-work previews.

All records and calculations are illustrative. Integrity flags are mock labels; claim statuses are demo data; the Time Machine is not forensic analysis; and the privacy preview is not legal redaction. No information is uploaded or shared, and report export is disabled.

## Start the mobile app

From the `mobile/` folder, install the dependencies already listed in `package-lock.json`, then start the Expo development server. Choose the web option to preview in a browser, or open the project with a compatible Expo Go app on a phone. The available Expo Go SDK must match this project's SDK.

```sh
npm install
npx expo start
```

## Frontend architecture

- `mobile/src/types/proofpath.types.ts` — shared app-side TypeScript contract.
- `mobile/src/mocks/demo-case.ts` — fictional demo case and prepared simulation.
- `mobile/src/services/` — mock service and disconnected API service boundary.
- `mobile/src/context/case-context.tsx` — session-only screen state.
- `mobile/src/app/` — Expo Router screens.

API integration, persistent storage, evidence ingestion, Guardian Mode, Support directory, and real report export are future work.
