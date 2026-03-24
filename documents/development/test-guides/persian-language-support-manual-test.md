# Persian Language Support Manual Test Guide

## Purpose

This guide explains how to test Persian target-language support locally without relying only on implementation-side validation.

This branch already includes the direction-support foundation, so Persian can be tested in the same local build.

## Branch

- Expected branch: `feature/add-persian-language-support`

## Prerequisites

- Node.js installed
- `pnpm` available through Corepack or local install
- Google Chrome or a Chromium-based browser
- Access to a Google Meet session where Closed Captions can be enabled
- At least one configured translation provider:
  - OpenAI
  - Anthropic
  - Ollama

## Local Setup

Run these commands from the repository root:

```bash
pnpm install
pnpm build
```

Expected build output directory:

```text
.output/chrome-mv3
```

## Load The Extension Locally

1. Open `chrome://extensions/`
2. Turn on `Developer mode`
3. Click `Load unpacked`
4. Select the folder `.output/chrome-mv3`

## Configure Translation

1. Open the extension
2. Go to `Settings`
3. Choose a provider
4. Enter a valid API key if required
5. Save settings

## Persian Target-Language Test

1. Open a Google Meet session
2. Enable Google Meet Closed Captions
3. In the MeetCaptioner overlay, open the target-language dropdown
4. Confirm that `Persian` appears in the list
5. Select `Persian`
6. Confirm that translation starts automatically after the dropdown change
7. Speak or wait for a caption to appear

## Expected Results

- `Persian` is available in the target-language dropdown
- selecting `Persian` does not break the overlay
- changing the dropdown clears previous translation text before new requests finish
- changing the dropdown automatically starts translation for existing captions
- translated captions appear
- translated text renders with RTL direction
- editing a translation keeps RTL direction
- opening history shows translation text with the same direction behavior

## Regression Checks

Repeat a quick pass with `English` selected:

- translation still works
- translated text remains LTR
- overlay behavior remains normal
- history remains readable

## Suggested Test Cases

## Case 1: English Speech To Persian Translation

- Speak simple English sentences
- Confirm Persian translation appears

## Case 2: Mixed Technical Content

- Speak content with terms like `API`, `URL`, `OpenAI`, numbers, and dates
- Confirm Persian translation remains readable

## Case 3: History View

- Finish a short meeting or wait for captions to be saved
- Open the extension history page
- Open the saved session
- Confirm translation text is readable and direction-aware

## Case 4: Manual Edit

- Click an existing translation in the overlay
- Edit the text
- Confirm the edit textarea still uses the expected RTL direction

## Case 5: Manual Re-Translate Reset

- wait for a caption to get translated
- click `Translate` or `↻`
- confirm the old translated text is cleared immediately
- confirm the new translation or any new error state replaces the cleared state

## Notes

- If you are testing against the current Persian branch, remember it is stacked on top of the static-direction-support branch
- If provider configuration is missing, translation may fail even though Persian support itself is wired correctly
- If provider configuration is missing and you change the dropdown, the selected language should still be saved, and the options page should open so configuration can be fixed
- For Ollama, local connectivity and model setup still need to be valid
