import { useEffect, useRef, useState } from "react";
import { SCROLL_PREFETCH_MARGIN } from "@content/constants";
import { enqueueNearbyCaptions } from "@content/translation-queue";
import {
  CaptionList,
  CaptionsStatusToast,
  Header,
  ResizeHandles,
  ScrollToBottomButton,
  Toast,
} from "@content/overlay/components";
import { useDrag, useResize } from "@content/overlay/hooks";
import {
  registerContentElement,
  useOverlayState,
} from "@content/overlay/shared";

type SavedPosition = {
  left: string;
  top: string;
  right: string;
  width: string;
  height: string;
};

export default function OverlayApp() {
  const { captions, isCCEnabled, isWaveActive, settings, version } = useOverlayState();
  const [isMinimized, setIsMinimized] = useState(false);
  const savedPositionRef = useRef<SavedPosition | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const bottomRightRef = useRef<HTMLDivElement>(null);
  const bottomLeftRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useDrag(overlayRef, headerRef, !isMinimized);
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
    []
  );

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
    const rect = overlay.getBoundingClientRect();
    overlay.style.left = "auto";
    overlay.style.right = `${Math.max(20, window.innerWidth - rect.right)}px`;
    overlay.style.width = "auto";
    overlay.style.height = "auto";
    setIsMinimized(true);
  };

  const expand = () => {
    const overlay = overlayRef.current;
    const saved = savedPositionRef.current;
    if (overlay && saved) Object.assign(overlay.style, saved);
    savedPositionRef.current = null;
    setIsMinimized(false);
  };

  return (
    <>
      <Toast />
      <div
        ref={overlayRef}
        className={`fixed top-20 right-5 z-[999999] flex overflow-hidden rounded-xl bg-[#1a1a2e] font-sans text-white shadow-[0_4px_24px_rgba(0,0,0,0.5)] ${
          isMinimized
            ? "h-auto w-auto min-w-0 flex-row"
            : "h-[400px] w-[480px] min-h-[200px] min-w-[520px] flex-col"
        }`}
      >
        <Header
          headerRef={headerRef}
          isMinimized={isMinimized}
          isWaveActive={isWaveActive}
          settings={settings}
          onMinimize={minimize}
          onExpand={expand}
        />

        {!isMinimized && (
          <>
            <div
              ref={contentRef}
              onScroll={() => {
                if (!settings.translationEnabled) return;
                if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
                scrollTimerRef.current = setTimeout(
                  () => enqueueNearbyCaptions(SCROLL_PREFETCH_MARGIN),
                  250
                );
              }}
              style={{ fontSize: `${settings.captionFontSize}px` }}
              className="mc-content-scroll min-h-0 flex-1 cursor-text overflow-x-hidden overflow-y-auto p-3 select-text"
            >
              <CaptionList
                captions={captions}
                isCCEnabled={isCCEnabled}
                isTranslationEnabled={settings.translationEnabled}
              />
            </div>
            <ScrollToBottomButton
              contentRef={contentRef}
              contentVersion={version}
            />
            {captions.length > 0 && (
              <CaptionsStatusToast isCCEnabled={isCCEnabled} />
            )}
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
