# MeetCaptioner

[English](README.md) | [Tiếng Việt](README-vi.md) | [简体中文](README-zh-CN.md) | [繁體中文](README-zh-TW.md) | [日本語](README-ja.md) | [한국어](README-ko.md) | [Español](README-es.md) | Русский | [ไทย](README-th.md)

Мощное расширение Chrome для захвата субтитров Google Meet в реальном времени и их перевода с помощью ИИ.

![Chrome Extension](https://img.shields.io/badge/Platform-Chrome%20Extension-4285F4?logo=googlechrome&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)

## Возможности

- **Захват субтитров в реальном времени** — автоматический захват субтитров Google Meet с определением говорящего
- **Перевод с помощью ИИ** — перевод на более чем 40 языков через OpenAI, Anthropic, Google Gemini, DeepSeek или Ollama
- **Плавающая панель** — перемещаемая и изменяемая по размеру панель, не мешающая встрече
- **История встреч** — автоматическое локальное сохранение всех субтитров
- **Экспорт** — сохранение субтитров и переводов в текстовые файлы
- **Редактирование переводов** — ручное изменение любого перевода
- **Умное переключение** — автоматическая смена модели при ограничении запросов
- **Конфиденциальность** — все данные хранятся локально, без внешних серверов

## Скриншоты

![MeetCaptioner Demo](documents/deployment/images/github/demo.png)

_Захват и перевод субтитров Google Meet в реальном времени_

## Установка

### Из исходного кода

1. **Клонируйте репозиторий**

   ```bash
   git clone https://github.com/LeHoangTuanbk/MeetCaptioner
   cd meet-captioner
   ```

2. **Установите зависимости**

   ```bash
   pnpm install
   ```

3. **Соберите расширение**

   ```bash
   # Режим разработки
   pnpm dev

   # Производственная сборка
   pnpm build
   ```

4. **Загрузите в Chrome**
   - Откройте `chrome://extensions/`
   - Включите «Режим разработчика»
   - Нажмите «Загрузить распакованное расширение»
   - Выберите каталог `.output/chrome-mv3`

### Из готового выпуска

1. Скачайте последний `.zip` на странице [Releases](https://github.com/LeHoangTuanbk/MeetCaptioner/releases)
2. Распакуйте ZIP-файл
3. Загрузите расширение в Chrome по инструкции выше

## Настройка

1. Нажмите значок расширения и откройте **Settings**
2. Выберите поставщика ИИ: OpenAI, Anthropic, Google Gemini, DeepSeek или Ollama
3. Введите API-ключ или URL сервера Ollama для локальной модели
4. Выберите модель и язык перевода
5. Включите перевод на плавающей панели

### Поддерживаемые поставщики ИИ

| Поставщик | Модели |
| --------- | ------ |
| OpenAI | GPT-4.1 Nano, GPT-4.1 Mini, GPT-5 Nano |
| Anthropic | Claude Haiku 4.5, Claude Sonnet 4.5, Claude Opus 4.5 |
| Gemini | Gemini 3.1 Flash-Lite, Gemini 3.5 Flash, Gemini 3.1 Pro (Preview) |
| DeepSeek | DeepSeek Flash |
| Ollama | Любая локальная модель (Qwen, Llama, Gemma и другие) или Ollama Cloud |

> **Примечание:** для локального Ollama необходимо настроить CORS. См. [руководство](https://objectgraph.com/blog/ollama-cors/).
>
> **Gemini:** бесплатный API-ключ доступен в [Google AI Studio](https://aistudio.google.com/app/apikey).

### Поддерживаемые языки

Tiếng Việt (Vietnamese), English (English), 廣東話（繁體） (Chinese, Cantonese (Traditional)), 普通话（简体中文） (Chinese, Mandarin (Simplified)), 國語（繁體中文） (Chinese, Mandarin (Traditional)), 日本語 (Japanese), 한국어 (Korean), Español (Spanish), Français (French), Deutsch (German), Português (Portuguese), Русский (Russian), العربية (Arabic), हिन्दी (Hindi), Italiano (Italian), ไทย (Thai), Монгол (Mongolian), မြန်မာ (Burmese), Bahasa Indonesia (Indonesian), Nederlands (Dutch), Polski (Polish), Türkçe (Turkish), বাংলা (Bengali), اردو (Urdu), Bahasa Melayu (Malay), Filipino (Filipino), தமிழ் (Tamil), తెలుగు (Telugu), मराठी (Marathi), ગુજરાતી (Gujarati), ਪੰਜਾਬੀ (Punjabi), Українська (Ukrainian), Čeština (Czech), Română (Romanian), Magyar (Hungarian), Ελληνικά (Greek), Svenska (Swedish), Dansk (Danish), Norsk (Norwegian), Suomi (Finnish), עברית (Hebrew), فارسی (Persian), Kiswahili (Swahili), Català (Catalan), Български (Bulgarian), Српски (Serbian)

## Технологии

- **Фреймворк**: [WXT](https://wxt.dev)
- **UI**: React 19 + TypeScript
- **Стили**: Tailwind CSS 4
- **Сборка**: Vite
- **Менеджер пакетов**: pnpm

## Структура проекта

```text
meet-captioner/
├── entrypoints/
│   ├── content/          # Захват субтитров и плавающая панель
│   ├── background.ts     # Service worker
│   ├── popup/            # Всплывающее окно расширения
│   ├── options/          # Страница настроек
│   └── history/          # История встреч
├── public/               # Статические ресурсы
└── wxt.config.ts         # Конфигурация WXT
```

## Разработка

```bash
# Запуск сервера разработки
pnpm dev

# Производственная сборка
pnpm build

# Создание ZIP для распространения
pnpm zip
```

## Участие в разработке

Мы приветствуем вклад в проект. Вы можете отправить Pull Request:

1. Создайте Fork репозитория
2. Создайте ветку (`git checkout -b feature/amazing-feature`)
3. Зафиксируйте изменения (`git commit -m 'Add some amazing feature'`)
4. Отправьте ветку (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

### Рекомендации

- Соблюдайте существующий стиль кода
- Пишите понятные сообщения коммитов
- Тщательно тестируйте изменения
- При необходимости обновляйте документацию

## Лицензия

Проект распространяется по лицензии MIT. Подробнее см. [LICENSE](LICENSE).

## Благодарности

- [WXT](https://wxt.dev) за отличный фреймворк расширений
- [Tailwind CSS](https://tailwindcss.com) за набор CSS-утилит
- [OpenAI](https://openai.com), [Anthropic](https://anthropic.com), [Google Gemini](https://ai.google.dev), [DeepSeek](https://www.deepseek.com) и [Ollama](https://ollama.com) за API искусственного интеллекта

---

Создано с заботой автором [Le Hoang Tuan](https://github.com/LeHoangTuanbk).
