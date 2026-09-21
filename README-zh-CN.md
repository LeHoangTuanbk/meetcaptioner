# MeetCaptioner

[English](README.md) | [Tiếng Việt](README-vi.md) | 简体中文 | [繁體中文](README-zh-TW.md) | [日本語](README-ja.md) | [한국어](README-ko.md) | [Español](README-es.md) | [Русский](README-ru.md) | [ไทย](README-th.md)

一款强大的 Chrome 扩展，可实时捕获 Google Meet 字幕，并通过 AI 提供实时翻译。

![Chrome Extension](https://img.shields.io/badge/Platform-Chrome%20Extension-4285F4?logo=googlechrome&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)

## 功能

- **实时字幕捕获** - 自动捕获 Google Meet 字幕并识别发言者
- **AI 实时翻译** - 使用 OpenAI、Anthropic、Google Gemini、DeepSeek 或 Ollama（本地／云端）翻译成 40 多种语言
- **悬浮窗口** - 可拖动、可调整大小，不干扰会议
- **会议历史** - 自动在本地保存所有会议字幕，方便之后查看
- **导出功能** - 将字幕和翻译导出为文本文件
- **可编辑翻译** - 点击任意翻译即可手动编辑
- **智能回退** - 遇到速率限制时自动切换模型
- **隐私优先** - 所有数据均存储在本地，不使用外部服务器保存数据

## 截图

![MeetCaptioner Demo](documents/deployment/images/github/demo.png)

_在 Google Meet 中实时捕获字幕并进行 AI 翻译_

## 安装

### 从源代码安装（开发）

1. **克隆仓库**

   ```bash
   git clone https://github.com/LeHoangTuanbk/MeetCaptioner
   cd meet-captioner
   ```

2. **安装依赖**

   ```bash
   pnpm install
   ```

3. **构建扩展**

   ```bash
   # 开发模式（支持热更新）
   pnpm dev

   # 生产构建
   pnpm build
   ```

4. **加载到 Chrome**
   - 打开 `chrome://extensions/`
   - 启用“开发者模式”
   - 点击“加载已解压的扩展程序”
   - 选择 `.output/chrome-mv3` 目录

### 从 Release 安装

1. 从 [Releases](https://github.com/LeHoangTuanbk/MeetCaptioner/releases) 下载最新的 `.zip`
2. 解压 ZIP 文件
3. 按照上面的步骤加载到 Chrome

## 配置

1. 点击扩展图标并进入 **Settings**
2. 选择 AI 服务商（OpenAI、Anthropic、Google Gemini、DeepSeek 或 Ollama）
3. 输入 API 密钥（使用本地 LLM 时配置 Ollama 服务器 URL）
4. 选择模型和目标语言
5. 在悬浮窗口中开启翻译开关

### 支持的 AI 服务商

| 服务商 | 模型 |
| ------ | ---- |
| OpenAI | GPT-4.1 Nano、GPT-4.1 Mini、GPT-5 Nano |
| Anthropic | Claude Haiku 4.5、Claude Sonnet 4.5、Claude Opus 4.5 |
| Gemini | Gemini 3.1 Flash-Lite、Gemini 3.5 Flash、Gemini 3.1 Pro（Preview） |
| DeepSeek | DeepSeek Flash |
| Ollama | 任意本地模型（Qwen、Llama、Gemma 等）或 Ollama Cloud |

> **注意：**在本地使用 Ollama 时需要配置 CORS。请参阅[设置指南](https://objectgraph.com/blog/ollama-cors/)。
>
> **Gemini：**可从 [Google AI Studio](https://aistudio.google.com/app/apikey) 免费获取 API 密钥。

### 支持的语言

Tiếng Việt (Vietnamese), English (English), 廣東話（繁體） (Chinese, Cantonese (Traditional)), 普通话（简体中文） (Chinese, Mandarin (Simplified)), 國語（繁體中文） (Chinese, Mandarin (Traditional)), 日本語 (Japanese), 한국어 (Korean), Español (Spanish), Français (French), Deutsch (German), Português (Portuguese), Русский (Russian), العربية (Arabic), हिन्दी (Hindi), Italiano (Italian), ไทย (Thai), Монгол (Mongolian), မြန်မာ (Burmese), Bahasa Indonesia (Indonesian), Nederlands (Dutch), Polski (Polish), Türkçe (Turkish), বাংলা (Bengali), اردو (Urdu), Bahasa Melayu (Malay), Filipino (Filipino), தமிழ் (Tamil), తెలుగు (Telugu), मराठी (Marathi), ગુજરાતી (Gujarati), ਪੰਜਾਬੀ (Punjabi), Українська (Ukrainian), Čeština (Czech), Română (Romanian), Magyar (Hungarian), Ελληνικά (Greek), Svenska (Swedish), Dansk (Danish), Norsk (Norwegian), Suomi (Finnish), עברית (Hebrew), فارسی (Persian), Kiswahili (Swahili), Català (Catalan), Български (Bulgarian), Српски (Serbian)

## 技术栈

- **框架**：[WXT](https://wxt.dev) - 新一代 Web Extension 框架
- **UI**：React 19 + TypeScript
- **样式**：Tailwind CSS 4
- **构建工具**：Vite
- **包管理器**：pnpm

## 项目结构

```text
meet-captioner/
├── entrypoints/
│   ├── content/          # 内容脚本（字幕捕获、悬浮窗口）
│   ├── background.ts     # Service Worker
│   ├── popup/            # 扩展弹窗
│   ├── options/          # 设置页面
│   └── history/          # 会议历史页面
├── public/               # 静态资源
└── wxt.config.ts         # WXT 配置
```

## 开发

```bash
# 启动开发服务器
pnpm dev

# 生产构建
pnpm build

# 创建发布用 ZIP
pnpm zip
```

## 参与贡献

欢迎贡献代码，请随时提交 Pull Request。

1. Fork 此仓库
2. 创建功能分支（`git checkout -b feature/amazing-feature`）
3. 提交更改（`git commit -m 'Add some amazing feature'`）
4. 推送分支（`git push origin feature/amazing-feature`）
5. 创建 Pull Request

### 开发规范

- 遵循现有代码风格
- 编写清晰、有意义的提交信息
- 充分测试更改
- 根据需要更新文档

## 许可证

本项目采用 MIT License，详情请参阅 [LICENSE](LICENSE)。

## 致谢

- 感谢 [WXT](https://wxt.dev) 提供优秀的扩展框架
- 感谢 [Tailwind CSS](https://tailwindcss.com) 提供实用优先的 CSS 工具
- 感谢 [OpenAI](https://openai.com)、[Anthropic](https://anthropic.com)、[Google Gemini](https://ai.google.dev)、[DeepSeek](https://www.deepseek.com) 和 [Ollama](https://ollama.com) 提供 AI API

---

由 [Le Hoang Tuan](https://github.com/LeHoangTuanbk) 用心制作。
