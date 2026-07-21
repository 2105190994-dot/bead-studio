import CryptoKit
import Foundation
import ZIPFoundation

enum LocalModel: Equatable {
    case missing
    case downloading
    case verifying
    case installing
    case ready(URL)
    case failed(String)
}

enum ModelStoreError: LocalizedError {
    case notEnoughSpace
    case checksumMismatch
    case invalidArchive

    var errorDescription: String? {
        switch self {
        case .notEnoughSpace:
            return "可用空间不足。首次安装模型至少需要约 5 GB 空间。"
        case .checksumMismatch:
            return "模型校验失败，请重新下载。"
        case .invalidArchive:
            return "模型包不完整，找不到图生图所需文件。"
        }
    }
}

actor ModelStore {
    static let shared = ModelStore()

    // Free Core ML image-to-image model. Downloaded once, then reused offline.
    private let archiveURL = URL(string: "https://huggingface.co/coreml-community/coreml-moDi-v1/resolve/main/split-einsum/moDi-v1-pruned_split-einsum.zip?download=true")!
    private let expectedSHA256 = "cb8dcf40d162c35921d621c16ba6e892c1a0276b6e0c7713dfaea0e36971174e"
    private let requiredFreeBytes: Int64 = 5_000_000_000

    private var modelRoot: URL {
        let support = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        return support.appendingPathComponent("BeanQ/Models/QStyle-v1", isDirectory: true)
    }

    func currentState() -> LocalModel {
        if let resources = findResources(in: modelRoot) {
            return .ready(resources)
        }
        return .missing
    }

    func install(_ report: @escaping @Sendable (LocalModel) -> Void) async throws -> URL {
        if let resources = findResources(in: modelRoot) {
            return resources
        }

        try checkFreeSpace()
        report(.downloading)

        let config = URLSessionConfiguration.default
        config.timeoutIntervalForResource = 60 * 60 * 6
        config.waitsForConnectivity = true
        let session = URLSession(configuration: config)
        let (temporaryArchive, response) = try await session.download(from: archiveURL)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw URLError(.badServerResponse)
        }

        report(.verifying)
        guard try sha256(of: temporaryArchive) == expectedSHA256 else {
            throw ModelStoreError.checksumMismatch
        }

        report(.installing)
        let fileManager = FileManager.default
        let parent = modelRoot.deletingLastPathComponent()
        try fileManager.createDirectory(at: parent, withIntermediateDirectories: true)

        let staging = parent.appendingPathComponent("QStyle-v1-installing", isDirectory: true)
        if fileManager.fileExists(atPath: staging.path) {
            try fileManager.removeItem(at: staging)
        }
        try fileManager.createDirectory(at: staging, withIntermediateDirectories: true)
        try fileManager.unzipItem(at: temporaryArchive, to: staging)

        guard findResources(in: staging) != nil else {
            try? fileManager.removeItem(at: staging)
            throw ModelStoreError.invalidArchive
        }
        if fileManager.fileExists(atPath: modelRoot.path) {
            try fileManager.removeItem(at: modelRoot)
        }
        try fileManager.moveItem(at: staging, to: modelRoot)

        guard let resources = findResources(in: modelRoot) else {
            throw ModelStoreError.invalidArchive
        }
        report(.ready(resources))
        return resources
    }

    private func checkFreeSpace() throws {
        let support = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        let values = try support.resourceValues(forKeys: [.volumeAvailableCapacityForImportantUsageKey])
        if let free = values.volumeAvailableCapacityForImportantUsage, free < requiredFreeBytes {
            throw ModelStoreError.notEnoughSpace
        }
    }

    private func sha256(of fileURL: URL) throws -> String {
        let handle = try FileHandle(forReadingFrom: fileURL)
        defer { try? handle.close() }
        var hasher = SHA256()
        while let data = try handle.read(upToCount: 8 * 1_024 * 1_024), !data.isEmpty {
            hasher.update(data: data)
        }
        return hasher.finalize().map { String(format: "%02x", $0) }.joined()
    }

    private func findResources(in root: URL) -> URL? {
        guard FileManager.default.fileExists(atPath: root.path),
              let enumerator = FileManager.default.enumerator(
                at: root,
                includingPropertiesForKeys: [.isDirectoryKey],
                options: [.skipsHiddenFiles]
              ) else { return nil }

        for case let candidate as URL in enumerator {
            guard candidate.lastPathComponent == "VAEEncoder.mlmodelc" else { continue }
            let directory = candidate.deletingLastPathComponent()
            let required = ["TextEncoder.mlmodelc", "VAEDecoder.mlmodelc", "vocab.json", "merges.txt"]
            let hasBaseFiles = required.allSatisfy {
                FileManager.default.fileExists(atPath: directory.appendingPathComponent($0).path)
            }
            let hasUNet = FileManager.default.fileExists(atPath: directory.appendingPathComponent("Unet.mlmodelc").path)
                || (FileManager.default.fileExists(atPath: directory.appendingPathComponent("UnetChunk1.mlmodelc").path)
                    && FileManager.default.fileExists(atPath: directory.appendingPathComponent("UnetChunk2.mlmodelc").path))
            if hasBaseFiles && hasUNet { return directory }
        }
        return nil
    }
}
