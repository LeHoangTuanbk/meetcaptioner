export function createScrollButton(
  content: HTMLElement,
  overlay: HTMLElement
): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.className = "mc-scroll-bottom";
  btn.textContent = "↓";
  btn.title = "Scroll to bottom";

  Object.assign(btn.style, {
    position: "absolute",
    bottom: "16px",
    right: "16px",
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    background: "rgba(255, 255, 255, 0.15)",
    border: "none",
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: "8px",
    cursor: "pointer",
    opacity: "0",
    transition: "all 0.2s ease",
    zIndex: "10",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  });

  btn.addEventListener("click", () => {
    content.scrollTo({
      top: content.scrollHeight,
      behavior: "smooth",
    });
  });

  btn.addEventListener("mouseenter", () => {
    btn.style.background = "rgba(255, 255, 255, 0.25)";
    btn.style.color = "rgba(255, 255, 255, 0.9)";
  });

  btn.addEventListener("mouseleave", () => {
    btn.style.background = "rgba(255, 255, 255, 0.15)";
    btn.style.color = "rgba(255, 255, 255, 0.7)";
  });

  const updateVisibility = () => {
    const isNearBottom =
      content.scrollHeight - content.scrollTop - content.clientHeight < 100;
    if (isNearBottom) {
      btn.style.opacity = "0";
      btn.style.pointerEvents = "none";
    } else {
      btn.style.opacity = "1";
      btn.style.pointerEvents = "auto";
    }
  };

  content.addEventListener("scroll", updateVisibility);

  const observer = new MutationObserver(updateVisibility);
  observer.observe(content, { childList: true, subtree: true });

  setTimeout(updateVisibility, 100);

  // Hide when overlay is minimized
  const minimizedObserver = new MutationObserver(() => {
    if (overlay.classList.contains("minimized")) {
      btn.style.display = "none";
    } else {
      btn.style.display = "flex";
    }
  });
  minimizedObserver.observe(overlay, {
    attributes: true,
    attributeFilter: ["class"],
  });

  return btn;
}
