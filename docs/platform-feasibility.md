# Platform feasibility

Research checked **2026-10-28** against official Apple and Expo documentation. The intended device is an M1 iPad Pro running iPadOS 27.0.1; this is user-provided context, not a tested compatibility claim.

| Capability             | Evidence and boundary                                                                                                                                                                                  | Foundation decision                                                                                                                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Explicit sharing       | Share extensions receive `NSExtensionItem` attachments through `NSItemProvider` when invoked from a host’s system sharing UI. Exported types and selection granularity belong to the host.             | SwiftUI extension accepts one image or plain-text item. Native execution unverified.                                                                                                                              |
| Apple Pencil           | `PKCanvasView` receives input in the app’s own view hierarchy. It provides no documented universal hook into another app’s canvas.                                                                     | Preset selection regions in our preview; no stroke interception.                                                                                                                                                  |
| ScreenCaptureKit       | Apple's current sample requires iOS 27+, presents the system content-sharing picker, and supports full-display or current-app capture. Current docs include preliminary/beta annotations on some APIs. | Technically supported research direction for user-approved capture, but not implemented. Verify exact SDK symbol availability, device behavior, revocation, and background lifetime before promising integration. |
| App Intents            | Exposes an app’s own actions and required parameters to Shortcuts and system experiences.                                                                                                              | Future action entry point; does not imply access to another app’s current selection.                                                                                                                              |
| iPad windowing         | Apple supports user-managed resizable app windows. Apps must adapt to changing dimensions; they do not control the user's multitasking configuration.                                                  | Responsive layout, all orientations, no full-screen opt-out. No claim of arbitrary always-on-top UI.                                                                                                              |
| Document changes       | App sandboxes and explicit sharing bound access. An App Group is for our related apps/extensions, not a way into another developer’s container.                                                        | No host document writes. Future export is user-mediated.                                                                                                                                                          |
| Expo native extensions | Expo documents config plugins that add extension targets. EAS CNG extension credential discovery uses an explicitly experimental configuration field.                                                  | Small owned config plugin, SwiftUI extension independent of React runtime.                                                                                                                                        |

## Official references

- [Apple: Share extension programming](https://developer.apple.com/library/archive/documentation/General/Conceptual/ExtensibilityPG/Share.html)
- [Apple: App extension support and item providers](https://developer.apple.com/documentation/foundation/app-extension-support)
- [Apple: PencilKit](https://developer.apple.com/documentation/pencilkit)
- [Apple: Capturing screen content on iOS](https://developer.apple.com/documentation/screencapturekit/capturing-screen-content-on-ios)
- [Apple: ScreenCaptureKit](https://developer.apple.com/documentation/screencapturekit)
- [Apple: App Intents](https://developer.apple.com/documentation/appintents)
- [Apple: Multitasking](https://developer.apple.com/design/human-interface-guidelines/multitasking)
- [Apple: Migrating away from UIRequiresFullScreen](https://developer.apple.com/documentation/technotes/tn3192-migrating-your-app-from-the-deprecated-uirequiresfullscreen-key)
- [Apple: Shared data and sandboxes](https://developer.apple.com/documentation/technologyoverviews/shared-data)
- [Expo: iOS app extensions](https://docs.expo.dev/build-reference/app-extensions/)

## Claims requiring actual device evidence

Do not label Goodnotes, Notability, KilNotes, or Apple Notes as supported until their current versions are tested. Record the app/version, exported type, how the share sheet is invoked, extension activation, cancellation, and source preservation. A screen-capture frame is pixels, not a semantic selection or a stream of Pencil strokes. OCR and reasoning quality require their own evaluation dataset.
