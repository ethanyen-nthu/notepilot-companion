# Development on Windows and iPad

## Everyday loop

Use Node.js 24 LTS and npm. `npm ci` installs the committed lockfile. Run `npm start` for Expo Go, or `npm run web` for a desktop browser preview. Expo Go must support SDK 58; it cannot load our Swift extension. Do not describe browser checks as iPad tests.

The layout supports narrow windows as well as an iPad landscape workspace. Use touch/Pencil to tap the fixed question or work regions. Choose an action, save or dismiss the simulated answer, and check Saved and Settings. Provider preferences remain inert until a real gateway is configured.

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
