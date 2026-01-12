export function makeResizable(
  element: HTMLElement,
  handle: HTMLElement,
  corner: "br" | "bl" | "b"
): void {
  let startX = 0;
  let startY = 0;
  let startWidth = 0;
  let startHeight = 0;
  let startLeft = 0;
  let isResizing = false;

  handle.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    isResizing = true;
    startX = e.clientX;
    startY = e.clientY;
    startWidth = element.offsetWidth;
    startHeight = element.offsetHeight;
    startLeft = element.getBoundingClientRect().left;

    const cursors = { br: "nwse-resize", bl: "nesw-resize", b: "ns-resize" };
    document.body.style.cursor = cursors[corner];
    document.body.style.userSelect = "none";

    document.addEventListener("mousemove", resize);
    document.addEventListener("mouseup", stopResize);
  });

  function resize(e: MouseEvent): void {
    if (!isResizing) return;
    e.preventDefault();

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    const newHeight = Math.max(200, startHeight + deltaY);
    element.style.height = newHeight + "px";

    if (corner === "br") {
      const newWidth = Math.max(520, startWidth + deltaX);
      element.style.width = newWidth + "px";
    } else if (corner === "bl") {
      const newWidth = Math.max(520, startWidth - deltaX);
      element.style.width = newWidth + "px";
      element.style.left = startLeft + deltaX + "px";
      element.style.right = "auto";
    }
  }

  function stopResize(): void {
    isResizing = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    document.removeEventListener("mousemove", resize);
    document.removeEventListener("mouseup", stopResize);
  }
}

export function makeDraggable(element: HTMLElement, handle: HTMLElement): void {
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;
  let isDragging = false;

  handle.addEventListener("mousedown", dragStart);

  function dragStart(e: MouseEvent): void {
    if (
      (e.target as HTMLElement).tagName === "BUTTON" ||
      (e.target as HTMLElement).tagName === "SELECT"
    ) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;

    const rect = element.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;

    document.addEventListener("mousemove", drag);
    document.addEventListener("mouseup", dragEnd);
  }

  function drag(e: MouseEvent): void {
    if (!isDragging) return;
    e.preventDefault();

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    let newLeft = startLeft + deltaX;
    let newTop = startTop + deltaY;

    const minVisible = 100;
    const maxLeft = window.innerWidth - minVisible;
    const maxTop = window.innerHeight - 50;
    const minLeft = minVisible - element.offsetWidth;
    const minTop = 0;

    newLeft = Math.max(minLeft, Math.min(maxLeft, newLeft));
    newTop = Math.max(minTop, Math.min(maxTop, newTop));

    element.style.left = newLeft + "px";
    element.style.top = newTop + "px";
    element.style.right = "auto";
    element.style.bottom = "auto";
  }

  function dragEnd(): void {
    isDragging = false;
    document.removeEventListener("mousemove", drag);
    document.removeEventListener("mouseup", dragEnd);
  }
}
