import { captions, isCCEnabled, setCCEnabled } from "./state";
import { debounce } from "./utils";
import { addCaption } from "./caption";
import { renderCaptions } from "./render";

function extractCaptions(): void {
  const captionRegion = document.querySelector('[role="region"][aria-label="Captions"]');
  if (!captionRegion) return;

  const captionEntries = captionRegion.querySelectorAll(".nMcdL");

  captionEntries.forEach((entry) => {
    const speakerEl = entry.querySelector(".NWpY1d");
    const speaker = speakerEl?.textContent?.trim() || "Speaker";

    const textEl = entry.querySelector(".ygicle");
    if (!textEl) return;

    const text = textEl.textContent?.trim();
    if (text && text.length > 1) {
      addCaption(speaker, text);
    }
  });
}

export function startObserver(): void {
  let observer: MutationObserver | null = null;
  const debouncedExtract = debounce(extractCaptions, 100);

  function observeCaptionRegion(): void {
    const captionRegion = document.querySelector(
      '[role="region"][aria-label="Captions"]'
    ) as HTMLElement | null;

    if (captionRegion && !(captionRegion as any)._mcObserving) {
      (captionRegion as any)._mcObserving = true;

      if (!isCCEnabled) {
        setCCEnabled(true);
        if (captions.length === 0) {
          renderCaptions();
        }
      }

      if (observer) observer.disconnect();

      observer = new MutationObserver(debouncedExtract);
      observer.observe(captionRegion, {
        childList: true,
        subtree: true,
        characterData: true,
      });

      console.log("[MeetCaptioner] Observing caption region");
    }
  }

  setInterval(observeCaptionRegion, 2000);
  observeCaptionRegion();

  console.log("[MeetCaptioner] Observer started");
}
