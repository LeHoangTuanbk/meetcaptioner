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

function collectShadowHosts(root: ParentNode): Element[] {
  const hosts: Element[] = [];

  const treeWalker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT,
    null
  );

  let currentNode = treeWalker.currentNode as Element | null;
  while (currentNode) {
    if (currentNode.shadowRoot) {
      hosts.push(currentNode);
    }
    currentNode = treeWalker.nextNode() as Element | null;
  }

  return hosts;
}

export function querySelectorAllDeep(selector: string, root: ParentNode = document): Element[] {
  const results = new Set<Element>();

  if ("querySelectorAll" in root) {
    for (const element of Array.from(root.querySelectorAll(selector))) {
      results.add(element);
    }
  }

  for (const host of collectShadowHosts(root)) {
    if (host.shadowRoot) {
      for (const element of querySelectorAllDeep(selector, host.shadowRoot)) {
        results.add(element);
      }
    }
  }

  return Array.from(results);
}

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
