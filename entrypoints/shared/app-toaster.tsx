import type { CSSProperties } from "react";
import { Toaster } from "sonner";

const toasterStyle: CSSProperties & Record<"--width", string> = {
  "--width": "min(520px, calc(100vw - 32px))",
};

export const AppToaster = () => (
  <Toaster
    position="top-center"
    style={toasterStyle}
    toastOptions={{ unstyled: true, style: { width: "100%" } }}
  />
);
