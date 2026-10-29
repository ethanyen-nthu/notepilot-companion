# Project rules

- This is the independent native `notepilot-companion` repository. Never read, copy, or modify `notepilot-ai` for implementation.
- Use Expo SDK 58, TypeScript strict mode, and Expo Router under `src/app`. Keep domain code outside routes.
- Check versioned official Expo and Apple documentation before adopting platform APIs. Never promise cross-app Pencil interception, automatic selection capture, unrestricted overlays, or unsupported document writes.
- Every demo answer and saved demo explanation must remain visibly simulated. Only synthetic examples belong in fixtures.
- Prefer native Swift/SwiftUI for small system extensions. Native directories are generated; change `native/`, `plugins/`, or app config, not `ios/` or `android/`.
- Install dependencies with `npx expo install`; commit `package-lock.json`. Use `npm ci` in CI.
- Keep provider credentials server-side. No secrets in source, Expo public variables, logs, or AsyncStorage. Live requests require gateway authentication, explicit per-request upload consent, and server ENABLE_PAID_AI=true. Never make paid validation calls without explicit user authorization.
- Temporary responses are not persisted. Honor save opt-out, deletion, cancellation, and storage failures. Add behavior tests for meaningful changes.
- Run `npm run check`, `npm run format:check`, and affected bundle exports. Native plugin changes require fixture tests and generated-project checks on Linux/macOS.
- Report JS exports, native compilation, simulator tests, and physical-device tests separately. Never claim an iPad test without evidence.
- Do not buy signing, trigger paid builds, or dispatch cloud jobs without explicit authorization and quota review. Do not publish to an account other than the user-requested GitHub owner.
- Keep updates concise. Document material limits and tradeoffs in `docs/`.

- Milestone 2: preserve shared/vision.ts contracts, bounded image transport, one-step tutoring, uncertainty feedback, and cancellation. Run mocked gateway tests; never replace imported-image results with demo answers.
