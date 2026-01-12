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
    } else if (
      key === "value" &&
      (el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement)
    ) {
      el.value = value as string;
    } else if (key === "rows" && el instanceof HTMLTextAreaElement) {
      el.rows = value as number;
    } else if (
      key.toLowerCase().startsWith("on") &&
      typeof value === "function"
    ) {
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
