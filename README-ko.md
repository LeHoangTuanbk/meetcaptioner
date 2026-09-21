# MeetCaptioner

[English](README.md) | [Tiếng Việt](README-vi.md) | [简体中文](README-zh-CN.md) | [繁體中文](README-zh-TW.md) | [日本語](README-ja.md) | 한국어 | [Español](README-es.md) | [Português](README-pt.md) | [Русский](README-ru.md) | [ไทย](README-th.md)

Google Meet 자막을 실시간으로 캡처하고 AI 기반 실시간 번역을 제공하는 강력한 Chrome 확장 프로그램입니다.

![Chrome Extension](https://img.shields.io/badge/Platform-Chrome%20Extension-4285F4?logo=googlechrome&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)

## 주요 기능

- **실시간 자막 캡처** - 화자 정보와 함께 Google Meet 자막을 자동으로 캡처
- **AI 실시간 번역** - OpenAI, Anthropic, Google Gemini, DeepSeek 또는 Ollama(로컬/클라우드)를 사용하여 40개 이상의 언어로 번역
- **플로팅 오버레이** - 회의를 방해하지 않으며 이동 및 크기 조절 가능
- **회의 기록** - 모든 회의 자막을 로컬에 자동 저장하여 나중에 확인 가능
- **내보내기** - 자막과 번역을 텍스트 파일로 저장
- **번역 편집** - 번역을 클릭하여 직접 수정
- **스마트 폴백** - 요청 제한에 도달하면 모델을 자동 전환
- **개인정보 보호 우선** - 모든 데이터를 로컬에 저장하며 외부 서버에 저장하지 않음

## 스크린샷

![MeetCaptioner Demo](documents/deployment/images/github/demo.png)

_Google Meet에서 실시간 자막 캡처 및 AI 번역_

## 설치

### 소스에서 설치하기(개발용)

1. **저장소 복제**

   ```bash
   git clone https://github.com/LeHoangTuanbk/MeetCaptioner
   cd meet-captioner
   ```

2. **의존성 설치**

   ```bash
   pnpm install
   ```

3. **확장 프로그램 빌드**

   ```bash
   # 개발 모드(핫 리로드)
   pnpm dev

   # 프로덕션 빌드
   pnpm build
   ```

4. **Chrome에 로드**
   - `chrome://extensions/` 열기
   - “개발자 모드” 활성화
   - “압축해제된 확장 프로그램을 로드합니다” 클릭
   - `.output/chrome-mv3` 디렉터리 선택

### 릴리스에서 설치하기

1. [Releases](https://github.com/LeHoangTuanbk/MeetCaptioner/releases)에서 최신 `.zip` 다운로드
2. ZIP 파일 압축 해제
3. 위 단계에 따라 Chrome에 로드

## 설정

1. 확장 프로그램 아이콘을 클릭하고 **Settings**로 이동
2. AI 제공업체(OpenAI, Anthropic, Google Gemini, DeepSeek 또는 Ollama) 선택
3. API 키 입력(로컬 LLM은 Ollama 서버 URL 설정)
4. 원하는 모델과 대상 언어 선택
5. 오버레이에서 번역 스위치 활성화

### 지원 AI 제공업체

| 제공업체 | 모델 |
| -------- | ---- |
| OpenAI | GPT-4.1 Nano, GPT-4.1 Mini, GPT-5 Nano |
| Anthropic | Claude Haiku 4.5, Claude Sonnet 4.5, Claude Opus 4.5 |
| Gemini | Gemini 3.1 Flash-Lite, Gemini 3.5 Flash, Gemini 3.1 Pro (Preview) |
| DeepSeek | DeepSeek Flash |
| Ollama | 모든 로컬 모델(Qwen, Llama, Gemma 등) 또는 Ollama Cloud |

> **참고:** 로컬 Ollama를 사용하려면 CORS를 설정해야 합니다. [설정 가이드](https://objectgraph.com/blog/ollama-cors/)를 참고하세요.
>
> **Gemini:** [Google AI Studio](https://aistudio.google.com/app/apikey)에서 무료 API 키를 받을 수 있습니다.

### 지원 언어

Tiếng Việt (Vietnamese), English (English), 廣東話（繁體） (Chinese, Cantonese (Traditional)), 普通话（简体中文） (Chinese, Mandarin (Simplified)), 國語（繁體中文） (Chinese, Mandarin (Traditional)), 日本語 (Japanese), 한국어 (Korean), Español (Spanish), Français (French), Deutsch (German), Português (Portuguese), Русский (Russian), العربية (Arabic), हिन्दी (Hindi), Italiano (Italian), ไทย (Thai), Монгол (Mongolian), မြန်မာ (Burmese), Bahasa Indonesia (Indonesian), Nederlands (Dutch), Polski (Polish), Türkçe (Turkish), বাংলা (Bengali), اردو (Urdu), Bahasa Melayu (Malay), Filipino (Filipino), தமிழ் (Tamil), తెలుగు (Telugu), मराठी (Marathi), ગુજરાતી (Gujarati), ਪੰਜਾਬੀ (Punjabi), Українська (Ukrainian), Čeština (Czech), Română (Romanian), Magyar (Hungarian), Ελληνικά (Greek), Svenska (Swedish), Dansk (Danish), Norsk (Norwegian), Suomi (Finnish), עברית (Hebrew), فارسی (Persian), Kiswahili (Swahili), Català (Catalan), Български (Bulgarian), Српски (Serbian)

## 기술 스택

- **프레임워크**: [WXT](https://wxt.dev) - 차세대 Web Extension 프레임워크
- **UI**: React 19 + TypeScript
- **스타일링**: Tailwind CSS 4
- **빌드**: Vite
- **패키지 관리자**: pnpm

## 프로젝트 구조

```text
meet-captioner/
├── entrypoints/
│   ├── content/          # 콘텐츠 스크립트(자막 캡처, 오버레이)
│   ├── background.ts     # Service Worker
│   ├── popup/            # 확장 프로그램 팝업
│   ├── options/          # 설정 페이지
│   └── history/          # 회의 기록 페이지
├── public/               # 정적 에셋
└── wxt.config.ts         # WXT 설정
```

## 개발

```bash
# 개발 서버 시작
pnpm dev

# 프로덕션 빌드
pnpm build

# 배포용 ZIP 생성
pnpm zip
```

## 기여하기

기여를 환영합니다. 언제든지 Pull Request를 보내 주세요.

1. 저장소 Fork
2. 기능 브랜치 생성(`git checkout -b feature/amazing-feature`)
3. 변경 사항 커밋(`git commit -m 'Add some amazing feature'`)
4. 브랜치 Push(`git push origin feature/amazing-feature`)
5. Pull Request 생성

### 개발 지침

- 기존 코드 스타일 준수
- 의미 있는 커밋 메시지 작성
- 변경 사항을 충분히 테스트
- 필요한 경우 문서 업데이트

## 라이선스

이 프로젝트는 MIT License에 따라 배포됩니다. 자세한 내용은 [LICENSE](LICENSE)를 참고하세요.

## 감사의 말

- 훌륭한 확장 프로그램 프레임워크를 제공하는 [WXT](https://wxt.dev)
- 유틸리티 우선 CSS를 제공하는 [Tailwind CSS](https://tailwindcss.com)
- AI API를 제공하는 [OpenAI](https://openai.com), [Anthropic](https://anthropic.com), [Google Gemini](https://ai.google.dev), [DeepSeek](https://www.deepseek.com), [Ollama](https://ollama.com)

---

[Le Hoang Tuan](https://github.com/LeHoangTuanbk)이 정성을 담아 만들었습니다.
