let contentElement: HTMLElement | null = null;

export function registerContentElement(element: HTMLElement | null): void {
  contentElement = element;
}

export function getContentElement(): HTMLElement | null {
  return contentElement;
}

export function scrollToBottomIfNeeded(): void {
  requestAnimationFrame(() => {
    if (!contentElement) return;
    if (contentElement.querySelector("textarea")) return;

    const distanceFromBottom =
      contentElement.scrollHeight -
      contentElement.scrollTop -
      contentElement.clientHeight;

    if (distanceFromBottom < 100) {
      contentElement.scrollTop = contentElement.scrollHeight;
    }
  });
}
