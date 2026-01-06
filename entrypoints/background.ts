import { appendTranscript, getStoredTranscripts, clearTranscripts } from '@/lib/messaging';
import type { MessageType, TranscriptMessage } from '@/lib/types';

export default defineBackground(() => {
  console.debug('[MeetCaptioner] Background service worker started');

  // Track connection state
  let isConnected = false;
  let currentMeetingId: string | null = null;

  // Handle messages from content script
  chrome.runtime.onMessage.addListener((message: MessageType, sender, sendResponse) => {
    console.debug('[MeetCaptioner] Received message:', message.type);

    switch (message.type) {
      case 'TRANSCRIPT_UPDATE':
        handleTranscriptUpdate(message.payload);
        break;

      case 'TRANSCRIPT_BATCH':
        message.payload.forEach((transcript) => {
          handleTranscriptUpdate(transcript);
        });
        break;

      case 'MEETING_STARTED':
        currentMeetingId = message.payload.meetingId;
        console.debug('[MeetCaptioner] Meeting started:', currentMeetingId);
        // Clear previous transcripts when new meeting starts
        clearTranscripts();
        break;

      case 'MEETING_ENDED':
        console.debug('[MeetCaptioner] Meeting ended');
        currentMeetingId = null;
        isConnected = false;
        break;

      case 'CONNECTION_STATUS':
        isConnected = message.payload.connected;
        console.debug('[MeetCaptioner] Connection status:', isConnected);
        break;
    }

    // Forward message to side panel
    forwardToSidePanel(message);

    sendResponse({ success: true });
    return true;
  });

  // Handle transcript update
  async function handleTranscriptUpdate(transcript: TranscriptMessage) {
    await appendTranscript(transcript);
  }

  // Forward messages to side panel
  function forwardToSidePanel(message: MessageType) {
    // Send to all extension views (side panel, popup, etc.)
    chrome.runtime.sendMessage(message).catch(() => {
      // Ignore errors when no receiver
    });
  }

  // Open side panel when extension icon is clicked
  chrome.action.onClicked.addListener(async (tab) => {
    if (tab.id) {
      // Check if we're on a Google Meet page
      if (tab.url?.includes('meet.google.com')) {
        await chrome.sidePanel.open({ tabId: tab.id });
      } else {
        // Show notification that extension only works on Google Meet
        console.debug('[MeetCaptioner] Not on Google Meet page');
      }
    }
  });

  // Set side panel behavior
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {
    // Ignore if not supported
  });
});
