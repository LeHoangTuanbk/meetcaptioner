import { XIcon, XCircleIcon } from "@phosphor-icons/react";
import {
  dismissToast,
  useOverlayToast,
} from "@content/overlay/shared";

export function Toast() {
  const toast = useOverlayToast();
  if (!toast) return null;

  return (
    <div
      key={toast.id}
      role="alert"
      className="mc-toast-enter fixed top-5 left-1/2 z-1000000 flex min-h-16.5 w-130 max-w-[calc(100vw-32px)] -translate-x-1/2 items-center gap-3 rounded-xl border border-red-500 bg-[#2a1720] px-4 py-3 text-[13px] leading-5 text-(--mc-app-text) shadow-[0_8px_15px_rgba(0,0,0,0.45)]"
    >
      <XCircleIcon className="size-4 shrink-0 text-red-400" aria-hidden="true" />
      <span className="flex-1">{toast.message}</span>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={dismissToast}
        className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-red-300/70 hover:bg-white/10 hover:text-red-200"
      >
        <XIcon className="size-4" />
      </button>
    </div>
  );
}
