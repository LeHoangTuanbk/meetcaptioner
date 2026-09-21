import { StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { ContentScriptContext } from "wxt/utils/content-script-context";
import OverlayApp from "./App";

let overlayUi: Awaited<ReturnType<typeof createShadowRootUi<Root>>> | null = null;

export async function createOverlay(ctx: ContentScriptContext): Promise<void> {
  if (overlayUi) return;

  overlayUi = await createShadowRootUi(ctx, {
    name: "meetcaptioner-overlay-host",
    position: "inline",
    anchor: document.body,
    append: "last",
    mode: "open",
    isolateEvents: ["keydown", "keyup", "keypress"],
    onMount(uiContainer) {
      const app = document.createElement("div");
      app.id = __MEETCAPTIONER_APP_ID__;
      uiContainer.appendChild(app);

      const root = createRoot(app);
      root.render(
        <StrictMode>
          <OverlayApp />
        </StrictMode>
      );
      return root;
    },
    onRemove(root) {
      root?.unmount();
      overlayUi = null;
    },
  });

  overlayUi.mount();
}
