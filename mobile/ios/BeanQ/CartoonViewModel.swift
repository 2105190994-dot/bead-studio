import Photos
import SwiftUI
import UIKit

@MainActor
final class CartoonViewModel: ObservableObject {
    @Published var sourceImage: UIImage?
    @Published var resultImage: UIImage?
    @Published var modelState: LocalModel = .missing
    @Published var generationProgress = 0.0
    @Published var isGenerating = false
    @Published var message = "先选择一张人物照片"

    private let generator = CartoonGenerator()

    init() {
        Task { modelState = await ModelStore.shared.currentState() }
    }

    var modelReady: Bool {
        if case .ready = modelState { return true }
        return false
    }

    var canGenerate: Bool { sourceImage != nil && modelReady && !isGenerating }

    func selectImage(data: Data) {
        guard let image = UIImage(data: data) else {
            message = "这张图片无法读取"
            return
        }
        sourceImage = image
        resultImage = nil
        generationProgress = 0
        message = "已选择照片，生成时会自动识别人脸"
    }

    func installModel() {
        guard !isBusyInstalling else { return }
        Task {
            do {
                let url = try await ModelStore.shared.install { state in
                    Task { @MainActor in self.modelState = state }
                }
                modelState = .ready(url)
                message = "模型已安装，以后可离线使用"
            } catch {
                modelState = .failed(error.localizedDescription)
                message = error.localizedDescription
            }
        }
    }

    var isBusyInstalling: Bool {
        switch modelState {
        case .downloading, .verifying, .installing: return true
        default: return false
        }
    }

    func generate() {
        guard let sourceImage, case let .ready(resourcesURL) = modelState else { return }
        isGenerating = true
        resultImage = nil
        generationProgress = 0
        message = "正在重新设计人物五官和线条"
        let seed = UInt32.random(in: 0...UInt32.max)
        let generator = self.generator

        Task.detached(priority: .userInitiated) {
            do {
                let result = try generator.generate(
                    source: sourceImage,
                    resourcesURL: resourcesURL,
                    seed: seed
                ) { value in
                    Task { @MainActor in self.generationProgress = value }
                }
                await MainActor.run {
                    self.resultImage = result
                    self.isGenerating = false
                    self.generationProgress = 1
                    self.message = "Q版重绘完成"
                }
            } catch {
                await MainActor.run {
                    self.isGenerating = false
                    self.message = error.localizedDescription
                }
            }
        }
    }

    func saveResult() {
        guard let resultImage else { return }
        PHPhotoLibrary.requestAuthorization(for: .addOnly) { status in
            guard status == .authorized || status == .limited else {
                Task { @MainActor in self.message = "请在系统设置中允许写入相册" }
                return
            }
            UIImageWriteToSavedPhotosAlbum(resultImage, nil, nil, nil)
            Task { @MainActor in self.message = "已保存到相册，可以继续制作拼豆图" }
        }
    }
}
