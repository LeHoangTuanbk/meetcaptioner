import { defineConfig } from "wxt";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  vite: () => ({
    plugins: [react(), tailwindcss()],
  }),
  manifest: {
    name: "MeetCaptioner",
    description: "Capture and translate browser meeting captions in real-time",
    version: "2.1.0",
    permissions: ["storage"],
    host_permissions: [
      "https://meet.google.com/*",
      "https://teams.microsoft.com/l/meetup-join/*",
      "https://teams.microsoft.com/meet/*",
      "https://teams.microsoft.com/v2/*",
      "https://*.teams.microsoft.com/l/meetup-join/*",
      "https://*.teams.microsoft.com/meet/*",
      "https://*.teams.microsoft.com/v2/*",
      "https://teams.live.com/meet/*",
      "https://teams.live.com/v2/*",
      "https://*.teams.live.com/meet/*",
      "https://*.teams.live.com/v2/*",
      "https://*.zoom.us/wc/*",
      "https://*.zoom.us/j/*",
      "https://*.zoom.us/w/*",
      "https://api.anthropic.com/*",
      "https://api.openai.com/*",
      "http://localhost/*",
      "http://localhost:11434/*",
      "http://127.0.0.1/*",
      "http://127.0.0.1:11434/*",
      "https://ollama.com/*",
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
