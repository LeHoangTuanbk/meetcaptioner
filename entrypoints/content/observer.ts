import { captions, isCCEnabled, setCCEnabled } from "./state";
import { debounce } from "./utils";
import { addCaption } from "./caption";
import { renderCaptions } from "./render";

// Track the current caption region element
let currentCaptionRegion: HTMLElement | null = null;

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

    // Check if region exists and is different from current (Google Meet might recreate it)
    const needsReobserve = captionRegion && (
      !currentCaptionRegion ||
      captionRegion !== currentCaptionRegion ||
      !document.body.contains(currentCaptionRegion)
    );

    if (needsReobserve && captionRegion) {
      // Disconnect old observer
      if (observer) {
        observer.disconnect();
        observer = null;
      }

      currentCaptionRegion = captionRegion;

      if (!isCCEnabled) {
        setCCEnabled(true);
        if (captions.length === 0) {
          renderCaptions();
        }
      }

      observer = new MutationObserver(debouncedExtract);
      observer.observe(captionRegion, {
        childList: true,
        subtree: true,
        characterData: true,
      });

      console.log("[MeetCaptioner] Observing caption region");
    }

    // If caption region was removed, mark as not enabled
    if (!captionRegion && currentCaptionRegion) {
      currentCaptionRegion = null;
      if (observer) {
        observer.disconnect();
        observer = null;
      }
    }
  }

  setInterval(observeCaptionRegion, 2000);
  observeCaptionRegion();

  console.log("[MeetCaptioner] Observer started");
}
