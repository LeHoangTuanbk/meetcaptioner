import type { ContentScriptContext } from "wxt/utils/content-script-context";
import { addChatMessageToHistory } from "@content/history-service";
import type { SavedChatMessage } from "@content/types";
import { findChatRoot, primeChatHistory } from "@content/chat-history-primer";

const GROUP_SELECTOR = '[jsname="Ypafjf"], .Ss4fHf';
const MESSAGE_SELECTOR = "[data-message-id]";
const TEXT_SELECTOR = '[jsname="dTKtvb"]';
const AUTHOR_SELECTOR = '.poVWob, [data-sender-name], [jsname="A9tUt"]';
const TIME_SELECTOR = '[jsname="biJjHb"], .MuzmKe';
const GROUP_HEADER_SELECTOR = ".HNucUd";
const OWN_MESSAGE_GROUP_CLASS = "ydIQ1d";

const capturedMessages = new Map<string, SavedChatMessage>();

const readText = (element: Element | null): string =>
  element?.textContent?.trim() ?? "";

const readGroupAuthor = (group: HTMLElement, time: string): string => {
  const knownAuthor = readText(group.querySelector(AUTHOR_SELECTOR));
  if (knownAuthor) return knownAuthor;

  const header = group.querySelector(GROUP_HEADER_SELECTOR);
  if (!header) return "";

  const candidates = Array.from(header.querySelectorAll<HTMLElement>("*"))
    .filter((element) => element.children.length === 0)
    .filter((element) => !element.matches(TIME_SELECTOR))
    .map((element) => readText(element))
    .filter((text) => text && text !== time);

  return candidates[0] ?? "";
};

const hasMessageChanged = (
  previous: SavedChatMessage | undefined,
  next: SavedChatMessage,
): boolean =>
  !previous ||
  previous.author !== next.author ||
  previous.time !== next.time ||
  previous.text !== next.text;

const extractMessages = (root: HTMLElement): SavedChatMessage[] => {
  const messages: SavedChatMessage[] = [];

  root.querySelectorAll<HTMLElement>(GROUP_SELECTOR).forEach((group) => {
    const time = readText(group.querySelector(TIME_SELECTOR));
    const groupAuthor = readGroupAuthor(group, time);
    const isOwnGroup = group.classList.contains(OWN_MESSAGE_GROUP_CLASS);

    group.querySelectorAll<HTMLElement>(MESSAGE_SELECTOR).forEach((node) => {
      const id = node.dataset.messageId;
      const text = readText(node.querySelector(TEXT_SELECTOR));
      if (!id || !text) return;

      const previous = capturedMessages.get(id);
      const detectedAuthor =
        groupAuthor || (isOwnGroup ? "You" : "Unknown");
      const author =
        detectedAuthor === "Unknown" && previous?.author
          ? previous.author
          : detectedAuthor;
      const message = {
        id,
        author,
        time: time || previous?.time || "",
        text,
        timestamp: previous?.timestamp ?? Date.now(),
      };
      if (!hasMessageChanged(previous, message)) return;

      capturedMessages.set(id, message);
      messages.push(message);
    });
  });

  return messages;
};

const saveMessages = (root: HTMLElement): void => {
  extractMessages(root).forEach(addChatMessageToHistory);
};

/** Initializes and captures Meet chat for the current meeting. */
export const startChatHistoryCapture = (ctx: ContentScriptContext): void => {
  let isActive = false;
  let activationId = 0;
  let currentRoot: HTMLElement | null = null;
  let rootObserver: MutationObserver | null = null;
  let rootPollTimer: ReturnType<typeof setInterval> | null = null;
  let primeTimer: ReturnType<typeof setTimeout> | null = null;
  let primingActivation: number | null = null;

  const attachRoot = (root: HTMLElement): void => {
    if (root === currentRoot) return;
    rootObserver?.disconnect();
    currentRoot = root;
    saveMessages(root);
    rootObserver = new MutationObserver(() => saveMessages(root));
    rootObserver.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  };

  const ensureRoot = async (expectedActivation: number): Promise<void> => {
    if (!isActive || expectedActivation !== activationId) return;

    const existingRoot = findChatRoot();
    if (existingRoot) {
      attachRoot(existingRoot);
      return;
    }
    if (primeTimer) return;
    if (primingActivation === expectedActivation) return;

    primingActivation = expectedActivation;
    const root = await primeChatHistory();
    if (primingActivation === expectedActivation) primingActivation = null;
    if (!isActive || expectedActivation !== activationId) return;

    if (root) {
      attachRoot(root);
      return;
    }
    if (!primeTimer) {
      primeTimer = setTimeout(() => {
        primeTimer = null;
        void ensureRoot(expectedActivation);
      }, 1000);
    }
  };

  const refreshRoot = (): void => {
    if (!isActive) return;
    const root = findChatRoot();
    if (root) attachRoot(root);
    else void ensureRoot(activationId);
  };

  const deactivate = (): void => {
    isActive = false;
    activationId += 1;
    primingActivation = null;
    rootObserver?.disconnect();
    rootObserver = null;
    currentRoot = null;
    if (rootPollTimer) clearInterval(rootPollTimer);
    rootPollTimer = null;
    if (primeTimer) clearTimeout(primeTimer);
    primeTimer = null;
  };

  const activate = async (): Promise<void> => {
    if (isActive) return;
    isActive = true;
    const currentActivation = ++activationId;
    rootPollTimer = setInterval(refreshRoot, 2000);

    await ensureRoot(currentActivation);
  };

  void activate();
  ctx.onInvalidated(() => {
    deactivate();
  });
};
