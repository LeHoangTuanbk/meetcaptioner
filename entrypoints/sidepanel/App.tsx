import { useState, useEffect } from "react";
import type { TranscriptMessage, MessageType } from "@/lib/types";
import { getStoredTranscripts, onMessage } from "@/lib/messaging";
import TranscriptList from "./components/TranscriptList";
import StatusIndicator from "./components/StatusIndicator";

export default function App() {
  const [transcripts, setTranscripts] = useState<TranscriptMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Load stored transcripts on mount
  useEffect(() => {
    loadTranscripts();
  }, []);

  // Listen for new transcripts
  useEffect(() => {
    const unsubscribe = onMessage((message: MessageType) => {
      console.warn('[Sidepanel] Received:', message.type, message);
      switch (message.type) {
        case "TRANSCRIPT_UPDATE":
          console.warn('[Sidepanel] Transcript:', message.payload?.text);
          if (!isPaused) {
            addOrUpdateTranscript(message.payload);
          }
          break;

        case "CONNECTION_STATUS":
          setIsConnected(message.payload.connected);
          break;

        case "MEETING_STARTED":
          setTranscripts([]);
          setIsConnected(true);
          break;

        case "MEETING_ENDED":
          setIsConnected(false);
          break;
      }
    });

    return unsubscribe;
  }, [isPaused]);

  async function loadTranscripts() {
    const stored = await getStoredTranscripts();
    setTranscripts(stored);
  }

  function addOrUpdateTranscript(transcript: TranscriptMessage) {
    setTranscripts((prev) => {
      const existingIndex = prev.findIndex(
        (t) => t.messageId === transcript.messageId
      );

      if (existingIndex >= 0) {
        // Update existing
        const updated = [...prev];
        updated[existingIndex] = transcript;
        return updated;
      }

      // Add new
      return [...prev, transcript];
    });
  }

  function handleTogglePause() {
    setIsPaused(!isPaused);
  }

  return (
    <div className="flex h-full flex-col bg-[#1a1a2e]">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3">
        <StatusIndicator connected={isConnected} />
      </header>

      {/* Transcript List */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4">
        <TranscriptList transcripts={transcripts} />
      </div>

      {/* Footer with controls */}
      <footer className="flex items-center justify-center px-4 py-4">
        <button
          onClick={handleTogglePause}
          className={`flex h-14 w-14 items-center justify-center rounded-full transition-colors ${
            isPaused
              ? "bg-green-600 hover:bg-green-700"
              : "bg-[#2a2a3e] hover:bg-[#3a3a4e]"
          }`}
          title={isPaused ? "Resume" : "Pause"}
        >
          {isPaused ? (
            <PlayIcon className="h-6 w-6 text-white" />
          ) : (
            <PauseIcon className="h-6 w-6 text-orange-400" />
          )}
        </button>
      </footer>
    </div>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
