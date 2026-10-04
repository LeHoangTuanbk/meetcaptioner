import { useEffect, useRef, useState } from "react";
import {
  CheckCircleIcon,
  InfoIcon,
  WarningCircleIcon,
  XIcon,
} from "@phosphor-icons/react";

type Props = {
  isCCEnabled: boolean;
  isMeetingEnded: boolean;
};

export const CaptionsStatusToast = ({
  isCCEnabled,
  isMeetingEnded,
}: Props) => {
  const previousIsCCEnabledRef = useRef(isCCEnabled);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isResumeMessageVisible, setIsResumeMessageVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const wasCCEnabled = previousIsCCEnabledRef.current;
    previousIsCCEnabledRef.current = isCCEnabled;
    setIsDismissed(false);

    if (isMeetingEnded || !isCCEnabled) {
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
  }, [isCCEnabled, isMeetingEnded]);

  useEffect(
    () => () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    },
    []
  );

  if (
    isDismissed ||
    (!isMeetingEnded && isCCEnabled && !isResumeMessageVisible)
  ) {
    return null;
  }

  const statusClass = isMeetingEnded
    ? "border-white/10 bg-white/10"
    : isCCEnabled
      ? "border-emerald-500 bg-[#172a24]"
      : "border-amber-400 bg-white/10";

  const statusMessage = isMeetingEnded
    ? "Meeting ended. Caption capturing has stopped."
    : isCCEnabled
      ? "Captions are back on. Capturing has resumed."
      : "Captions are turned off. Press C in Google Meet to continue capturing.";
  const StatusIcon = isMeetingEnded
    ? InfoIcon
    : isCCEnabled
      ? CheckCircleIcon
      : WarningCircleIcon;
  const iconClass = isMeetingEnded
    ? "text-slate-300"
    : isCCEnabled
      ? "text-green-400"
      : "text-amber-400";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`absolute bottom-4 left-1/2 z-20 flex min-h-13 w-[calc(100%-32px)] max-w-130 -translate-x-1/2 items-center gap-3 rounded-xl border px-4 py-3 text-[13px] leading-5 text-(--mc-app-text) shadow-[0_8px_12px_rgba(0,0,0,0.35)] backdrop-blur-sm ${statusClass}`}
    >
      <StatusIcon className={`size-4 shrink-0 ${iconClass}`} />
      <span className="flex-1">{statusMessage}</span>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => setIsDismissed(true)}
        className={`flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md hover:bg-white/10 ${iconClass}`}
      >
        <XIcon className="size-4" />
      </button>
    </div>
  );
};
