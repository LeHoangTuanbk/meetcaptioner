import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { SCROLL_PREFETCH_MARGIN } from "@content/constants";
import { enqueueNearbyCaptions } from "@content/translation-queue";
import {
  CaptionList,
  CaptionsStatusToast,
  Header,
  NotesPanel,
  ResizeHandles,
  ScrollToBottomButton,
  Toast,
} from "@content/overlay/components";
import { useDrag, useResize, useStickToBottom } from "@content/overlay/hooks";
import {
  registerContentElement,
  saveOverlaySettings,
  useOverlayState,
} from "@content/overlay/shared";

type SavedPosition = {
  left: string;
  top: string;
  right: string;
  width: string;
  height: string;
};

const MIN_OVERLAY_WIDTH = 520;

const getHeaderContentWidth = (header: HTMLDivElement): number => {
  const style = window.getComputedStyle(header);
  const children = Array.from(header.children);
  const childrenWidth = children.reduce(
    (width, child) => width + child.getBoundingClientRect().width,
    0,
  );
  const gapsWidth = Number.parseFloat(style.columnGap) * (children.length - 1);

  return Math.ceil(
    childrenWidth +
      gapsWidth +
      Number.parseFloat(style.paddingLeft) +
      Number.parseFloat(style.paddingRight),
  );
};

export default function OverlayApp() {
  const {
    captions,
    isCCEnabled,
    isMeetingEnded,
    isWaveActive,
    settings,
    version,
  } = useOverlayState();
  const isMinimized = settings.isOverlayMinimized;
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const savedPositionRef = useRef<SavedPosition | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const bottomRightRef = useRef<HTMLDivElement>(null);
  const bottomLeftRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useDrag(overlayRef, headerRef, true);
  useResize(overlayRef, bottomRightRef, "br", !isMinimized);
  useResize(overlayRef, bottomLeftRef, "bl", !isMinimized);
  useResize(overlayRef, bottomRef, "b", !isMinimized);

  useEffect(() => {
    registerContentElement(contentRef.current);
    return () => registerContentElement(null);
  }, [isMinimized]);

  useEffect(
    () => () => {
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    },
    [],
  );

  useLayoutEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    if (!isMinimized) {
      const savedPosition = savedPositionRef.current;
      if (savedPosition) {
        Object.assign(overlay.style, savedPosition);
      } else {
        overlay.style.height = "";
      }
      return;
    }

    const rect = overlay.getBoundingClientRect();
    overlay.style.left = "auto";
    overlay.style.right = `${Math.max(20, window.innerWidth - rect.right)}px`;
    overlay.style.width = "auto";
    overlay.style.height = "auto";
  }, [isMinimized]);

  useLayoutEffect(() => {
    const overlay = overlayRef.current;
    const header = headerRef.current;
    if (!overlay || !header) return;

    if (isMinimized) {
      overlay.style.minWidth = "0";
      return;
    }

    overlay.style.minWidth = `${MIN_OVERLAY_WIDTH}px`;
    const syncOverlayWidth = () => {
      const requiredWidth = Math.max(
        MIN_OVERLAY_WIDTH,
        getHeaderContentWidth(header),
      );
      overlay.style.width = `${requiredWidth}px`;
      overlay.style.minWidth = `${requiredWidth}px`;
    };

    syncOverlayWidth();
    const frameId = requestAnimationFrame(syncOverlayWidth);
    const observer = new ResizeObserver(syncOverlayWidth);
    Array.from(header.children).forEach((child) => observer.observe(child));

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, [isMinimized, settings.targetLanguage, settings.translationEnabled]);

  useStickToBottom(contentRef, version, !isMinimized);

  const minimize = () => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    savedPositionRef.current = {
      left: overlay.style.left,
      top: overlay.style.top,
      right: overlay.style.right,
      width: overlay.style.width,
      height: overlay.style.height,
    };
    void saveOverlaySettings({ isOverlayMinimized: true });
  };

  const expand = () => {
    void saveOverlaySettings({ isOverlayMinimized: false });
  };

  return (
    <>
      <Toast />
      <div
        ref={overlayRef}
        className={`fixed top-20 right-5 z-999999 flex overflow-hidden rounded-xl bg-(--mc-overlay-bg) font-sans text-white shadow-[0_4px_24px_rgba(0,0,0,0.5)] ${
          isMinimized
            ? "h-auto w-auto min-w-0 flex-row"
            : "h-94.75 max-h-[calc(100vh-40px)] w-144.25 min-h-50 min-w-144.25 flex-col"
        }`}
      >
        <Header
          headerRef={headerRef}
          isMinimized={isMinimized}
          isWaveActive={isWaveActive}
          isNotesOpen={isNotesOpen}
          settings={settings}
          onMinimize={minimize}
          onExpand={expand}
          onToggleNotes={() => setIsNotesOpen((open) => !open)}
        />

        {!isMinimized && (
          <>
            <div className="flex min-h-0 flex-1">
              <div className="relative flex min-w-0 flex-1 flex-col">
                <div
                  ref={contentRef}
                  onScroll={() => {
                    if (!settings.translationEnabled) return;
                    if (scrollTimerRef.current)
                      clearTimeout(scrollTimerRef.current);
                    scrollTimerRef.current = setTimeout(
                      () => enqueueNearbyCaptions(SCROLL_PREFETCH_MARGIN),
                      250,
                    );
                  }}
                  style={{ fontSize: `${settings.captionFontSize}px` }}
                  className="mc-content-scroll mb-3 min-h-0 flex-1 cursor-text overflow-x-hidden overflow-y-auto pb-3 select-text"
                >
                  <CaptionList
                    captions={captions}
                    isCCEnabled={isCCEnabled}
                    isMeetingEnded={isMeetingEnded}
                    isTranslationEnabled={settings.translationEnabled}
                  />
                </div>
                <ScrollToBottomButton
                  contentRef={contentRef}
                  contentVersion={version}
                />
                {captions.length > 0 && (
                  <CaptionsStatusToast
                    isCCEnabled={isCCEnabled}
                    isMeetingEnded={isMeetingEnded}
                  />
                )}
              </div>
              {isNotesOpen && <NotesPanel />}
            </div>
            <ResizeHandles
              bottomRightRef={bottomRightRef}
              bottomLeftRef={bottomLeftRef}
              bottomRef={bottomRef}
            />
          </>
        )}
      </div>
    </>
  );
}
