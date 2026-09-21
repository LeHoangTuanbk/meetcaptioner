# MeetCaptioner

[English](README.md) | [Tiếng Việt](README-vi.md) | [简体中文](README-zh-CN.md) | [繁體中文](README-zh-TW.md) | [日本語](README-ja.md) | [한국어](README-ko.md) | [Español](README-es.md) | [Português](README-pt.md) | [Русский](README-ru.md) | ไทย

ส่วนขยาย Chrome ที่ทรงพลังสำหรับบันทึกคำบรรยายจาก Google Meet แบบเรียลไทม์ พร้อมการแปลสดด้วย AI

![Chrome Extension](https://img.shields.io/badge/Platform-Chrome%20Extension-4285F4?logo=googlechrome&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)

## คุณสมบัติ

- **บันทึกคำบรรยายแบบเรียลไทม์** - บันทึกคำบรรยาย Google Meet พร้อมระบุผู้พูดโดยอัตโนมัติ
- **แปลสดด้วย AI** - แปลได้มากกว่า 40 ภาษาด้วย OpenAI, Anthropic, Google Gemini, DeepSeek หรือ Ollama (เครื่องส่วนตัว/คลาวด์)
- **หน้าต่างลอย** - ลากและปรับขนาดได้โดยไม่รบกวนการประชุม
- **ประวัติการประชุม** - บันทึกคำบรรยายทั้งหมดไว้ในเครื่องโดยอัตโนมัติเพื่อดูภายหลัง
- **ตัวเลือกการส่งออก** - ส่งออกคำบรรยายและคำแปลเป็นไฟล์ข้อความ
- **แก้ไขคำแปล** - คลิกคำแปลเพื่อแก้ไขได้ด้วยตนเอง
- **ระบบสำรองอัจฉริยะ** - สลับโมเดลอัตโนมัติเมื่อถึงขีดจำกัดการใช้งาน
- **ให้ความสำคัญกับความเป็นส่วนตัว** - ข้อมูลทั้งหมดจัดเก็บในเครื่อง ไม่จัดเก็บบนเซิร์ฟเวอร์ภายนอก

## ภาพหน้าจอ

![MeetCaptioner Demo](documents/deployment/images/github/demo.png)

_บันทึกคำบรรยายและแปลด้วย AI แบบเรียลไทม์ใน Google Meet_

## การติดตั้ง

### ติดตั้งจากซอร์สโค้ด

1. **โคลน repository**

   ```bash
   git clone https://github.com/LeHoangTuanbk/MeetCaptioner
   cd meet-captioner
   ```

2. **ติดตั้ง dependencies**

   ```bash
   pnpm install
   ```

3. **บิลด์ส่วนขยาย**

   ```bash
   # โหมดพัฒนาพร้อม hot reload
   pnpm dev

   # บิลด์สำหรับ production
   pnpm build
   ```

4. **โหลดเข้า Chrome**
   - เปิด `chrome://extensions/`
   - เปิด “โหมดนักพัฒนาซอฟต์แวร์”
   - คลิก “โหลดส่วนขยายที่ไม่ได้แพ็ก”
   - เลือกไดเรกทอรี `.output/chrome-mv3`

### ติดตั้งจาก Release

1. ดาวน์โหลดไฟล์ `.zip` ล่าสุดจาก [Releases](https://github.com/LeHoangTuanbk/MeetCaptioner/releases)
2. แตกไฟล์ ZIP
3. โหลดเข้า Chrome ตามขั้นตอนด้านบน

## การตั้งค่า

1. คลิกไอคอนส่วนขยายแล้วเปิด **Settings**
2. เลือกผู้ให้บริการ AI ได้แก่ OpenAI, Anthropic, Google Gemini, DeepSeek หรือ Ollama
3. กรอก API key หรือตั้งค่า URL ของ Ollama สำหรับ LLM ที่ทำงานในเครื่อง
4. เลือกโมเดลและภาษาเป้าหมาย
5. เปิดสวิตช์การแปลบนหน้าต่างลอย

### ผู้ให้บริการ AI ที่รองรับ

| ผู้ให้บริการ | โมเดล |
| ------------ | ----- |
| OpenAI | GPT-4.1 Nano, GPT-4.1 Mini, GPT-5 Nano |
| Anthropic | Claude Haiku 4.5, Claude Sonnet 4.5, Claude Opus 4.5 |
| Gemini | Gemini 3.1 Flash-Lite, Gemini 3.5 Flash, Gemini 3.1 Pro (Preview) |
| DeepSeek | DeepSeek Flash |
| Ollama | โมเดลในเครื่องใดก็ได้ (Qwen, Llama, Gemma เป็นต้น) หรือ Ollama Cloud |

> **หมายเหตุ:** Ollama ที่ทำงานในเครื่องต้องตั้งค่า CORS โปรดดู[คู่มือการตั้งค่า](https://objectgraph.com/blog/ollama-cors/)
>
> **Gemini:** รับ API key ฟรีได้จาก [Google AI Studio](https://aistudio.google.com/app/apikey)

### ภาษาที่รองรับ

Tiếng Việt (Vietnamese), English (English), 廣東話（繁體） (Chinese, Cantonese (Traditional)), 普通话（简体中文） (Chinese, Mandarin (Simplified)), 國語（繁體中文） (Chinese, Mandarin (Traditional)), 日本語 (Japanese), 한국어 (Korean), Español (Spanish), Français (French), Deutsch (German), Português (Portuguese), Русский (Russian), العربية (Arabic), हिन्दी (Hindi), Italiano (Italian), ไทย (Thai), Монгол (Mongolian), မြန်မာ (Burmese), Bahasa Indonesia (Indonesian), Nederlands (Dutch), Polski (Polish), Türkçe (Turkish), বাংলা (Bengali), اردو (Urdu), Bahasa Melayu (Malay), Filipino (Filipino), தமிழ் (Tamil), తెలుగు (Telugu), मराठी (Marathi), ગુજરાતી (Gujarati), ਪੰਜਾਬੀ (Punjabi), Українська (Ukrainian), Čeština (Czech), Română (Romanian), Magyar (Hungarian), Ελληνικά (Greek), Svenska (Swedish), Dansk (Danish), Norsk (Norwegian), Suomi (Finnish), עברית (Hebrew), فارسی (Persian), Kiswahili (Swahili), Català (Catalan), Български (Bulgarian), Српски (Serbian)

## เทคโนโลยี

- **Framework**: [WXT](https://wxt.dev) - เฟรมเวิร์ก Web Extension รุ่นใหม่
- **UI**: React 19 + TypeScript
- **Styling**: Tailwind CSS 4
- **Build**: Vite
- **Package manager**: pnpm

## โครงสร้างโปรเจกต์

```text
meet-captioner/
├── entrypoints/
│   ├── content/          # บันทึกคำบรรยายและหน้าต่างลอย
│   ├── background.ts     # Service worker
│   ├── popup/            # หน้าต่างป๊อปอัป
│   ├── options/          # หน้าการตั้งค่า
│   └── history/          # หน้าประวัติการประชุม
├── public/               # Static assets
└── wxt.config.ts         # การตั้งค่า WXT
```

## การพัฒนา

```bash
# เริ่ม development server
pnpm dev

# บิลด์สำหรับ production
pnpm build

# สร้างไฟล์ ZIP สำหรับเผยแพร่
pnpm zip
```

## การมีส่วนร่วม

ยินดีรับทุกการมีส่วนร่วม คุณสามารถส่ง Pull Request ได้ตามขั้นตอนต่อไปนี้:

1. Fork repository
2. สร้าง feature branch (`git checkout -b feature/amazing-feature`)
3. Commit การเปลี่ยนแปลง (`git commit -m 'Add some amazing feature'`)
4. Push branch (`git push origin feature/amazing-feature`)
5. เปิด Pull Request

### แนวทางการพัฒนา

- ปฏิบัติตามรูปแบบโค้ดที่มีอยู่
- เขียนข้อความ commit ที่ชัดเจน
- ทดสอบการเปลี่ยนแปลงอย่างครบถ้วน
- อัปเดตเอกสารเมื่อจำเป็น

## ใบอนุญาต

โปรเจกต์นี้เผยแพร่ภายใต้ MIT License โปรดดูรายละเอียดใน [LICENSE](LICENSE)

## คำขอบคุณ

- [WXT](https://wxt.dev) สำหรับเฟรมเวิร์กส่วนขยายที่ยอดเยี่ยม
- [Tailwind CSS](https://tailwindcss.com) สำหรับ utility-first CSS
- [OpenAI](https://openai.com), [Anthropic](https://anthropic.com), [Google Gemini](https://ai.google.dev), [DeepSeek](https://www.deepseek.com) และ [Ollama](https://ollama.com) สำหรับ AI API

---

สร้างด้วยความใส่ใจโดย [Le Hoang Tuan](https://github.com/LeHoangTuanbk)
