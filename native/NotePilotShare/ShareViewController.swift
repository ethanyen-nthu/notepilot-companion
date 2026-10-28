import UIKit
import SwiftUI
import UniformTypeIdentifiers
import ImageIO

@MainActor
final class ShareViewController: UIViewController {
    private var previewHost: UIHostingController<SharePreview>?
    private var loadProgress: Progress?
    private var closed = false

    override func viewDidLoad() {
        super.viewDidLoad()
        show(message: "Loading your shared selection…")
        let providers = (extensionContext?.inputItems as? [NSExtensionItem] ?? []).flatMap { $0.attachments ?? [] }
        guard providers.count == 1, let provider = providers.first else {
            show(message: "Share one image or a plain-text selection at a time.")
            return
        }
        if provider.hasItemConformingToTypeIdentifier(UTType.image.identifier) {
            loadProgress = provider.loadFileRepresentation(forTypeIdentifier: UTType.image.identifier) { [weak self] url, error in
                // The provider's temporary file is valid only inside this callback.
                guard error == nil, let url,
                      let size = try? url.resourceValues(forKeys: [.fileSizeKey]).fileSize,
                      size <= 12 * 1024 * 1024,
                      let source = CGImageSourceCreateWithURL(url as CFURL, nil),
                      let thumbnail = CGImageSourceCreateThumbnailAtIndex(source, 0, [
                        kCGImageSourceCreateThumbnailFromImageAlways: true,
                        kCGImageSourceCreateThumbnailWithTransform: true,
                        kCGImageSourceThumbnailMaxPixelSize: 1600
                      ] as CFDictionary) else {
                    DispatchQueue.main.async { self?.show(message: "Unable to preview this image. Try a PNG or JPEG under 12 MB.") }
                    return
                }
                DispatchQueue.main.async { self?.show(message: "Shared image · preview only", image: UIImage(cgImage: thumbnail)) }
            }
        } else if provider.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) {
            loadProgress = provider.loadItem(forTypeIdentifier: UTType.plainText.identifier, options: nil) { [weak self] item, error in
                let text = item as? String
                DispatchQueue.main.async {
                    guard error == nil, let text, !text.isEmpty, text.utf8.count <= 20_000 else {
                        self?.show(message: "Unable to preview this text. Share plain text under 20 KB.")
                        return
                    }
                    self?.show(message: "Shared text · preview only", text: text)
                }
            }
        } else {
            show(message: "This file type is not supported yet. Share an image or plain text; PDF support is a future milestone.")
        }
    }

    private func show(message: String, image: UIImage? = nil, text: String? = nil) {
        guard !closed else { return }
        let root = SharePreview(message: message, image: image, sharedText: text) { [weak self] in self?.finish() }
        if let previewHost { previewHost.rootView = root; return }
        let host = UIHostingController(rootView: root)
        addChild(host)
        view.addSubview(host.view)
        host.view.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            host.view.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            host.view.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            host.view.topAnchor.constraint(equalTo: view.topAnchor),
            host.view.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
        host.didMove(toParent: self)
        previewHost = host
    }

    private func finish() {
        closed = true
        loadProgress?.cancel()
        previewHost?.view.removeFromSuperview()
        previewHost?.removeFromParent()
        previewHost = nil
        extensionContext?.completeRequest(returningItems: nil)
    }
}

private struct SharePreview: View {
    let message: String
    let image: UIImage?
    let sharedText: String?
    let onDone: () -> Void
    @State private var showDemo = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    Label("Explicit share · on-device preview", systemImage: "hand.raised")
                        .font(.caption).foregroundStyle(.secondary)
                    Text(message).font(.title2.bold())
                    if let image { Image(uiImage: image).resizable().scaledToFit().accessibilityLabel("Image explicitly shared by you") }
                    if let sharedText { Text(sharedText).textSelection(.enabled) }
                    Text("No OCR or AI analysis is connected. This preview is temporary and is not saved or uploaded.")
                        .foregroundStyle(.secondary)
                    Button("Try a separate synthetic example") { showDemo = true }
                        .buttonStyle(.borderedProminent)
                    Text("The example uses 2x + 7 = 19. It does not answer your shared content.")
                        .font(.footnote).foregroundStyle(.secondary)
                }.padding(24)
            }
            .navigationTitle("NotePilot")
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Done", action: onDone) } }
            .sheet(isPresented: $showDemo) { ExtensionDemo() }
        }.tint(Color(red: 0.07, green: 0.42, blue: 0.36))
    }
}

private struct ExtensionDemo: View {
    @Environment(\.dismiss) private var dismiss
    @State private var action = "Hint"
    private let answers = [
        "Explain": "An equation is a balance. Subtract 7 from both sides, then divide both sides by 2.",
        "Solve": "2x + 7 = 19 → 2x = 12 → x = 6. Check: 2(6) + 7 = 19.",
        "Hint": "Which operation undoes adding 7? Apply it to both sides.",
        "Next Step": "Subtract 7 from both sides to get 2x = 12.",
        "Check My Work": "The sample work adds 7 instead of subtracting. Correct it to 2x = 12, so x = 6."
    ]
    var body: some View {
        NavigationStack {
            Form {
                Section("Synthetic example") {
                    Text("2x + 7 = 19").font(.title)
                    Text("Sample work: 2x = 19 + 7; x = 13")
                }
                Section("Choose an action") {
                    Picker("Action", selection: $action) {
                        ForEach(["Explain", "Solve", "Hint", "Next Step", "Check My Work"], id: \.self) { Text($0) }
                    }
                }
                Section("SIMULATED ANSWER · NO AI REQUEST") { Text(answers[action] ?? "") }
            }
            .navigationTitle("Offline demo")
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Dismiss") { dismiss() } } }
        }
    }
}
