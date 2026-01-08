# MeetCaptioner

A powerful Chrome extension that captures Google Meet captions in real-time with live translation support powered by AI.

![Chrome Extension](https://img.shields.io/badge/Platform-Chrome%20Extension-4285F4?logo=googlechrome&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)

## Features

- **Real-time Caption Capture** - Automatically captures captions from Google Meet with speaker identification
- **Live AI Translation** - Translate captions to 18+ languages using OpenAI or Anthropic APIs
- **Floating Overlay** - Draggable, resizable overlay that doesn't interfere with your meeting
- **Meeting History** - Auto-saves all your meeting captions locally for later review
- **Export Options** - Export captions and translations to text files
- **Editable Translations** - Click to edit any translation manually
- **Smart Fallback** - Automatic model switching when rate limits are hit
- **Privacy First** - All data stored locally, no external servers

## Screenshots

<details>
<summary>Click to view screenshots</summary>

### Caption Overlay

The floating overlay displays captions and translations side-by-side during your meeting.

### Meeting History

Review past meetings with full caption and translation history.

### Settings

Configure your preferred AI provider, model, and target language.

</details>

## Installation

### From Source (Development)

1. **Clone the repository**

   ```bash
   git clone https://github.com/LeHoangTuanbk/MeetCaptioner
   cd meet-captioner
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Build the extension**

   ```bash
   # Development mode (with hot reload)
   pnpm dev

   # Production build
   pnpm build
   ```

4. **Load in Chrome**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `.output/chrome-mv3` directory

### From Release

1. Download the latest `.zip` from [Releases](https://github.com/LeHoangTuanbk/MeetCaptioner/releases)
2. Extract the zip file
3. Load in Chrome as described above

## Configuration

1. Click the extension icon and go to **Settings**
2. Choose your AI provider (OpenAI or Anthropic)
3. Enter your API key
4. Select your preferred model and target language
5. Enable translation toggle in the overlay

### Supported AI Providers

| Provider  | Models                                               |
| --------- | ---------------------------------------------------- |
| OpenAI    | GPT-4.1 Nano, GPT-4.1 Mini, GPT-5 Nano               |
| Anthropic | Claude Haiku 4.5, Claude Sonnet 4.5, Claude Opus 4.5 |

### Supported Languages

Vietnamese, English, Chinese, Japanese, Korean, Spanish, French, German, Portuguese, Russian, Arabic, Hindi, Italian, Thai, Indonesian, Dutch, Polish, Turkish

## Tech Stack

- **Framework**: [WXT](https://wxt.dev) - Next-gen Web Extension Framework
- **UI**: React 19 + TypeScript
- **Styling**: Tailwind CSS 4
- **Build**: Vite
- **Package Manager**: pnpm

## Project Structure

```
meet-captioner/
├── entrypoints/
│   ├── content/          # Content script (caption capture, overlay)
│   │   ├── styles/       # CSS modules
│   │   ├── caption.ts    # Caption management
│   │   ├── overlay.ts    # Floating UI
│   │   ├── render.ts     # DOM rendering
│   │   └── ...
│   ├── background.ts     # Service worker (API calls, storage)
│   ├── popup/            # Extension popup
│   ├── options/          # Settings page
│   └── history/          # Meeting history page
├── public/               # Static assets
└── wxt.config.ts         # WXT configuration
```

## Development

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Create zip for distribution
pnpm zip
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Test your changes thoroughly
- Update documentation as needed

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2026 Le Hoang Tuan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Acknowledgments

- [WXT](https://wxt.dev) for the amazing extension framework
- [Tailwind CSS](https://tailwindcss.com) for the utility-first CSS
- [OpenAI](https://openai.com) and [Anthropic](https://anthropic.com) for AI APIs

---

Made with care by [Le Hoang Tuan](https://github.com/LeHoangTuanbk)
