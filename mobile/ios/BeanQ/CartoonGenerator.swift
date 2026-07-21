import CoreML
import StableDiffusion
import UIKit

final class CartoonGenerator {
    static let prompt = "modern disney style, cute Japanese chibi portrait, two dimensional anime illustration, oversized glossy expressive eyes, clean dark line art, simplified rounded face, compact cute proportions, simplified hands, flat pastel colors, soft cel shading, preserve the same people, same hairstyle, same clothes, same pose and composition, polished character design"

    static let negativePrompt = "photorealistic, realistic skin texture, photo, 3d render, extra person, extra fingers, fused hands, deformed hands, asymmetrical eyes, crossed eyes, duplicate face, text, watermark, logo, blurry, noisy, low quality"

    func generate(
        source: UIImage,
        resourcesURL: URL,
        seed: UInt32,
        progress: @escaping (Double) -> Void
    ) throws -> UIImage {
        try autoreleasepool {
            let input = try SmartCropper.prepare(source)
            let modelConfiguration = MLModelConfiguration()
            modelConfiguration.computeUnits = .cpuAndNeuralEngine

            let pipeline = try StableDiffusionPipeline(
                resourcesAt: resourcesURL,
                controlNet: [],
                configuration: modelConfiguration,
                disableSafety: false,
                reduceMemory: true
            )
            defer { pipeline.unloadResources() }
            try pipeline.loadResources()

            var configuration = StableDiffusionPipeline.Configuration(prompt: Self.prompt)
            configuration.negativePrompt = Self.negativePrompt
            configuration.startingImage = input
            configuration.strength = 0.64
            configuration.imageCount = 1
            configuration.stepCount = 14
            configuration.seed = seed
            configuration.guidanceScale = 6.5
            configuration.schedulerType = .dpmSolverMultistepScheduler
            configuration.disableSafety = false
            configuration.useDenoisedIntermediates = false

            let images = try pipeline.generateImages(configuration: configuration) { value in
                progress(Double(value.step + 1) / Double(max(value.stepCount, 1)))
                return true
            }
            guard let generated = images.first ?? nil else {
                throw GenerationError.noImage
            }
            return UIImage(cgImage: generated)
        }
    }
}

enum GenerationError: LocalizedError {
    case noImage

    var errorDescription: String? {
        "模型没有返回图片，请重试一次。"
    }
}
