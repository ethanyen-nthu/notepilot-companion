# Foundation verification — 2026-10-28

## Executed locally on Windows

| Check                               | Result                                                                                                      |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Dependency installation             | Clean npm ci installed 1,356 SDK 58-compatible packages from the lockfile                                   |
| `npx expo install --check`          | Dependencies up to date                                                                                     |
| `npx expo-doctor`                   | 20/20 checks passed                                                                                         |
| TypeScript strict type check        | Passed                                                                                                      |
| ESLint, zero warnings               | Passed                                                                                                      |
| Prettier check                      | Passed                                                                                                      |
| Jest / React Native Testing Library | 16 tests passed across 2 suites                                                                             |
| Domain/provider/reducer coverage    | 100% statements, branches, functions, lines for these selected modules; not whole-app coverage              |
| Xcode plugin fixture                | Target, source, host dependency, embedded extension, settings, idempotence, serialized-project parse passed |
| iOS JavaScript/Hermes export        | Passed; generated `.hbc` bundle, not a compiled iOS application                                             |
| Web static export                   | Passed; study, saved, settings, sitemap, and not-found routes                                               |
| Dependency audit                    | 3 high and 13 low entries in upstream tooling dependency chains; see security document                      |

The initial iOS bundle attempt failed because the sandbox prevented Hermes writing its temporary output. The local export succeeded outside that restriction. No EAS build was used. Expo's iOS prebuild refuses to run on Windows; the plugin was therefore tested against the official SDK 58 Xcode template fixture, without pretending this is native compilation.

## Browser flow

**Story:** select synthetic work → request simulated feedback → explicitly save → dismiss → reload → view saved result → disable local saves → history is removed.

Confirmed in Chrome using the exported app on loopback:

- Three onboarding pages explicitly explain sharing boundaries and simulation.
- Work checking is unavailable until work is included.
- Simulated sign-error feedback corresponds to the selected linear example.
- Save persists across a reload; dismiss removes the temporary response.
- Turning local saves off removes saved explanations; Settings reports zero.
- Provider preference can be selected with clear “not configured” status.
- No browser console errors were recorded during the flow.
- Visual inspection at 1366 × 1024 and 600 × 900: sidebar becomes compact navigation and content stacks in a narrow window.

Evidence: [study preview](images/study-preview.jpg). This is React Native Web evidence, not proof of native accessibility, system extension behavior, or Pencil input.

## Not executed

- Xcode/Swift compilation, iOS Simulator, physical iPad, or Apple Pencil tests.
- Share Extension invocation from Goodnotes, Notability, KilNotes, Apple Notes, or any other host.
- Signing, EAS builds, TestFlight, App Store distribution, paid services, or real AI requests.
- App Intents, ScreenCaptureKit, microphone/voice, OCR, or PDF pipelines.

The Linux quality workflow includes actual native project generation and structural checks. The separate manual macOS workflow is prepared for an unsigned app-and-extension simulator compile; it has not been dispatched. Device checks are listed in [development.md](development.md).
