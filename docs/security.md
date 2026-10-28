# Security and privacy boundaries

## Foundation behavior

No provider credentials, backend endpoints, real student data, analytics SDKs, capture permissions, or microphone permissions are implemented. Demonstration answers are deterministic and visibly simulated. Provider preferences persist but live adapters reject every request without calling the network. The synthetic fixtures do not use copyrighted worksheets or student handwriting.

Saved explanations and settings are unencrypted AsyncStorage data. They are suitable only for this synthetic demo. The Save action is explicit; disabling saving removes history and prevents later saves. Storage failures are visible and never represented as successful deletion. OS backups and forensic deletion are not controlled by this foundation.

The extension only receives explicitly shared content, accepts one supported item, limits input size, downsamples images, and retains previews in memory for its session. It does not copy files into an App Group or upload them. It is not an OCR pipeline. Plain text is displayed as text, never HTML or executable instructions.

## Before real student content

- Introduce user-reviewed crops/OCR and explicit per-request upload consent.
- Implement a separately authenticated gateway; store provider secrets server-side. Never put secrets in Git, bundle code, or `EXPO_PUBLIC_*` variables.
- Validate and bound input/output, reject unknown provider/action IDs, add cancellation/timeouts, rate limits, spending controls, and redacted diagnostics.
- Treat handwritten/text content as untrusted task data, not instructions to tools or providers.
- Define retention, deletion, backup, encryption, and revocation semantics before saving real notes.
- Independently review capture/voice permissions, prominent active indicators, and background behavior.

## Dependency audit exception

On 2026-10-28, npm audit reported three high-severity entries stemming from Expo CLI's transitive Zod 3.25.76 dependency ([GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5)). The app's own Zod dependency is 4.6.7. The reported dependency path is `expo → @expo/cli → zod`; it is developer tooling, not our validation module. Do not expose the development server to untrusted networks. Track an upstream compatible CLI fix; do not force downgrade Expo or substitute a new major Zod under the CLI without compatibility testing. This remains an explicit unresolved dependency risk.

The clean installation additionally reports 13 low-severity entries propagated from deepmerge 4.3.1 in Expo configuration and Jest tooling ([GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4)). These are audit dependency entries, not 13 separate root defects. The full count is 16 entries: 3 high and 13 low. The audit proposes incompatible Expo/Jest downgrades for the root paths; no forced downgrade was applied. Review and retest compatible upstream fixes before using untrusted project configuration.
