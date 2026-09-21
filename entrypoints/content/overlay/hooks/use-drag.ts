import { useEffect, type RefObject } from "react";

export function useDrag(
  elementRef: RefObject<HTMLElement | null>,
  handleRef: RefObject<HTMLElement | null>,
  enabled: boolean
): void {
  useEffect(() => {
    const element = elementRef.current;
    const handle = handleRef.current;
    if (!element || !handle || !enabled) return;

    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    const drag = (event: MouseEvent) => {
      event.preventDefault();
      const minVisible = 100;
      const maxLeft = window.innerWidth - minVisible;
      const maxTop = window.innerHeight - 50;
      const minLeft = minVisible - element.offsetWidth;

      const left = Math.max(
        minLeft,
        Math.min(maxLeft, startLeft + event.clientX - startX)
      );
      const top = Math.max(0, Math.min(maxTop, startTop + event.clientY - startY));

      Object.assign(element.style, {
        left: `${left}px`,
        top: `${top}px`,
        right: "auto",
        bottom: "auto",
      });
    };

    const stopDragging = () => {
      document.removeEventListener("mousemove", drag);
      document.removeEventListener("mouseup", stopDragging);
    };

    const startDragging = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest("button, select, input, textarea")) return;

      event.preventDefault();
      event.stopPropagation();
      const rect = element.getBoundingClientRect();
      startX = event.clientX;
      startY = event.clientY;
      startLeft = rect.left;
      startTop = rect.top;
      document.addEventListener("mousemove", drag);
      document.addEventListener("mouseup", stopDragging);
    };

    handle.addEventListener("mousedown", startDragging);
    return () => {
      handle.removeEventListener("mousedown", startDragging);
      stopDragging();
    };
  }, [elementRef, enabled, handleRef]);
}
