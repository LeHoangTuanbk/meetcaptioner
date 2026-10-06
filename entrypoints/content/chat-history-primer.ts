const CHAT_ROOT_SELECTOR = '[jsname="xySENc"][aria-live="polite"]';
const CHAT_ROOT_SELECTORS = [CHAT_ROOT_SELECTOR, '[jsname="iyUusd"]'] as const;
const CHAT_BUTTON_SELECTORS = [
  'button[jsname="A5il2e"][data-panel-id="2"]',
  'button[data-panel-id="2"]',
] as const;
const CHAT_MOUNT_TIMEOUT = 1500;
const attemptedPanelIds = new Set<string>();
const attemptedButtons = new WeakSet<HTMLButtonElement>();

const findChatButton = (): HTMLButtonElement | null => {
  for (const selector of CHAT_BUTTON_SELECTORS) {
    const button = document.querySelector<HTMLButtonElement>(selector);
    if (button) return button;
  }

  const controlledButtons = Array.from(
    document.querySelectorAll<HTMLButtonElement>("button[aria-controls]"),
  );
  return (
    controlledButtons.find((button) => {
      const panel = getControlledPanel(button);
      return Boolean(
        panel?.querySelector<HTMLElement>(
          '[jsname="xySENc"], [jsname="iyUusd"], [jsname="gkA7Yd"]',
        ),
      );
    }) ?? null
  );
};

const getControlledPanel = (
  button: HTMLButtonElement | null,
): HTMLElement | null => {
  const panelId = button?.getAttribute("aria-controls");
  return panelId ? document.getElementById(panelId) : null;
};

const isVisible = (element: HTMLElement): boolean => {
  const style = window.getComputedStyle(element);
  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    element.getClientRects().length > 0
  );
};

const isChatOpen = (button: HTMLButtonElement): boolean => {
  const expanded = button.getAttribute("aria-expanded");
  if (expanded === "true") return true;
  if (expanded === "false") return false;
  const panel = getControlledPanel(button);
  return panel ? isVisible(panel) : false;
};

export const findChatRoot = (): HTMLElement | null => {
  for (const selector of CHAT_ROOT_SELECTORS) {
    const root = document.querySelector<HTMLElement>(selector);
    if (root) return root;
  }

  const panel = getControlledPanel(findChatButton());
  if (!panel) return null;
  const root = panel.querySelector<HTMLElement>(
      '[aria-live="polite"], [jsname="iyUusd"], [jsname="Ypafjf"], [data-message-id]',
    ) ?? panel;
  return root;
};

export const isChatPanelOpen = (): boolean => {
  const button = findChatButton();
  return button ? isChatOpen(button) : false;
};

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

const waitForChatOpen = (button: HTMLButtonElement): Promise<void> =>
  new Promise((resolve) => {
    const deadline = Date.now() + 500;
    const check = (): void => {
      if (isChatOpen(button) || Date.now() >= deadline) {
        resolve();
        return;
      }
      setTimeout(check, 25);
    };
    check();
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
  const button = findChatButton();
  if (!button) return null;

  const existingRoot = findChatRoot();
  if (existingRoot && isChatOpen(button)) return existingRoot;

  if (isChatOpen(button)) {
    return waitForChatRoot();
  }

  const previouslyExpandedPanel = Array.from(
    document.querySelectorAll<HTMLButtonElement>(
      'button[data-panel-id][aria-expanded="true"]',
    ),
  ).find((panelButton) => panelButton !== button);
  const panelMask = createPanelMask(button.getAttribute("aria-controls"));
  const openedByUs = !isChatOpen(button);
  const panelId = button.getAttribute("aria-controls");
  const hasAlreadyAttempted = panelId
    ? attemptedPanelIds.has(panelId)
    : attemptedButtons.has(button);

  if (hasAlreadyAttempted) {
    panelMask?.remove();
    return waitForChatRoot();
  }

  if (openedByUs) {
    if (panelId) attemptedPanelIds.add(panelId);
    else attemptedButtons.add(button);
    button.click();
    await waitForChatOpen(button);
  }
  const root = await waitForChatRoot();

  const currentChatButton = findChatButton() ?? button;
  if (root && openedByUs && isChatOpen(currentChatButton)) {
    currentChatButton.click();
  }
  if (
    previouslyExpandedPanel?.isConnected &&
    previouslyExpandedPanel.getAttribute("aria-expanded") !== "true"
  ) {
    previouslyExpandedPanel.click();
  }

  setTimeout(() => panelMask?.remove(), 100);

  return root;
};
