import {
  CheckCircleIcon,
  InfoIcon,
  WarningCircleIcon,
  XCircleIcon,
  XIcon,
  type Icon,
} from "@phosphor-icons/react";
import { toast, type ExternalToast } from "sonner";

type ToastVariant = "success" | "info" | "warning" | "error";

type VariantStyle = {
  icon: Icon;
  containerClass: string;
  accentClass: string;
};

const VARIANT_STYLES: Record<ToastVariant, VariantStyle> = {
  success: {
    icon: CheckCircleIcon,
    containerClass: "border-emerald-500 bg-[#172a24]",
    accentClass: "text-emerald-400",
  },
  info: {
    icon: InfoIcon,
    containerClass: "border-white/10 bg-(--mc-app-surface-solid)",
    accentClass: "text-slate-300",
  },
  warning: {
    icon: WarningCircleIcon,
    containerClass: "border-amber-400 bg-[#2a2a2e]",
    accentClass: "text-amber-400",
  },
  error: {
    icon: XCircleIcon,
    containerClass: "border-red-500 bg-[#2a1720]",
    accentClass: "text-red-400",
  },
};

type ToastCardProps = {
  id: string | number;
  variant: ToastVariant;
  message: string;
};

const ToastCard = ({ id, variant, message }: ToastCardProps) => {
  const { icon: VariantIcon, containerClass, accentClass } = VARIANT_STYLES[variant];

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`flex min-h-13 w-full items-center gap-3 rounded-xl border px-4 py-3 text-[13px] leading-5 text-(--mc-app-text) shadow-[0_8px_15px_rgba(0,0,0,0.45)] ${containerClass}`}
    >
      <VariantIcon className={`size-4 shrink-0 ${accentClass}`} aria-hidden="true" />
      <span className="flex-1">{message}</span>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => toast.dismiss(id)}
        className={`flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md hover:bg-white/10 ${accentClass}`}
      >
        <XIcon className="size-4" />
      </button>
    </div>
  );
};

const show = (variant: ToastVariant) => (message: string, options?: ExternalToast) =>
  toast.custom((id) => <ToastCard id={id} variant={variant} message={message} />, options);

/** Shows project-styled toasts (icon + message + dismiss) through the shared Sonner toaster. */
export const appToast = {
  success: show("success"),
  info: show("info"),
  warning: show("warning"),
  error: show("error"),
};
