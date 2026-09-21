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
      className="mc-toast-enter fixed top-5 left-1/2 z-[1000000] flex w-max max-w-[min(360px,calc(100vw-32px))] -translate-x-1/2 items-center gap-3 rounded-lg border border-red-500/30 bg-[#2a1720] px-4 py-3 text-[13px] text-red-200 shadow-[0_8px_30px_rgba(0,0,0,0.45)]"
    >
      <span className="text-base text-red-400" aria-hidden="true">
        ⚠
      </span>
      <span>{toast.message}</span>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={dismissToast}
        className="ml-1 cursor-pointer border-0 bg-transparent p-0 text-base leading-none text-red-200/60 hover:text-red-100"
      >
        ×
      </button>
    </div>
  );
}
