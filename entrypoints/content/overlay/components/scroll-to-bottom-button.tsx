import { useCallback, useEffect, useState, type RefObject } from "react";

type ScrollToBottomButtonProps = {
  contentRef: RefObject<HTMLDivElement | null>;
  contentVersion: number;
};

export function ScrollToBottomButton({ contentRef, contentVersion }: ScrollToBottomButtonProps) {
  const [visible, setVisible] = useState(false);

  const updateVisibility = useCallback(() => {
    const content = contentRef.current;
    if (!content) return;
    setVisible(content.scrollHeight - content.scrollTop - content.clientHeight >= 100);
  }, [contentRef]);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    content.addEventListener("scroll", updateVisibility, { passive: true });
    const observer = new ResizeObserver(updateVisibility);
    observer.observe(content);
    requestAnimationFrame(updateVisibility);
    return () => {
      content.removeEventListener("scroll", updateVisibility);
      observer.disconnect();
    };
  }, [contentRef, updateVisibility]);

  useEffect(() => {
    requestAnimationFrame(updateVisibility);
  }, [contentVersion, updateVisibility]);

  return (
    <button
      type="button"
      title="Scroll to bottom"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      onClick={() => contentRef.current?.scrollTo({ top: contentRef.current.scrollHeight, behavior: "smooth" })}
      className={`absolute right-4 bottom-4 z-10 flex size-5 items-center justify-center rounded-full border-0 bg-white/15 text-[8px] text-white/70 transition hover:bg-white/25 hover:text-white/90 ${
        visible ? "cursor-pointer opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      ↓
    </button>
  );
}
