import type { MeetingSession } from "./types";
import { useSessionDetail } from "./use-session-detail";

type SessionDetailProps = {
  session: MeetingSession;
  onBack: () => void;
  onDelete: () => void;
};

export const SessionDetail = ({
  session,
  onBack,
  onDelete,
}: SessionDetailProps) => {
  const {
    hasTranslations,
    displayTitle,
    formattedStartTime,
    formattedEndTime,
    exportSession,
    handleDelete,
  } = useSessionDetail(session);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <span className="text-xl">←</span>
          </button>
          <div>
            <h2 className="text-xl font-semibold text-white">{displayTitle}</h2>
            <p className="text-sm text-slate-400">
              {formattedStartTime}
              {formattedEndTime && ` - ${formattedEndTime}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative group">
            <button className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors cursor-pointer">
              Export
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={() => exportSession("captions")}
                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-700 rounded-t-lg cursor-pointer"
              >
                Export Captions
              </button>
              {hasTranslations && (
                <button
                  onClick={() => exportSession("translations")}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-slate-700"
                >
                  Export Translations
                </button>
              )}
              {hasTranslations && (
                <button
                  onClick={() => exportSession("both")}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-slate-700 rounded-b-lg"
                >
                  Export Both
                </button>
              )}
            </div>
          </div>
          <button
            onClick={() => handleDelete(onDelete)}
            className="px-4 py-2 text-sm bg-red-900/50 hover:bg-red-800/50 text-red-300 rounded-lg transition-colors cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="grid grid-cols-2 gap-px bg-slate-700/50">
          <div className="bg-slate-800 px-4 py-2 text-sm font-medium text-slate-400">
            Caption
          </div>
          <div className="bg-slate-800 px-4 py-2 text-sm font-medium text-slate-400">
            Translation
          </div>
        </div>
        <div className="divide-y divide-slate-700/50">
          {session.captions.map((caption, index) => (
            <div
              key={index}
              className="grid grid-cols-2 gap-px bg-slate-700/50"
            >
              <div className="bg-slate-800/50 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-emerald-400">
                    {caption.speaker}
                  </span>
                  <span className="text-xs text-slate-500">{caption.time}</span>
                </div>
                <p className="text-sm text-slate-200">{caption.text}</p>
              </div>
              <div className="bg-slate-800/50 p-4">
                {caption.translation ? (
                  <p className="text-sm text-blue-300 italic">
                    {caption.translation}
                  </p>
                ) : (
                  <span className="text-xs text-slate-600">No translation</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {session.captions.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          No captions in this session
        </div>
      )}
    </div>
  );
};
