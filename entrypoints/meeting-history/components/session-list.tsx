import { useState, useEffect, useRef } from "react";
import type { MeetingSession } from "./types";

const ITEMS_PER_PAGE = 20;

interface SessionListProps {
  sessions: MeetingSession[];
  onSelect: (session: MeetingSession) => void;
  onDelete: (sessionId: string) => void;
  onUpdateTitle: (sessionId: string, title: string) => void;
}

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }
};

const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDuration = (start: number, end?: number): string => {
  if (!end) return "";
  const diff = end - start;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

const groupByDate = (sessions: MeetingSession[]): Map<string, MeetingSession[]> => {
  const groups = new Map<string, MeetingSession[]>();
  for (const session of sessions) {
    const dateKey = formatDate(session.startTime);
    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(session);
  }
  return groups;
};

const SessionTitle = ({
  session,
  onUpdateTitle,
}: {
  session: MeetingSession;
  onUpdateTitle: (sessionId: string, title: string) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(session.title || "");

  const displayTitle = session.title || `Meeting ${session.meetingCode}`;

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (trimmed !== session.title) {
      onUpdateTitle(session.id, trimmed);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setEditValue(session.title || "");
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
        placeholder={`Meeting ${session.meetingCode}`}
        className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm font-medium w-64 focus:outline-none focus:border-slate-500"
        autoFocus
      />
    );
  }

  return (
    <h4
      onClick={(e) => {
        e.stopPropagation();
        setEditValue(session.title || "");
        setIsEditing(true);
      }}
      className="font-medium text-white cursor-pointer hover:text-emerald-400 transition-colors"
      title="Click to edit title"
    >
      {displayTitle}
      <span className="ml-2 text-slate-600 text-xs">✎</span>
    </h4>
  );
};

export const SessionList = ({ sessions, onSelect, onDelete, onUpdateTitle }: SessionListProps) => {
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const visibleSessions = sessions.slice(0, visibleCount);
  const hasMore = visibleCount < sessions.length;
  const grouped = groupByDate(visibleSessions);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + ITEMS_PER_PAGE, sessions.length));
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, sessions.length]);

  // Reset visible count when sessions change (e.g., search filter)
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [sessions]);

  return (
    <div className="space-y-6">
      {Array.from(grouped.entries()).map(([date, dateSessions]) => (
        <div key={date}>
          <h3 className="text-sm font-medium text-slate-500 mb-3">{date}</h3>
          <div className="space-y-3">
            {dateSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => onSelect(session)}
                className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <SessionTitle session={session} onUpdateTitle={onUpdateTitle} />
                  <span className="text-xs text-slate-500">
                    {session.captions.length} caption{session.captions.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mb-3">
                  {formatTime(session.startTime)}
                  {session.endTime && ` - ${formatTime(session.endTime)}`}
                  {session.endTime && (
                    <span className="text-slate-500">
                      {" "}({formatDuration(session.startTime, session.endTime)})
                    </span>
                  )}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Delete this session?")) {
                        onDelete(session.id);
                      }
                    }}
                    className="px-3 py-1.5 text-sm text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-4">
          <span className="text-sm text-slate-500">Loading more...</span>
        </div>
      )}
    </div>
  );
};
