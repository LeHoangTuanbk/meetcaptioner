# MeetCaptioner

[English](README.md) | [Tiếng Việt](README-vi.md) | [简体中文](README-zh-CN.md) | [繁體中文](README-zh-TW.md) | 日本語 | [한국어](README-ko.md) | [Español](README-es.md) | [Português](README-pt.md) | [Русский](README-ru.md) | [ไทย](README-th.md)

Google Meet の字幕をリアルタイムで取得し、AI によるライブ翻訳を提供する高機能な Chrome 拡張機能です。

![Chrome Extension](https://img.shields.io/badge/Platform-Chrome%20Extension-4285F4?logo=googlechrome&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)

## 主な機能

- **リアルタイム字幕取得** - Google Meet の字幕を話者情報とともに自動取得
- **AI ライブ翻訳** - OpenAI、Anthropic、Google Gemini、DeepSeek、Ollama（ローカル／クラウド）を利用して40以上の言語へ翻訳
- **フローティングオーバーレイ** - 会議を妨げない、移動・サイズ変更可能なパネル
- **会議履歴** - すべての会議字幕をローカルに自動保存し、後から確認可能
- **エクスポート** - 字幕と翻訳をテキストファイルとして出力
- **翻訳の編集** - 翻訳結果をクリックして手動で編集
- **スマートフォールバック** - レート制限時にモデルを自動切り替え
- **プライバシー重視** - すべてのデータをローカルに保存し、外部サーバーには保存しません

## スクリーンショット

![MeetCaptioner Demo](documents/deployment/images/github/demo.png)

_Google Meet の字幕取得と AI 翻訳をリアルタイムで実行_

## インストール

### ソースからインストール（開発用）

1. **リポジトリをクローン**

   ```bash
   git clone https://github.com/LeHoangTuanbk/MeetCaptioner
   cd meet-captioner
   ```

2. **依存関係をインストール**

   ```bash
   pnpm install
   ```

3. **拡張機能をビルド**

   ```bash
   # 開発モード（ホットリロード対応）
   pnpm dev

   # 本番用ビルド
   pnpm build
   ```

4. **Chrome に読み込む**
   - `chrome://extensions/` を開く
   - 「デベロッパーモード」を有効にする
   - 「パッケージ化されていない拡張機能を読み込む」をクリック
   - `.output/chrome-mv3` ディレクトリを選択

### リリース版からインストール

1. [Releases](https://github.com/LeHoangTuanbk/MeetCaptioner/releases) から最新の `.zip` をダウンロード
2. ZIP ファイルを展開
3. 上記の手順で Chrome に読み込む

## 設定

1. 拡張機能のアイコンをクリックし、**Settings** を開く
2. AI プロバイダー（OpenAI、Anthropic、Google Gemini、DeepSeek、Ollama）を選択
3. API キーを入力（ローカル LLM の場合は Ollama サーバー URL を設定）
4. 使用するモデルと翻訳先言語を選択
5. オーバーレイの翻訳スイッチを有効にする

### 対応 AI プロバイダー

| プロバイダー | モデル |
| ------------ | ------ |
| OpenAI | GPT-4.1 Nano、GPT-4.1 Mini、GPT-5 Nano |
| Anthropic | Claude Haiku 4.5、Claude Sonnet 4.5、Claude Opus 4.5 |
| Gemini | Gemini 3.1 Flash-Lite、Gemini 3.5 Flash、Gemini 3.1 Pro（Preview） |
| DeepSeek | DeepSeek Flash |
| Ollama | 任意のローカルモデル（Qwen、Llama、Gemma など）または Ollama Cloud |

> **注意:** Ollama をローカルで使用する場合は CORS の設定が必要です。[セットアップガイド](https://objectgraph.com/blog/ollama-cors/)を参照してください。
>
> **Gemini:** [Google AI Studio](https://aistudio.google.com/app/apikey) で無料の API キーを取得できます。

### 対応言語

Tiếng Việt (Vietnamese), English (English), 廣東話（繁體） (Chinese, Cantonese (Traditional)), 普通话（简体中文） (Chinese, Mandarin (Simplified)), 國語（繁體中文） (Chinese, Mandarin (Traditional)), 日本語 (Japanese), 한국어 (Korean), Español (Spanish), Français (French), Deutsch (German), Português (Portuguese), Русский (Russian), العربية (Arabic), हिन्दी (Hindi), Italiano (Italian), ไทย (Thai), Монгол (Mongolian), မြန်မာ (Burmese), Bahasa Indonesia (Indonesian), Nederlands (Dutch), Polski (Polish), Türkçe (Turkish), বাংলা (Bengali), اردو (Urdu), Bahasa Melayu (Malay), Filipino (Filipino), தமிழ் (Tamil), తెలుగు (Telugu), मराठी (Marathi), ગુજરાતી (Gujarati), ਪੰਜਾਬੀ (Punjabi), Українська (Ukrainian), Čeština (Czech), Română (Romanian), Magyar (Hungarian), Ελληνικά (Greek), Svenska (Swedish), Dansk (Danish), Norsk (Norwegian), Suomi (Finnish), עברית (Hebrew), فارسی (Persian), Kiswahili (Swahili), Català (Catalan), Български (Bulgarian), Српски (Serbian)

## 技術スタック

- **フレームワーク**: [WXT](https://wxt.dev) - 次世代 Web Extension フレームワーク
- **UI**: React 19 + TypeScript
- **スタイリング**: Tailwind CSS 4
- **ビルド**: Vite
- **パッケージマネージャー**: pnpm

## プロジェクト構成

```text
meet-captioner/
├── entrypoints/
│   ├── content/          # コンテンツスクリプト（字幕取得、オーバーレイ）
│   ├── background.ts     # Service Worker
│   ├── popup/            # 拡張機能のポップアップ
│   ├── options/          # 設定ページ
│   └── history/          # 会議履歴ページ
├── public/               # 静的アセット
└── wxt.config.ts         # WXT 設定
```

## 開発

```bash
# 開発サーバーを起動
pnpm dev

# 本番用にビルド
pnpm build

# 配布用 ZIP を作成
pnpm zip
```

## コントリビューション

コントリビューションを歓迎します。Pull Request をお気軽にお送りください。

1. リポジトリをフォーク
2. Feature ブランチを作成（`git checkout -b feature/amazing-feature`）
3. 変更をコミット（`git commit -m 'Add some amazing feature'`）
4. ブランチをプッシュ（`git push origin feature/amazing-feature`）
5. Pull Request を作成

### 開発ガイドライン

- 既存のコードスタイルに従う
- 内容が分かりやすいコミットメッセージを書く
- 変更内容を十分にテストする
- 必要に応じてドキュメントを更新する

## ライセンス

このプロジェクトは MIT License の下で公開されています。詳細は [LICENSE](LICENSE) を参照してください。

## 謝辞

- 優れた拡張機能フレームワークを提供する [WXT](https://wxt.dev)
- ユーティリティファースト CSS を提供する [Tailwind CSS](https://tailwindcss.com)
- AI API を提供する [OpenAI](https://openai.com)、[Anthropic](https://anthropic.com)、[Google Gemini](https://ai.google.dev)、[DeepSeek](https://www.deepseek.com)、[Ollama](https://ollama.com)

---

[Le Hoang Tuan](https://github.com/LeHoangTuanbk) が心を込めて開発しています。
