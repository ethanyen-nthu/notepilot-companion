# Security and privacy boundaries

## Current behavior

See [Milestone 2 trust boundaries](handwriting-intelligence.md) for the implemented consent-based image pipeline, gateway authentication, validation, request limits, cancellation, and remaining production requirements.

The server reads credentials only from its environment and makes no AI request unless `ENABLE_PAID_AI=true`, a model and API key exist, and the personal gateway token is at least 32 characters. Client tokens stay in memory. Requests require explicit per-upload consent. Imported images are never answered by synthetic fixtures.

Live saves contain recognized note text and AI feedback in unencrypted AsyncStorage. Image processing may create temporary local OS cache files. Do not assume forensic deletion, encrypted backups, or provider zero retention. No analytics, microphone, screen capture, or cross-app document access was added. The native Share Extension is still preview-only.

The gateway is a single-user development service, not production authentication or a distributed billing system. Its in-memory quota resets on restart. Do not deploy publicly without the additional controls listed in the milestone document. Exceptions must never be returned with provider keys or image content.

## Dependency audit exception

On 2026-10-28, npm audit reported three high-severity entries stemming from Expo CLI's transitive Zod 3.25.76 dependency ([GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5)). The app's own Zod dependency is 4.6.7. The reported dependency path is `expo → @expo/cli → zod`; it is developer tooling, not our validation module. Do not expose the development server to untrusted networks. Track an upstream compatible CLI fix; do not force downgrade Expo or substitute a new major Zod under the CLI without compatibility testing. This remains an explicit unresolved dependency risk.

The clean installation additionally reports 13 low-severity entries propagated from deepmerge 4.3.1 in Expo configuration and Jest tooling ([GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4)). These are audit dependency entries, not 13 separate root defects. The full count is 16 entries: 3 high and 13 low. The audit proposes incompatible Expo/Jest downgrades for the root paths; no forced downgrade was applied. Review and retest compatible upstream fixes before using untrusted project configuration.
