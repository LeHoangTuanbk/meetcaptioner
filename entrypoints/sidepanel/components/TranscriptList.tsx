import { useEffect, useRef } from 'react';
import type { TranscriptMessage } from '@/lib/types';

interface TranscriptListProps {
  transcripts: TranscriptMessage[];
}

export default function TranscriptList({ transcripts }: TranscriptListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);

  // Auto-scroll to bottom when new transcripts arrive
  useEffect(() => {
    if (shouldAutoScroll.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [transcripts]);

  // Detect if user has scrolled up
  function handleScroll() {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    shouldAutoScroll.current = isAtBottom;
  }

  // Merge transcripts by messageId (same message gets updated)
  const mergedTranscripts = mergeTranscripts(transcripts);

  // Group by speaker
  const groupedTranscripts = groupBySpeaker(mergedTranscripts);

  if (transcripts.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-center text-gray-400">
        <div>
          <p className="mb-2 text-lg">Waiting for captions...</p>
          <p className="text-sm">
            Captions will appear here when someone speaks
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="space-y-4 pb-4"
    >
      {groupedTranscripts.map((group, index) => (
        <TranscriptGroup key={group.id || index} group={group} />
      ))}
    </div>
  );
}

// Merge transcripts with same messageId (keep latest)
function mergeTranscripts(transcripts: TranscriptMessage[]): TranscriptMessage[] {
  const merged = new Map<string, TranscriptMessage>();

  for (const t of transcripts) {
    merged.set(t.messageId, t);
  }

  return Array.from(merged.values());
}

interface TranscriptGroup {
  id: string;
  speakerName: string;
  speakerId: string;
  text: string;
  timestamp: number;
}

function groupBySpeaker(transcripts: TranscriptMessage[]): TranscriptGroup[] {
  const groups: TranscriptGroup[] = [];

  for (const transcript of transcripts) {
    const lastGroup = groups[groups.length - 1];

    // If same speaker as last group, update their text (live caption style)
    if (lastGroup && lastGroup.speakerId === transcript.speakerId) {
      // Update text (Google Meet captions are cumulative per speaker)
      lastGroup.text = transcript.text;
      lastGroup.timestamp = transcript.timestamp;
    } else {
      // New speaker - create new group
      groups.push({
        id: transcript.messageId,
        speakerName: transcript.speakerName,
        speakerId: transcript.speakerId,
        text: transcript.text,
        timestamp: transcript.timestamp,
      });
    }
  }

  return groups;
}

interface TranscriptGroupProps {
  group: TranscriptGroup;
}

function TranscriptGroup({ group }: TranscriptGroupProps) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-[#7ec8a3]">{group.speakerName}</p>
      <p className="leading-relaxed text-[#eaeaea]">{group.text}</p>
    </div>
  );
}
