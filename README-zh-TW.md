# MeetCaptioner

[English](README.md) | [Tiếng Việt](README-vi.md) | [简体中文](README-zh-CN.md) | 繁體中文 | [日本語](README-ja.md) | [한국어](README-ko.md) | [Español](README-es.md) | [Português](README-pt.md) | [Русский](README-ru.md) | [ไทย](README-th.md)

一款強大的 Chrome 擴充功能，可即時擷取 Google Meet 字幕，並透過 AI 提供即時翻譯。

![Chrome Extension](https://img.shields.io/badge/Platform-Chrome%20Extension-4285F4?logo=googlechrome&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)

## 功能

- **即時字幕擷取** - 自動擷取 Google Meet 字幕並辨識說話者
- **AI 即時翻譯** - 使用 OpenAI、Anthropic、Google Gemini、DeepSeek 或 Ollama（本機／雲端）翻譯成 40 多種語言
- **浮動視窗** - 可拖曳及調整大小，不會干擾會議
- **會議記錄** - 自動將所有會議字幕儲存在本機，方便日後查看
- **匯出功能** - 將字幕與翻譯匯出為文字檔
- **可編輯翻譯** - 點擊翻譯即可手動修改
- **智慧備援** - 遇到速率限制時自動切換模型
- **隱私優先** - 所有資料皆儲存在本機，不會儲存於外部伺服器

## 螢幕截圖

![MeetCaptioner Demo](documents/deployment/images/github/demo.png)

_在 Google Meet 中即時擷取字幕並使用 AI 翻譯_

## 安裝

### 從原始碼安裝（開發用）

1. **複製儲存庫**

   ```bash
   git clone https://github.com/LeHoangTuanbk/MeetCaptioner
   cd meet-captioner
   ```

2. **安裝相依套件**

   ```bash
   pnpm install
   ```

3. **建置擴充功能**

   ```bash
   # 開發模式（支援熱更新）
   pnpm dev

   # 正式環境建置
   pnpm build
   ```

4. **載入 Chrome**
   - 開啟 `chrome://extensions/`
   - 啟用「開發人員模式」
   - 點擊「載入未封裝項目」
   - 選擇 `.output/chrome-mv3` 目錄

### 從 Release 安裝

1. 從 [Releases](https://github.com/LeHoangTuanbk/MeetCaptioner/releases) 下載最新的 `.zip`
2. 解壓縮 ZIP 檔案
3. 按照上述步驟載入 Chrome

## 設定

1. 點擊擴充功能圖示並開啟 **Settings**
2. 選擇 AI 供應商（OpenAI、Anthropic、Google Gemini、DeepSeek 或 Ollama）
3. 輸入 API 金鑰；使用本機 LLM 時請設定 Ollama 伺服器 URL
4. 選擇模型與目標語言
5. 在浮動視窗中開啟翻譯

### 支援的 AI 供應商

| 供應商 | 模型 |
| ------ | ---- |
| OpenAI | GPT-4.1 Nano、GPT-4.1 Mini、GPT-5 Nano |
| Anthropic | Claude Haiku 4.5、Claude Sonnet 4.5、Claude Opus 4.5 |
| Gemini | Gemini 3.1 Flash-Lite、Gemini 3.5 Flash、Gemini 3.1 Pro（Preview） |
| DeepSeek | DeepSeek Flash |
| Ollama | 任意本機模型（Qwen、Llama、Gemma 等）或 Ollama Cloud |

> **注意：**在本機使用 Ollama 時需要設定 CORS。請參閱[設定指南](https://objectgraph.com/blog/ollama-cors/)。
>
> **Gemini：**可於 [Google AI Studio](https://aistudio.google.com/app/apikey) 免費取得 API 金鑰。

### 支援語言

Tiếng Việt (Vietnamese), English (English), 廣東話（繁體） (Chinese, Cantonese (Traditional)), 普通话（简体中文） (Chinese, Mandarin (Simplified)), 國語（繁體中文） (Chinese, Mandarin (Traditional)), 日本語 (Japanese), 한국어 (Korean), Español (Spanish), Français (French), Deutsch (German), Português (Portuguese), Русский (Russian), العربية (Arabic), हिन्दी (Hindi), Italiano (Italian), ไทย (Thai), Монгол (Mongolian), မြန်မာ (Burmese), Bahasa Indonesia (Indonesian), Nederlands (Dutch), Polski (Polish), Türkçe (Turkish), বাংলা (Bengali), اردو (Urdu), Bahasa Melayu (Malay), Filipino (Filipino), தமிழ் (Tamil), తెలుగు (Telugu), मराठी (Marathi), ગુજરાતી (Gujarati), ਪੰਜਾਬੀ (Punjabi), Українська (Ukrainian), Čeština (Czech), Română (Romanian), Magyar (Hungarian), Ελληνικά (Greek), Svenska (Swedish), Dansk (Danish), Norsk (Norwegian), Suomi (Finnish), עברית (Hebrew), فارسی (Persian), Kiswahili (Swahili), Català (Catalan), Български (Bulgarian), Српски (Serbian)

## 技術棧

- **框架**：[WXT](https://wxt.dev) - 次世代 Web Extension 框架
- **UI**：React 19 + TypeScript
- **樣式**：Tailwind CSS 4
- **建置工具**：Vite
- **套件管理器**：pnpm

## 專案結構

```text
meet-captioner/
├── entrypoints/
│   ├── content/          # 內容腳本（字幕擷取、浮動視窗）
│   ├── background.ts     # Service Worker
│   ├── popup/            # 擴充功能彈出視窗
│   ├── options/          # 設定頁面
│   └── history/          # 會議記錄頁面
├── public/               # 靜態資源
└── wxt.config.ts         # WXT 設定
```

## 開發

```bash
# 啟動開發伺服器
pnpm dev

# 正式環境建置
pnpm build

# 建立發行用 ZIP
pnpm zip
```

## 參與貢獻

歡迎貢獻程式碼，請隨時提交 Pull Request。

1. Fork 此儲存庫
2. 建立功能分支（`git checkout -b feature/amazing-feature`）
3. 提交變更（`git commit -m 'Add some amazing feature'`）
4. 推送分支（`git push origin feature/amazing-feature`）
5. 建立 Pull Request

### 開發規範

- 遵循現有程式碼風格
- 撰寫清楚且有意義的提交訊息
- 完整測試變更
- 視需要更新文件

## 授權條款

本專案採用 MIT License，詳情請參閱 [LICENSE](LICENSE)。

## 致謝

- 感謝 [WXT](https://wxt.dev) 提供優秀的擴充功能框架
- 感謝 [Tailwind CSS](https://tailwindcss.com) 提供 utility-first CSS
- 感謝 [OpenAI](https://openai.com)、[Anthropic](https://anthropic.com)、[Google Gemini](https://ai.google.dev)、[DeepSeek](https://www.deepseek.com) 與 [Ollama](https://ollama.com) 提供 AI API

---

由 [Le Hoang Tuan](https://github.com/LeHoangTuanbk) 用心製作。
