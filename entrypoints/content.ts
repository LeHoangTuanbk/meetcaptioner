import { sendTranscriptUpdate, sendMessage } from '@/lib/messaging';
import type { TranscriptMessage } from '@/lib/types';

// Store device names mapping
const deviceNames = new Map<string, string>();

export default defineContentScript({
  matches: ['https://meet.google.com/*'],
  runAt: 'document_start',
  world: 'ISOLATED',

  main() {
    console.debug('[MeetCaptioner] Content script loaded');

    // Check if we're in a meeting (URL pattern: xxx-xxxx-xxx)
    const isMeetingUrl = /\/[a-z]{3}-[a-z]{4}-[a-z]{3}($|\?)/.test(window.location.pathname);

    if (!isMeetingUrl && window.location.pathname !== '/new') {
      console.debug('[MeetCaptioner] Not a meeting URL, skipping injection');
      return;
    }

    // Inject the WebRTC hook script into page context
    injectScript();

    // Listen for messages from injected script via postMessage
    console.log('[MeetCaptioner] Setting up postMessage listener');

    window.addEventListener('message', (event) => {
      // Only handle messages from our injected script
      if (event.data?.source !== 'meetcaptioner') return;

      const detail = event.data;
      console.warn('[MeetCaptioner] RECEIVED:', detail.type, detail.messages?.[0]?.text || detail.connected);

      switch (detail.type) {
        case 'speech':
          // Handle speech/transcript messages
          if (Array.isArray(detail.messages)) {
            detail.messages.forEach((msg: any) => {
              const transcript: TranscriptMessage = {
                messageId: msg.messageId || `msg_${Date.now()}`,
                speakerId: msg.deviceId || 'unknown',
                speakerName: msg.deviceName || deviceNames.get(msg.deviceId) || msg.deviceId || 'Unknown',
                text: msg.text || '',
                timestamp: Date.now(),
                isFinal: msg.type === 'chat',
              };

              if (transcript.text) {
                console.warn('[MeetCaptioner] SENDING:', transcript.speakerName, '-', transcript.text);
                sendTranscriptUpdate(transcript);
              }
            });
          }
          break;

        case 'deviceinfo':
          // Store device name mapping
          if (detail.deviceId && detail.deviceName) {
            deviceNames.set(detail.deviceId, detail.deviceName);
            console.debug('[MeetCaptioner] Device:', detail.deviceId, '=', detail.deviceName);
          }
          break;

        case 'premeeting-devices':
          // Handle batch device info
          if (Array.isArray(detail.devices)) {
            detail.devices.forEach((d: any) => {
              if (d.deviceId && d.deviceName) {
                deviceNames.set(d.deviceId, d.deviceName);
              }
            });
            console.debug('[MeetCaptioner] Loaded', detail.devices.length, 'devices');
          }
          break;

        case 'status':
          // Handle connection status
          sendMessage({ type: 'CONNECTION_STATUS', payload: { connected: detail.connected } });
          console.debug('[MeetCaptioner] Status:', detail.connected ? 'connected' : 'disconnected');
          break;

        case 'language-changed':
          console.debug('[MeetCaptioner] Language changed:', detail);
          break;
      }
    });

    // Notify that meeting started
    sendMessage({
      type: 'MEETING_STARTED',
      payload: { meetingId: window.location.pathname },
    });

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      sendMessage({ type: 'MEETING_ENDED' });
    });
  },
});

function injectScript() {
  // Check if already injected
  if (document.querySelector('meta[name="meetcaptioner-injected"]')) {
    console.debug('[MeetCaptioner] Already injected');
    return;
  }

  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('injected.js');
  script.type = 'text/javascript';

  // Inject as early as possible
  const target = document.head || document.documentElement;

  script.onload = () => {
    console.debug('[MeetCaptioner] Injected script loaded');
    script.remove(); // Clean up
  };

  script.onerror = (e) => {
    console.error('[MeetCaptioner] Failed to inject script:', e);
  };

  target.prepend(script);
}
