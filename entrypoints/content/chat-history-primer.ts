const CHAT_ROOT_SELECTOR = '[jsname="xySENc"][aria-live="polite"]';
const CHAT_BUTTON_SELECTOR = 'button[jsname="A5il2e"][data-panel-id="2"]';
const CHAT_MOUNT_TIMEOUT = 1500;

export const findChatRoot = (): HTMLElement | null =>
  document.querySelector<HTMLElement>(CHAT_ROOT_SELECTOR);

const waitForChatRoot = (): Promise<HTMLElement | null> =>
  new Promise((resolve) => {
    const existingRoot = findChatRoot();
    if (existingRoot) {
      resolve(existingRoot);
      return;
    }

    const observer = new MutationObserver(() => {
      const root = findChatRoot();
      if (!root) return;

      observer.disconnect();
      clearTimeout(timeout);
      resolve(root);
    });
    const timeout = setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, CHAT_MOUNT_TIMEOUT);

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  });

const createPanelMask = (panelId: string | null): HTMLStyleElement | null => {
  if (!panelId) return null;

  const style = document.createElement("style");
  style.textContent = `
    #${CSS.escape(panelId)} {
      visibility: hidden !important;
      opacity: 0 !important;
      transition: none !important;
      animation: none !important;
      pointer-events: none !important;
    }
  `;
  document.documentElement.appendChild(style);
  return style;
};

/** Mounts Meet chat once so its message DOM remains available after closing. */
export const primeChatHistory = async (): Promise<HTMLElement | null> => {
  const existingRoot = findChatRoot();
  if (existingRoot) return existingRoot;

  const button = document.querySelector<HTMLButtonElement>(
    CHAT_BUTTON_SELECTOR,
  );
  if (!button) return null;

  if (button.getAttribute("aria-expanded") === "true") {
    return waitForChatRoot();
  }

  const previouslyExpandedPanel = Array.from(
    document.querySelectorAll<HTMLButtonElement>(
      'button[data-panel-id][aria-expanded="true"]',
    ),
  ).find((panelButton) => panelButton !== button);
  const panelMask = createPanelMask(button.getAttribute("aria-controls"));
  button.click();
  const root = await waitForChatRoot();

  const currentChatButton =
    document.querySelector<HTMLButtonElement>(CHAT_BUTTON_SELECTOR) ?? button;
  currentChatButton.click();
  if (
    previouslyExpandedPanel?.isConnected &&
    previouslyExpandedPanel.getAttribute("aria-expanded") !== "true"
  ) {
    previouslyExpandedPanel.click();
  }

  setTimeout(() => panelMask?.remove(), 100);

  return root;
};
