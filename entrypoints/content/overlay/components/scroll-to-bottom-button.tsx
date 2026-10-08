import { useCallback, useEffect, useState, type RefObject } from "react";
import { ArrowDownIcon } from "@phosphor-icons/react";

type ScrollToBottomButtonProps = {
  contentRef: RefObject<HTMLDivElement | null>;
  contentVersion: number;
};

export function ScrollToBottomButton({
  contentRef,
  contentVersion,
}: ScrollToBottomButtonProps) {
  const [visible, setVisible] = useState(false);

  const updateVisibility = useCallback(() => {
    const content = contentRef.current;
    if (!content) return;
    setVisible(
      content.scrollHeight - content.scrollTop - content.clientHeight >= 100,
    );
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
      onClick={() =>
        contentRef.current?.scrollTo({
          top: contentRef.current.scrollHeight,
          behavior: "smooth",
        })
      }
      className={`absolute right-4 bottom-4 z-10 flex size-7 items-center justify-center rounded-full border-0 bg-[#3a3a55] text-(--mc-overlay-caption) shadow-[0_2px_10px_rgba(0,0,0,0.5)] ring-1 ring-[#4d4d6b] transition hover:scale-105 hover:bg-[#46466a] hover:text-white ${
        visible ? "cursor-pointer" : "pointer-events-none invisible"
      }`}
    >
      <ArrowDownIcon className="size-4" weight="bold" />
    </button>
  );
}
