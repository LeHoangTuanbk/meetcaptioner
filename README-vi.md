# MeetCaptioner

[English](README.md) | Tiếng Việt | [简体中文](README-zh-CN.md) | [繁體中文](README-zh-TW.md) | [日本語](README-ja.md) | [한국어](README-ko.md) | [Español](README-es.md) | [Русский](README-ru.md) | [ไทย](README-th.md)

Tiện ích Chrome mạnh mẽ giúp thu thập phụ đề Google Meet theo thời gian thực và dịch trực tiếp bằng AI.

![Chrome Extension](https://img.shields.io/badge/Platform-Chrome%20Extension-4285F4?logo=googlechrome&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)

## Tính năng

- **Thu thập phụ đề theo thời gian thực** - Tự động thu thập phụ đề Google Meet kèm thông tin người nói
- **Dịch trực tiếp bằng AI** - Dịch sang hơn 40 ngôn ngữ với OpenAI, Anthropic, Google Gemini, DeepSeek hoặc Ollama (local/cloud)
- **Overlay nổi** - Có thể kéo thả và thay đổi kích thước mà không cản trở cuộc họp
- **Lịch sử cuộc họp** - Tự động lưu toàn bộ phụ đề trên thiết bị để xem lại
- **Xuất dữ liệu** - Xuất phụ đề và bản dịch thành file văn bản
- **Chỉnh sửa bản dịch** - Nhấn vào bản dịch để chỉnh sửa thủ công
- **Fallback thông minh** - Tự động chuyển model khi gặp giới hạn request
- **Ưu tiên quyền riêng tư** - Toàn bộ dữ liệu được lưu cục bộ, không lưu trên server bên ngoài

## Ảnh chụp màn hình

![MeetCaptioner Demo](documents/deployment/images/github/demo.png)

_Thu thập phụ đề và dịch bằng AI theo thời gian thực trong Google Meet_

## Cài đặt

### Cài đặt từ mã nguồn

1. **Clone repository**

   ```bash
   git clone https://github.com/LeHoangTuanbk/MeetCaptioner
   cd meet-captioner
   ```

2. **Cài đặt dependencies**

   ```bash
   pnpm install
   ```

3. **Build extension**

   ```bash
   # Chế độ development có hot reload
   pnpm dev

   # Production build
   pnpm build
   ```

4. **Load vào Chrome**
   - Mở `chrome://extensions/`
   - Bật “Developer mode”
   - Nhấn “Load unpacked”
   - Chọn thư mục `.output/chrome-mv3`

### Cài đặt từ bản phát hành

1. Tải file `.zip` mới nhất từ [Releases](https://github.com/LeHoangTuanbk/MeetCaptioner/releases)
2. Giải nén file ZIP
3. Load vào Chrome theo hướng dẫn phía trên

## Cấu hình

1. Nhấn biểu tượng extension và mở **Settings**
2. Chọn nhà cung cấp AI (OpenAI, Anthropic, Google Gemini, DeepSeek hoặc Ollama)
3. Nhập API key hoặc cấu hình URL Ollama cho LLM chạy local
4. Chọn model và ngôn ngữ đích
5. Bật công tắc dịch trên overlay

### Nhà cung cấp AI được hỗ trợ

| Nhà cung cấp | Models |
| ------------ | ------ |
| OpenAI | GPT-4.1 Nano, GPT-4.1 Mini, GPT-5 Nano |
| Anthropic | Claude Haiku 4.5, Claude Sonnet 4.5, Claude Opus 4.5 |
| Gemini | Gemini 3.1 Flash-Lite, Gemini 3.5 Flash, Gemini 3.1 Pro (Preview) |
| DeepSeek | DeepSeek Flash |
| Ollama | Model local bất kỳ (Qwen, Llama, Gemma, v.v.) hoặc Ollama Cloud |

> **Lưu ý:** Khi chạy Ollama local, bạn cần cấu hình CORS. Xem [hướng dẫn thiết lập](https://objectgraph.com/blog/ollama-cors/).
>
> **Gemini:** Lấy API key miễn phí tại [Google AI Studio](https://aistudio.google.com/app/apikey).

### Ngôn ngữ được hỗ trợ

Tiếng Việt (Vietnamese), English (English), 廣東話（繁體） (Chinese, Cantonese (Traditional)), 普通话（简体中文） (Chinese, Mandarin (Simplified)), 國語（繁體中文） (Chinese, Mandarin (Traditional)), 日本語 (Japanese), 한국어 (Korean), Español (Spanish), Français (French), Deutsch (German), Português (Portuguese), Русский (Russian), العربية (Arabic), हिन्दी (Hindi), Italiano (Italian), ไทย (Thai), Монгол (Mongolian), မြန်မာ (Burmese), Bahasa Indonesia (Indonesian), Nederlands (Dutch), Polski (Polish), Türkçe (Turkish), বাংলা (Bengali), اردو (Urdu), Bahasa Melayu (Malay), Filipino (Filipino), தமிழ் (Tamil), తెలుగు (Telugu), मराठी (Marathi), ગુજરાતી (Gujarati), ਪੰਜਾਬੀ (Punjabi), Українська (Ukrainian), Čeština (Czech), Română (Romanian), Magyar (Hungarian), Ελληνικά (Greek), Svenska (Swedish), Dansk (Danish), Norsk (Norwegian), Suomi (Finnish), עברית (Hebrew), فارسی (Persian), Kiswahili (Swahili), Català (Catalan), Български (Bulgarian), Српски (Serbian)

## Công nghệ

- **Framework**: [WXT](https://wxt.dev) - Framework Web Extension thế hệ mới
- **UI**: React 19 + TypeScript
- **Styling**: Tailwind CSS 4
- **Build**: Vite
- **Package manager**: pnpm

## Cấu trúc dự án

```text
meet-captioner/
├── entrypoints/
│   ├── content/          # Content script (thu thập phụ đề, overlay)
│   ├── background.ts     # Service worker
│   ├── popup/            # Popup của extension
│   ├── options/          # Trang cài đặt
│   └── history/          # Trang lịch sử cuộc họp
├── public/               # Static assets
└── wxt.config.ts         # Cấu hình WXT
```

## Phát triển

```bash
# Khởi động development server
pnpm dev

# Build production
pnpm build

# Tạo file ZIP phát hành
pnpm zip
```

## Đóng góp

Mọi đóng góp đều được chào đón. Bạn có thể gửi Pull Request theo các bước sau:

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/amazing-feature`)
3. Commit thay đổi (`git commit -m 'Add some amazing feature'`)
4. Push branch (`git push origin feature/amazing-feature`)
5. Tạo Pull Request

### Quy ước phát triển

- Tuân theo coding style hiện tại
- Viết commit message rõ ràng
- Kiểm thử đầy đủ các thay đổi
- Cập nhật tài liệu khi cần thiết

## Giấy phép

Dự án được phát hành theo MIT License. Xem chi tiết tại [LICENSE](LICENSE).

## Lời cảm ơn

- [WXT](https://wxt.dev) vì extension framework tuyệt vời
- [Tailwind CSS](https://tailwindcss.com) vì hệ thống utility-first CSS
- [OpenAI](https://openai.com), [Anthropic](https://anthropic.com), [Google Gemini](https://ai.google.dev), [DeepSeek](https://www.deepseek.com) và [Ollama](https://ollama.com) vì các AI API

---

Được phát triển bằng sự tận tâm bởi [Le Hoang Tuan](https://github.com/LeHoangTuanbk).
