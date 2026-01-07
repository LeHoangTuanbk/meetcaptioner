import { captions } from "./state";

export function exportToFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function formatCaptionsOnly(): string {
  if (captions.length === 0) return "";
  return captions.map((c) => `[${c.time}] ${c.speaker}: ${c.text}`).join("\n");
}

export function formatTranslationsOnly(): string {
  if (captions.length === 0) return "";
  return captions
    .filter((c) => c.translation)
    .map((c) => `[${c.time}] ${c.speaker}: ${c.translation}`)
    .join("\n");
}

export function formatBoth(): string {
  if (captions.length === 0) return "";
  return captions
    .map((c) => {
      let line = `[${c.time}] ${c.speaker}:\n  Original: ${c.text}`;
      if (c.translation) {
        line += `\n  Translation: ${c.translation}`;
      }
      return line;
    })
    .join("\n\n");
}

export function exportCaptions(type: "captions" | "translations" | "both"): void {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, "");
  let content: string;
  let filename: string;

  switch (type) {
    case "captions":
      content = formatCaptionsOnly();
      filename = `captions_${timestamp}.txt`;
      break;
    case "translations":
      content = formatTranslationsOnly();
      filename = `translations_${timestamp}.txt`;
      break;
    case "both":
      content = formatBoth();
      filename = `captions_translations_${timestamp}.txt`;
      break;
    default:
      return;
  }

  if (!content) {
    console.log("[MeetCaptioner] No content to export");
    return;
  }

  exportToFile(content, filename);
}
