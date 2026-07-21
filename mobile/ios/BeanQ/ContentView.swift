import PhotosUI
import SwiftUI

struct ContentView: View {
    @StateObject private var viewModel = CartoonViewModel()
    @State private var pickerItem: PhotosPickerItem?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 18) {
                    hero
                    previewCard
                    modelCard
                    actionCard
                    privacyNote
                }
                .padding(18)
            }
            .background(Color(red: 0.97, green: 0.95, blue: 0.92))
            .navigationTitle("豆格 Q 版")
            .navigationBarTitleDisplayMode(.inline)
        }
        .onChange(of: pickerItem) { _, newValue in
            guard let newValue else { return }
            Task {
                if let data = try? await newValue.loadTransferable(type: Data.self) {
                    viewModel.selectImage(data: data)
                }
            }
        }
    }

    private var hero: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("一张照片，重新设计成大眼 Q 版")
                .font(.system(size: 27, weight: .black, design: .rounded))
            Text("不是调色滤镜。模型会重画眼睛、脸型、头发和手部，同时尽量保留人物、衣服与姿势。")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var previewCard: some View {
        VStack(spacing: 12) {
            if let result = viewModel.resultImage {
                Image(uiImage: result)
                    .resizable()
                    .scaledToFit()
                    .clipShape(RoundedRectangle(cornerRadius: 20))
                    .overlay(alignment: .topLeading) { badge("AFTER · Q版") }
            } else if let source = viewModel.sourceImage {
                Image(uiImage: source)
                    .resizable()
                    .scaledToFit()
                    .frame(maxHeight: 430)
                    .clipShape(RoundedRectangle(cornerRadius: 20))
                    .overlay(alignment: .topLeading) { badge("BEFORE · 原图") }
                    .overlay {
                        if viewModel.isGenerating {
                            ZStack {
                                Color.black.opacity(0.42)
                                VStack(spacing: 12) {
                                    ProgressView(value: viewModel.generationProgress)
                                        .tint(.white)
                                        .frame(width: 180)
                                    Text("\(Int(viewModel.generationProgress * 100))%")
                                        .font(.headline.monospacedDigit())
                                        .foregroundStyle(.white)
                                }
                            }
                            .clipShape(RoundedRectangle(cornerRadius: 20))
                        }
                    }
            } else {
                PhotosPicker(selection: $pickerItem, matching: .images) {
                    VStack(spacing: 14) {
                        Image(systemName: "photo.badge.plus")
                            .font(.system(size: 38, weight: .light))
                        Text("选择人物照片")
                            .font(.headline)
                        Text("会自动找到照片里的人脸并优化构图")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity, minHeight: 290)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(10)
        .background(.white)
        .clipShape(RoundedRectangle(cornerRadius: 26))
        .shadow(color: .black.opacity(0.07), radius: 20, y: 8)
    }

    private func badge(_ title: String) -> some View {
        Text(title)
            .font(.caption2.bold())
            .padding(.horizontal, 10)
            .padding(.vertical, 7)
            .background(.ultraThinMaterial)
            .clipShape(Capsule())
            .padding(12)
    }

    private var modelCard: some View {
        HStack(spacing: 12) {
            Image(systemName: modelIcon)
                .font(.title2)
                .foregroundStyle(modelColor)
                .frame(width: 38, height: 38)
                .background(modelColor.opacity(0.12))
                .clipShape(RoundedRectangle(cornerRadius: 11))
            VStack(alignment: .leading, spacing: 3) {
                Text(modelTitle).font(.subheadline.bold())
                Text(modelDetail).font(.caption).foregroundStyle(.secondary)
            }
            Spacer()
            if !viewModel.modelReady {
                Button(viewModel.isBusyInstalling ? "处理中" : "下载") {
                    viewModel.installModel()
                }
                .buttonStyle(.bordered)
                .disabled(viewModel.isBusyInstalling)
            }
        }
        .padding(15)
        .background(.white.opacity(0.82))
        .clipShape(RoundedRectangle(cornerRadius: 18))
    }

    private var actionCard: some View {
        VStack(spacing: 11) {
            if viewModel.resultImage == nil {
                Button {
                    if !viewModel.modelReady { viewModel.installModel() }
                    else { viewModel.generate() }
                } label: {
                    Label(viewModel.modelReady ? "开始 Q 版重绘" : "先下载免费模型", systemImage: "sparkles")
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 7)
                }
                .buttonStyle(.borderedProminent)
                .tint(Color(red: 0.94, green: 0.39, blue: 0.32))
                .disabled(viewModel.sourceImage == nil || viewModel.isGenerating || viewModel.isBusyInstalling)
            } else {
                Button(action: viewModel.saveResult) {
                    Label("保存到相册", systemImage: "square.and.arrow.down")
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 7)
                }
                .buttonStyle(.borderedProminent)
                .tint(Color(red: 0.94, green: 0.39, blue: 0.32))
                Button("换个随机结果再生成一次", action: viewModel.generate)
                    .disabled(viewModel.isGenerating)
            }

            PhotosPicker(selection: $pickerItem, matching: .images) {
                Text(viewModel.sourceImage == nil ? "选择照片" : "更换原图")
                    .font(.subheadline.bold())
            }
        }
        .padding(16)
        .background(.white)
        .clipShape(RoundedRectangle(cornerRadius: 20))
    }

    private var privacyNote: some View {
        VStack(spacing: 5) {
            Text(viewModel.message).font(.footnote.bold())
            Text("照片和生成过程都留在这台 iPhone。首次下载约 2 GB 模型，之后无需联网、没有按张费用。")
                .font(.caption)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(.vertical, 5)
    }

    private var modelIcon: String {
        switch viewModel.modelState {
        case .ready: return "checkmark.seal.fill"
        case .failed: return "exclamationmark.triangle.fill"
        case .downloading, .verifying, .installing: return "arrow.down.circle.fill"
        case .missing: return "shippingbox.fill"
        }
    }

    private var modelColor: Color {
        switch viewModel.modelState {
        case .ready: return .green
        case .failed: return .red
        default: return .orange
        }
    }

    private var modelTitle: String {
        switch viewModel.modelState {
        case .ready: return "Q版模型已就绪"
        case .downloading: return "正在下载模型"
        case .verifying: return "正在校验模型"
        case .installing: return "正在安装模型"
        case .failed: return "模型安装失败"
        case .missing: return "需要一次性下载模型"
        }
    }

    private var modelDetail: String {
        switch viewModel.modelState {
        case .ready: return "可断网生成 · iPhone 本机运算"
        case let .failed(reason): return reason
        case .downloading: return "约 2 GB，建议连接 Wi-Fi"
        case .verifying: return "正在核对文件，防止模型损坏"
        case .installing: return "正在解压，完成后可离线使用"
        case .missing: return "需预留约 5 GB，安装后重复使用"
        }
    }
}

#Preview {
    ContentView()
}
