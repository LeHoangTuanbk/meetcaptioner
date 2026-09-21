# MeetCaptioner

[English](README.md) | [Tiếng Việt](README-vi.md) | [简体中文](README-zh-CN.md) | [繁體中文](README-zh-TW.md) | [日本語](README-ja.md) | [한국어](README-ko.md) | [Español](README-es.md) | Português | [Русский](README-ru.md) | [ไทย](README-th.md)

Uma poderosa extensão para Chrome que captura legendas do Google Meet em tempo real e oferece tradução ao vivo com inteligência artificial.

![Chrome Extension](https://img.shields.io/badge/Platform-Chrome%20Extension-4285F4?logo=googlechrome&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)

## Recursos

- **Captura de legendas em tempo real** - Captura automaticamente as legendas do Google Meet com identificação do interlocutor
- **Tradução ao vivo com IA** - Traduza para mais de 40 idiomas usando OpenAI, Anthropic, Google Gemini, DeepSeek ou Ollama (local/nuvem)
- **Painel flutuante** - Pode ser movido e redimensionado sem atrapalhar a reunião
- **Histórico de reuniões** - Salva automaticamente todas as legendas localmente para consulta posterior
- **Opções de exportação** - Exporte legendas e traduções para arquivos de texto
- **Traduções editáveis** - Clique em qualquer tradução para editá-la manualmente
- **Fallback inteligente** - Alterna automaticamente o modelo quando os limites de uso são atingidos
- **Privacidade em primeiro lugar** - Todos os dados são armazenados localmente, sem servidores externos

## Capturas de tela

![MeetCaptioner Demo](documents/deployment/images/github/demo.png)

_Captura de legendas e tradução com IA em tempo real no Google Meet_

## Instalação

### A partir do código-fonte

1. **Clone o repositório**

   ```bash
   git clone https://github.com/LeHoangTuanbk/MeetCaptioner
   cd meet-captioner
   ```

2. **Instale as dependências**

   ```bash
   pnpm install
   ```

3. **Compile a extensão**

   ```bash
   # Modo de desenvolvimento com hot reload
   pnpm dev

   # Build de produção
   pnpm build
   ```

4. **Carregue no Chrome**
   - Abra `chrome://extensions/`
   - Ative o “Modo do desenvolvedor”
   - Clique em “Carregar sem compactação”
   - Selecione o diretório `.output/chrome-mv3`

### A partir de uma versão publicada

1. Baixe o arquivo `.zip` mais recente em [Releases](https://github.com/LeHoangTuanbk/MeetCaptioner/releases)
2. Extraia o arquivo ZIP
3. Carregue a extensão no Chrome seguindo as etapas acima

## Configuração

1. Clique no ícone da extensão e abra **Settings**
2. Escolha um provedor de IA: OpenAI, Anthropic, Google Gemini, DeepSeek ou Ollama
3. Insira sua chave de API ou configure a URL do Ollama para um LLM local
4. Selecione o modelo e o idioma de destino
5. Ative a tradução no painel flutuante

### Provedores de IA compatíveis

| Provedor | Modelos |
| -------- | ------- |
| OpenAI | GPT-4.1 Nano, GPT-4.1 Mini, GPT-5 Nano |
| Anthropic | Claude Haiku 4.5, Claude Sonnet 4.5, Claude Opus 4.5 |
| Gemini | Gemini 3.1 Flash-Lite, Gemini 3.5 Flash, Gemini 3.1 Pro (Preview) |
| DeepSeek | DeepSeek Flash |
| Ollama | Qualquer modelo local (Qwen, Llama, Gemma etc.) ou Ollama Cloud |

> **Observação:** o Ollama local requer a configuração de CORS. Consulte o [guia de configuração](https://objectgraph.com/blog/ollama-cors/).
>
> **Gemini:** obtenha uma chave de API gratuita no [Google AI Studio](https://aistudio.google.com/app/apikey).

### Idiomas compatíveis

Tiếng Việt (Vietnamese), English (English), 廣東話（繁體） (Chinese, Cantonese (Traditional)), 普通话（简体中文） (Chinese, Mandarin (Simplified)), 國語（繁體中文） (Chinese, Mandarin (Traditional)), 日本語 (Japanese), 한국어 (Korean), Español (Spanish), Français (French), Deutsch (German), Português (Portuguese), Русский (Russian), العربية (Arabic), हिन्दी (Hindi), Italiano (Italian), ไทย (Thai), Монгол (Mongolian), မြန်မာ (Burmese), Bahasa Indonesia (Indonesian), Nederlands (Dutch), Polski (Polish), Türkçe (Turkish), বাংলা (Bengali), اردو (Urdu), Bahasa Melayu (Malay), Filipino (Filipino), தமிழ் (Tamil), తెలుగు (Telugu), मराठी (Marathi), ગુજરાતી (Gujarati), ਪੰਜਾਬੀ (Punjabi), Українська (Ukrainian), Čeština (Czech), Română (Romanian), Magyar (Hungarian), Ελληνικά (Greek), Svenska (Swedish), Dansk (Danish), Norsk (Norwegian), Suomi (Finnish), עברית (Hebrew), فارسی (Persian), Kiswahili (Swahili), Català (Catalan), Български (Bulgarian), Српски (Serbian)

## Tecnologias

- **Framework**: [WXT](https://wxt.dev) - Framework moderno para Web Extensions
- **UI**: React 19 + TypeScript
- **Estilos**: Tailwind CSS 4
- **Build**: Vite
- **Gerenciador de pacotes**: pnpm

## Estrutura do projeto

```text
meet-captioner/
├── entrypoints/
│   ├── content/          # Captura de legendas e painel flutuante
│   ├── background.ts     # Service worker
│   ├── popup/            # Popup da extensão
│   ├── options/          # Página de configurações
│   └── history/          # Histórico de reuniões
├── public/               # Recursos estáticos
└── wxt.config.ts         # Configuração do WXT
```

## Desenvolvimento

```bash
# Inicie o servidor de desenvolvimento
pnpm dev

# Compile para produção
pnpm build

# Crie o ZIP de distribuição
pnpm zip
```

## Contribuição

Contribuições são bem-vindas. Você pode enviar um Pull Request:

1. Faça um fork do repositório
2. Crie uma branch (`git checkout -b feature/amazing-feature`)
3. Faça o commit (`git commit -m 'Add some amazing feature'`)
4. Envie a branch (`git push origin feature/amazing-feature`)
5. Abra um Pull Request

### Diretrizes de desenvolvimento

- Siga o estilo de código existente
- Escreva mensagens de commit claras
- Teste as alterações cuidadosamente
- Atualize a documentação quando necessário

## Licença

Este projeto é distribuído sob a licença MIT. Consulte [LICENSE](LICENSE) para mais detalhes.

## Agradecimentos

- [WXT](https://wxt.dev) pelo excelente framework para extensões
- [Tailwind CSS](https://tailwindcss.com) pelas ferramentas CSS utility-first
- [OpenAI](https://openai.com), [Anthropic](https://anthropic.com), [Google Gemini](https://ai.google.dev), [DeepSeek](https://www.deepseek.com) e [Ollama](https://ollama.com) pelas APIs de IA

---

Criado com dedicação por [Le Hoang Tuan](https://github.com/LeHoangTuanbk).
