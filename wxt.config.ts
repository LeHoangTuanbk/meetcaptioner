import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'MeetCaptioner',
    description: 'Capture and translate Google Meet captions in real-time',
    version: '1.0.0',
    permissions: ['storage', 'sidePanel'],
    host_permissions: ['https://meet.google.com/*'],
    action: {
      default_title: 'MeetCaptioner',
    },
    side_panel: {
      default_path: 'sidepanel.html',
    },
    web_accessible_resources: [
      {
        resources: ['injected.js'],
        matches: ['https://meet.google.com/*'],
      },
    ],
  },
});
