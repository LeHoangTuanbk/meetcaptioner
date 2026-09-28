import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

const BOTTOM_THRESHOLD_PX = 100;

export const useStickToBottom = (
  contentRef: RefObject<HTMLElement | null>,
  contentVersion: number,
  enabled: boolean
): void => {
  const shouldStickRef = useRef(true);

  useEffect(() => {
    const content = contentRef.current;
    if (!content || !enabled) return;

    const updateStickiness = () => {
      const distanceFromBottom =
        content.scrollHeight - content.scrollTop - content.clientHeight;
      shouldStickRef.current = distanceFromBottom < BOTTOM_THRESHOLD_PX;
    };

    content.addEventListener("scroll", updateStickiness, { passive: true });
    return () => content.removeEventListener("scroll", updateStickiness);
  }, [contentRef, enabled]);

  useLayoutEffect(() => {
    const content = contentRef.current;
    if (
      !content ||
      !enabled ||
      !shouldStickRef.current ||
      content.querySelector("textarea")
    ) {
      return;
    }

    content.scrollTop = content.scrollHeight;
  }, [contentRef, contentVersion, enabled]);
};
