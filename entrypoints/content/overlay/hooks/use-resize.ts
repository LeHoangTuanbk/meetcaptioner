import { useEffect, type RefObject } from "react";

type ResizeDirection = "br" | "bl" | "b";

export function useResize(
  elementRef: RefObject<HTMLElement | null>,
  handleRef: RefObject<HTMLElement | null>,
  direction: ResizeDirection,
  enabled: boolean
): void {
  useEffect(() => {
    const element = elementRef.current;
    const handle = handleRef.current;
    if (!element || !handle || !enabled) return;

    let startX = 0;
    let startY = 0;
    let startWidth = 0;
    let startHeight = 0;
    let startLeft = 0;
    let previousCursor = "";
    let previousUserSelect = "";

    const resize = (event: MouseEvent) => {
      event.preventDefault();
      const deltaX = event.clientX - startX;
      const deltaY = event.clientY - startY;
      element.style.height = `${Math.max(200, startHeight + deltaY)}px`;

      if (direction === "br") {
        element.style.width = `${Math.max(520, startWidth + deltaX)}px`;
      } else if (direction === "bl") {
        element.style.width = `${Math.max(520, startWidth - deltaX)}px`;
        element.style.left = `${startLeft + deltaX}px`;
        element.style.right = "auto";
      }
    };

    const stopResizing = () => {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      document.removeEventListener("mousemove", resize);
      document.removeEventListener("mouseup", stopResizing);
    };

    const startResizing = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const rect = element.getBoundingClientRect();
      startX = event.clientX;
      startY = event.clientY;
      startWidth = element.offsetWidth;
      startHeight = element.offsetHeight;
      startLeft = rect.left;
      previousCursor = document.body.style.cursor;
      previousUserSelect = document.body.style.userSelect;
      document.body.style.cursor =
        direction === "br" ? "nwse-resize" : direction === "bl" ? "nesw-resize" : "ns-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", resize);
      document.addEventListener("mouseup", stopResizing);
    };

    handle.addEventListener("mousedown", startResizing);
    return () => {
      handle.removeEventListener("mousedown", startResizing);
      stopResizing();
    };
  }, [direction, elementRef, enabled, handleRef]);
}
