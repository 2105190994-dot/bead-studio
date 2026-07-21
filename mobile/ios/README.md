# 豆格 Q 版 · iPhone 本机版

这是为 **iPhone 14 Pro** 定向配置的原生 iOS 图生图应用。它不是网页滤镜，而是在手机上运行 Core ML 扩散模型，真正重新绘制眼睛、脸型、头发、线条和色块。

## 当前参数

- 设备：iPhone 14 Pro（A16 / 6 GB RAM）
- 输出：固定 512 × 512
- 模式：image-to-image，自动人脸构图
- 推理：14 步 DPM-Solver++，`CPU + Neural Engine`
- 内存：`reduceMemory = true`，单张生成后立即卸载模型资源
- 风格：只保留“大眼 Q 版”固定模板
- 隐私：照片不上传；模型安装后可断网使用
- 费用：模型与本地推理免费，无 API 按张费用

## 模型

首次启动后由用户下载 `coreml-community/coreml-moDi-v1` 的 split-einsum Core ML 图生图模型：

- 下载约 1.97 GB
- 安装时建议预留 5 GB
- 下载后执行 SHA-256 校验
- 模型不会提交进 Git 仓库

该免费模型可以做真正的图生图重绘，但它不是根据单张参考图专门训练的专属模型。若后续要进一步逼近指定参考图，需要用一批授权的“原图 → 目标 Q 版图”训练风格权重，再合并并转换成 Core ML。

## 在 Mac 上生成工程

Windows 不能运行 Xcode 或给 iPhone App 签名。源码已经准备好，最后构建需要一台 Mac：

```bash
brew install xcodegen
cd mobile/ios
xcodegen generate
open BeanQ.xcodeproj
```

在 Xcode 中选择自己的 Apple ID Team 和已连接的 iPhone 14 Pro，然后运行。个人免费签名通常需要定期重新安装；要用 TestFlight 或 App Store 长期分发，需要 Apple Developer Program。

## 关键文件

- `BeanQ/SmartCropper.swift`：Vision 人脸识别和自动构图
- `BeanQ/CartoonGenerator.swift`：固定 Q 版提示词和 iPhone 14 Pro 推理参数
- `BeanQ/ModelStore.swift`：模型下载、校验、解压与离线缓存
- `BeanQ/ContentView.swift`：手机端界面

## 开源与模型说明

- 推理库：[Apple ml-stable-diffusion](https://github.com/apple/ml-stable-diffusion)
- 模型：[coreml-community/coreml-moDi-v1](https://huggingface.co/coreml-community/coreml-moDi-v1)
- 解压库：[ZIPFoundation](https://github.com/weichsel/ZIPFoundation)

发布或商业使用前，请再次核对上述模型及依赖的许可证和使用范围。
