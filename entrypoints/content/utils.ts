type ElementAttrs = {
  className?: string;
  textContent?: string;
  value?: string;
  id?: string;
  "data-tooltip"?: string;
  "data-caption-id"?: string | number;
  rows?: number;
  onClick?: (e: Event) => void;
  onChange?: (e: Event) => void;
  onBlur?: (e: Event) => void;
  onKeydown?: (e: KeyboardEvent) => void;
  [key: string]: unknown;
};

export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: ElementAttrs = {},
  children: (HTMLElement | string | null)[] = []
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);

  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null) continue;

    if (key === "className") {
      el.className = value as string;
    } else if (key === "textContent") {
      el.textContent = value as string;
    } else if (key === "value" && (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)) {
      el.value = value as string;
    } else if (key === "rows" && el instanceof HTMLTextAreaElement) {
      el.rows = value as number;
    } else if (key.toLowerCase().startsWith("on") && typeof value === "function") {
      el.addEventListener(key.slice(2).toLowerCase(), value as EventListener);
    } else if (typeof value === "string" || typeof value === "number") {
      el.setAttribute(key, String(value));
    }
  }

  for (const child of children) {
    if (typeof child === "string") {
      el.appendChild(document.createTextNode(child));
    } else if (child) {
      el.appendChild(child);
    }
  }

  return el;
}

export function stripPunctuation(text: string): string {
  return text.replace(/[。、！？.!?,\s・「」『』（）()【】\[\]]/g, "");
}

export function isTextGrowing(oldText: string, newText: string): boolean {
  const oldStripped = stripPunctuation(oldText);
  const newStripped = stripPunctuation(newText);

  if (newStripped.length <= oldStripped.length) return false;

  if (newStripped.startsWith(oldStripped)) return true;

  const checkLen = Math.max(5, Math.floor(oldStripped.length * 0.8));
  if (newStripped.slice(0, checkLen) === oldStripped.slice(0, checkLen)) {
    return true;
  }

  let matchCount = 0;
  const compareLen = Math.min(oldStripped.length, newStripped.length);
  for (let i = 0; i < compareLen; i++) {
    if (oldStripped[i] === newStripped[i]) matchCount++;
  }
  if (matchCount >= oldStripped.length * 0.9) {
    return true;
  }

  return false;
}

export function isSimilarText(text1: string, text2: string): boolean {
  const s1 = stripPunctuation(text1);
  const s2 = stripPunctuation(text2);

  if (s1 === s2) return true;

  if (s1.includes(s2) || s2.includes(s1)) return true;

  const shorter = s1.length <= s2.length ? s1 : s2;
  const longer = s1.length > s2.length ? s1 : s2;
  if (shorter.length > 5) {
    let matchCount = 0;
    for (let i = 0; i < shorter.length; i++) {
      if (shorter[i] === longer[i]) matchCount++;
    }
    if (matchCount >= shorter.length * 0.9) return true;
  }

  return false;
}

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return function (...args: Parameters<T>) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
