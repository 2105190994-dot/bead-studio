import CoreGraphics
import UIKit
import Vision

enum SmartCropError: LocalizedError {
    case unreadableImage
    case cropFailed

    var errorDescription: String? {
        switch self {
        case .unreadableImage: return "无法读取这张照片。"
        case .cropFailed: return "自动构图失败，请换一张照片重试。"
        }
    }
}

enum SmartCropper {
    static let outputSize = 512

    /// Detects every visible face, keeps the group in frame, then creates the
    /// exact square input required by the on-device diffusion model.
    static func prepare(_ image: UIImage) throws -> CGImage {
        guard let normalized = image.normalizedCGImage else {
            throw SmartCropError.unreadableImage
        }

        let faceRequest = VNDetectFaceRectanglesRequest()
        let handler = VNImageRequestHandler(cgImage: normalized, orientation: .up)
        try? handler.perform([faceRequest])

        let bounds = CGRect(x: 0, y: 0, width: normalized.width, height: normalized.height)
        let faceRects = (faceRequest.results ?? []).map { face -> CGRect in
            let visionRect = VNImageRectForNormalizedRect(
                face.boundingBox,
                normalized.width,
                normalized.height
            )
            return CGRect(
                x: visionRect.minX,
                y: CGFloat(normalized.height) - visionRect.maxY,
                width: visionRect.width,
                height: visionRect.height
            )
        }

        let cropRect = cropAround(faces: faceRects, within: bounds)
        guard let cropped = normalized.cropping(to: cropRect.integral) else {
            throw SmartCropError.cropFailed
        }
        return try resize(cropped, to: outputSize)
    }

    private static func cropAround(faces: [CGRect], within bounds: CGRect) -> CGRect {
        guard !faces.isEmpty else { return centeredSquare(in: bounds) }

        let group = faces.dropFirst().reduce(faces[0]) { $0.union($1) }
        let center = CGPoint(x: group.midX, y: group.midY + group.height * 0.35)
        let desiredSide = max(group.width * 1.8, group.height * 3.0)
        let side = min(max(desiredSide, min(bounds.width, bounds.height) * 0.58), min(bounds.width, bounds.height))
        var x = center.x - side / 2
        var y = center.y - side / 2
        x = min(max(bounds.minX, x), bounds.maxX - side)
        y = min(max(bounds.minY, y), bounds.maxY - side)
        return CGRect(x: x, y: y, width: side, height: side)
    }

    private static func centeredSquare(in bounds: CGRect) -> CGRect {
        let side = min(bounds.width, bounds.height)
        return CGRect(x: bounds.midX - side / 2, y: bounds.midY - side / 2, width: side, height: side)
    }

    private static func resize(_ image: CGImage, to size: Int) throws -> CGImage {
        let colorSpace = CGColorSpaceCreateDeviceRGB()
        guard let context = CGContext(
            data: nil,
            width: size,
            height: size,
            bitsPerComponent: 8,
            bytesPerRow: size * 4,
            space: colorSpace,
            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
        ) else { throw SmartCropError.cropFailed }
        context.interpolationQuality = .high
        context.draw(image, in: CGRect(x: 0, y: 0, width: size, height: size))
        guard let result = context.makeImage() else { throw SmartCropError.cropFailed }
        return result
    }
}

private extension UIImage {
    var normalizedCGImage: CGImage? {
        if imageOrientation == .up, let cgImage { return cgImage }
        let renderer = UIGraphicsImageRenderer(size: size)
        return renderer.image { _ in
            draw(in: CGRect(origin: .zero, size: size))
        }.cgImage
    }
}
