# Development on Windows and iPad

## Everyday loop

Use Node.js 24 LTS and npm. `npm ci` installs the committed lockfile. Run `npm start` for Expo Go, or `npm run web` for a desktop browser preview. Expo Go must support SDK 58; it cannot load our Swift extension. Do not describe browser checks as iPad tests.

The layout supports narrow windows as well as an iPad landscape workspace. Use touch/Pencil to tap the fixed question or work regions. Choose an action, save or dismiss the simulated answer, and check Saved and Settings. OpenAI becomes available for imported images after connecting an explicitly enabled gateway. Demo samples always remain simulated.

## Commands and what they prove

| Command                    | Meaning                                                                          |
| -------------------------- | -------------------------------------------------------------------------------- |
| `npm run check`            | Static analysis and automated JS behavior checks                                 |
| `npm run build:ios:bundle` | Metro compiles iOS JS and assets; no Swift or signing                            |
| `npm run build:web`        | Portable browser preview build                                                   |
| `npm run test:plugin`      | Plugin target generation/idempotence against official Xcode template fixture     |
| `npm run prebuild:ios`     | Native project generation, supported on Linux/macOS; disabled by Expo on Windows |
| `npm run check:native`     | Structural verification of a generated Xcode project                             |
| `npx expo run:ios`         | Actual native compilation and simulator launch on a Mac                          |

Set `EXPO_NO_TELEMETRY=1` if desired. Use `npx expo install <package>` to keep dependencies compatible. Keep generated native files out of Git; update `native/` and `plugins/` instead. The placeholder bundle identifier `com.notepilot.companion` must be changed to an identifier you control before signing; update its `.share` identifier in the EAS extension declaration too.

## Signing and cloud builds

- **No Mac, free Apple Account:** the Expo Go demo is the immediate route. A custom extension cannot be loaded into Expo Go.
- **Mac + free Personal Team:** Xcode supports limited personal device provisioning, with profiles expiring after seven days. Capability availability must be verified; do not assume App Groups are available.
- **EAS simulator profile:** can build on cloud macOS, but needs a Mac simulator to run. No paid Apple membership is required for an unsigned simulator build; EAS quotas still apply.
- **EAS physical device / TestFlight:** appropriate developer membership, app identifiers, and signing are required. Nothing here purchases or provisions them.

Profiles are prepared, not executed:

```powershell
npx eas-cli@latest build --platform ios --profile development-simulator
```

Only run this after choosing to use the service and reviewing its current free quota. Do not dispatch it automatically. The manual `native-ios.yml` workflow likewise needs a compatible macOS/Xcode runner and a quota check. It does not sign, publish, or submit the app.

References: [Expo development builds](https://docs.expo.dev/develop/development-builds/introduction/), [Apple developer accounts and Personal Teams](https://developer.apple.com/help/account/basics/about-your-developer-account).

## Device acceptance checklist (not yet executed)

1. Complete onboarding; exercise all five actions for both examples; verify simulation labels.
2. Tap regions with finger and Pencil, resize to narrow window, rotate, enlarge text, and navigate with VoiceOver.
3. Save/dismiss; relaunch; remove; disable saving; verify deletion survives relaunch.
4. Background the app with a response open; verify the selected dismissal behavior.
5. In a custom build, share one text item and PNG/JPEG from a supporting app. Verify cancel/done, unsupported types, oversized images, multiple items, and repeated invocation.
6. Confirm the extension keeps no attachment files and does not change the host document.
7. Record actual device, OS, Xcode, Expo/client, and source app versions in the verification record.

## Personal gateway setup

Use Node.js 24.13+ and install dependencies with `npm ci`. In PowerShell at the repository root:

```powershell
Copy-Item .env.example .env
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Keep that locally generated value private and put it in `GATEWAY_ACCESS_TOKEN` in `.env`. It is a personal gateway credential, **not** an OpenAI key. Keep `ENABLE_PAID_AI=false` until you explicitly choose to make paid requests. Never paste any credentials into Git, chat, or Expo public config.

To enable real analysis yourself, set `OPENAI_API_KEY` and an `OPENAI_MODEL` that supports image input and Responses structured outputs, review your provider account access/pricing, and set `ENABLE_PAID_AI=true`. The model is deliberately not guessed or hardcoded. Review the request/output limits in `.env.example`.

```powershell
npm run gateway
# In a second terminal:
npm start
```

For a desktop web preview, run `npm run web`; use `http://localhost:8787` in Settings and the exact browser origin in `WEB_ORIGIN` (default `http://localhost:8081`). For an iPad, localhost means the iPad: use your own trusted HTTPS endpoint forwarding to the gateway. Plain LAN HTTP is rejected for gateway credentials. No tunnel, domain, cloud deployment, or paid service is provisioned by this repo. Do not expose this personal gateway as a public multi-user service.

In Settings choose **OpenAI**, enter the gateway origin and access token, and select **Connect gateway**. The connection checks status without sending an image or making a paid model request. It is held only in memory and must be re-entered after restarting the app. Then open **Import my handwritten question**, select a screenshot, crop the question plus work, choose an action, review the crop, and press **Consent and analyze**. Follow-ups ask again. Cancel stops waiting and aborts the request but may not prevent charges for already submitted work.

Without credentials or explicit enablement the server rejects analysis; **Use simulated demo** stays available. Never present a synthetic answer as an answer to imported notes.

`npm run test:gateway` runs isolated loopback HTTP tests with injected provider mocks, no secrets or paid requests. `npm run check` includes this suite. Windows sandbox environments may require permission for loopback test connections.
