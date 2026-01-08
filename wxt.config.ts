import { defineConfig } from "wxt";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  vite: () => ({
    plugins: [react(), tailwindcss()],
  }),
  manifest: {
    name: "MeetCaptioner",
    description: "Capture and translate Google Meet captions in real-time",
    version: "2.0.0",
    permissions: ["storage"],
    host_permissions: [
      "https://meet.google.com/*",
      "https://api.anthropic.com/*",
      "https://api.openai.com/*",
    ],
    icons: {
      16: "icon-16.png",
      32: "icon-32.png",
      48: "icon-48.png",
      128: "icon-128.png",
    },
    action: {
      default_title: "MeetCaptioner",
      default_icon: {
        16: "icon-16.png",
        32: "icon-32.png",
        48: "icon-48.png",
      },
    },
  },
});
