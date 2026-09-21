import { useEffect, useRef, useState } from "react";

type Props = {
  isCCEnabled: boolean;
};

export const CaptionsStatusToast = ({ isCCEnabled }: Props) => {
  const previousIsCCEnabledRef = useRef(isCCEnabled);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isResumeMessageVisible, setIsResumeMessageVisible] = useState(false);

  useEffect(() => {
    const wasCCEnabled = previousIsCCEnabledRef.current;
    previousIsCCEnabledRef.current = isCCEnabled;

    if (!isCCEnabled) {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      setIsResumeMessageVisible(false);
      return;
    }

    if (wasCCEnabled) return;

    setIsResumeMessageVisible(true);
    dismissTimerRef.current = setTimeout(
      () => setIsResumeMessageVisible(false),
      3000
    );
  }, [isCCEnabled]);

  useEffect(
    () => () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    },
    []
  );

  if (isCCEnabled && !isResumeMessageVisible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none absolute bottom-4 left-1/2 z-20 w-max max-w-[calc(100%-32px)] -translate-x-1/2 rounded-lg border px-4 py-2.5 text-center text-xs leading-5 shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-sm ${
        isCCEnabled
          ? "border-emerald-400/25 bg-[#172a24]/95 text-emerald-100/90"
          : "border-amber-400/20 bg-[#29251f]/95 text-amber-100/85"
      }`}
    >
      {isCCEnabled
        ? "Captions are back on. Capturing has resumed."
        : "Captions are turned off. Press C in Google Meet to continue capturing."}
    </div>
  );
};
