type Props = {
  notes?: string;
};

export const MeetingNotes = ({ notes }: Props) => {
  const hasNotes = Boolean(notes?.trim());

  return (
    <section className="mt-6 overflow-hidden rounded-xl border border-(--mc-app-border) bg-(--mc-app-surface)">
      <div className="border-b border-(--mc-app-border) bg-(--mc-app-surface-solid) py-4 pl-5">
        <h3 className="text-lg leading-5 font-medium text-(--mc-app-text)">Meeting notes</h3>
      </div>
      {hasNotes ? (
        <p className="max-h-96 overflow-y-auto px-5 py-4 text-sm leading-6 whitespace-pre-wrap text-(--mc-app-text-emphasis)">
          {notes}
        </p>
      ) : (
        <p className="px-5 py-10 text-center text-sm text-(--mc-app-text-secondary)">
          No notes
        </p>
      )}
    </section>
  );
};
