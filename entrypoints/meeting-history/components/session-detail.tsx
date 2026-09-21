import { ExportSelect } from "./export-select";
import { SummarySelect } from "./summary-select";
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
    displayTitle,
    formattedStartTime,
    formattedEndTime,
    exportSession,
    handleSummaryAction,
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
          <SummarySelect
            isDisabled={session.captions.length === 0}
            onSelect={handleSummaryAction}
          />
          <ExportSelect onExport={exportSession} />
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
