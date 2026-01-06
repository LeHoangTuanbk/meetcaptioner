import type { MessageType, TranscriptMessage } from './types';

/**
 * Send message from content script to background/sidepanel
 */
export function sendMessage(message: MessageType): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          // Ignore errors when no receiver (sidepanel not open)
          console.debug('[MeetCaptioner] Message send error:', chrome.runtime.lastError.message);
          resolve();
        } else {
          resolve();
        }
      });
    } catch (e) {
      console.debug('[MeetCaptioner] Failed to send message:', e);
      resolve();
    }
  });
}

/**
 * Send transcript update
 */
export function sendTranscriptUpdate(transcript: TranscriptMessage): Promise<void> {
  return sendMessage({ type: 'TRANSCRIPT_UPDATE', payload: transcript });
}

/**
 * Send batch of transcripts
 */
export function sendTranscriptBatch(transcripts: TranscriptMessage[]): Promise<void> {
  return sendMessage({ type: 'TRANSCRIPT_BATCH', payload: transcripts });
}

/**
 * Listen for messages
 */
export function onMessage(callback: (message: MessageType) => void): () => void {
  const listener = (message: MessageType) => {
    callback(message);
  };

  chrome.runtime.onMessage.addListener(listener);

  return () => {
    chrome.runtime.onMessage.removeListener(listener);
  };
}

/**
 * Storage helpers
 */
export async function getStoredTranscripts(): Promise<TranscriptMessage[]> {
  const result = await chrome.storage.local.get('transcripts');
  return result.transcripts || [];
}

export async function setStoredTranscripts(transcripts: TranscriptMessage[]): Promise<void> {
  await chrome.storage.local.set({ transcripts });
}

export async function appendTranscript(transcript: TranscriptMessage): Promise<void> {
  const transcripts = await getStoredTranscripts();

  // Check if message already exists (by messageId)
  const existingIndex = transcripts.findIndex((t) => t.messageId === transcript.messageId);

  if (existingIndex >= 0) {
    // Update existing message
    transcripts[existingIndex] = transcript;
  } else {
    // Add new message
    transcripts.push(transcript);
  }

  // Keep only last 1000 messages to avoid storage issues
  if (transcripts.length > 1000) {
    transcripts.splice(0, transcripts.length - 1000);
  }

  await setStoredTranscripts(transcripts);
}

export async function clearTranscripts(): Promise<void> {
  await chrome.storage.local.remove('transcripts');
}
