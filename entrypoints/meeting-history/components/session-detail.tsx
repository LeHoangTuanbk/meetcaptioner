import { ArrowLeftIcon } from "@phosphor-icons/react";
import { ExportSelect } from "./export-select";
import { ChatMessageList } from "./chat-message-list";
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
      <div className="mb-6 flex items-center justify-between gap-6">
        <button
          onClick={onBack}
          aria-label="Back to meeting history"
          className="flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-(--mc-secondary) px-4 text-sm font-medium transition-colors hover:bg-(--mc-secondary-hover)"
        >
          <span>Back</span>
          <ArrowLeftIcon className="size-4" />
        </button>
        <div className="flex items-center gap-2">
          <SummarySelect
            isDisabled={
              session.captions.length === 0 &&
              (session.chatMessages?.length ?? 0) === 0
            }
            onSelect={handleSummaryAction}
          />
          <ExportSelect onExport={exportSession} />
          <button
            onClick={() => handleDelete(onDelete)}
            className="h-9 cursor-pointer rounded-lg bg-(--mc-danger) px-4 text-sm font-medium text-white transition-colors hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-2xl leading-7 font-semibold tracking-[-0.02em]">
          {displayTitle}
        </h2>
        <p className="mt-1 text-sm leading-5 text-(--mc-app-text-secondary)">
          {formattedStartTime}
          {formattedEndTime && ` – ${formattedEndTime}`}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-(--mc-app-border) bg-(--mc-app-surface)">
        <div className="grid grid-cols-2 border-b border-(--mc-app-border) bg-(--mc-app-surface-solid)">
          <div className="px-4 py-2 text-lg leading-6 font-medium text-(--mc-app-text)">
            Caption
          </div>
          <div className="px-4 py-2 text-lg leading-6 font-medium text-(--mc-app-text)">
            Translation
          </div>
        </div>
        {session.captions.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-(--mc-app-text-secondary)">
            No captions
          </p>
        )}
        <div className="divide-y divide-(--mc-app-border)">
          {session.captions.map((caption, index) => (
            <div key={index} className="grid grid-cols-2">
              <div className="p-4">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-medium text-(--mc-positive)">
                    {caption.speaker}
                  </span>
                </div>
                <p className="text-sm leading-5 text-(--mc-app-text-emphasis)">
                  {caption.text}
                </p>
                <span className="mt-2 block text-xs text-(--mc-app-text-secondary)">
                  {caption.time}
                </span>
              </div>
              <div className="p-4">
                {caption.translation ? (
                  <p className="text-sm leading-5 text-(--mc-app-text-emphasis)">
                    {caption.translation}
                  </p>
                ) : (
                  <span className="text-xs text-(--mc-app-text-secondary)">
                    No translation
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <ChatMessageList messages={session.chatMessages ?? []} />
    </div>
  );
};
