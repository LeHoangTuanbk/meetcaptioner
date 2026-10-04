import { useNotesPanel } from "./use-notes-panel";

export const NotesPanel = () => {
  const { notes, handleChange } = useNotesPanel();

  return (
    <aside className="flex w-[32%] min-w-44 shrink-0 flex-col border-l border-(--mc-overlay-border)">
      <h2 className="px-4 pt-3 pb-2 text-xs font-semibold text-white">Meeting notes</h2>
      <textarea
        aria-label="Meeting notes"
        value={notes}
        onChange={handleChange}
        placeholder="Write your notes…"
        className="mc-content-scroll min-h-0 flex-1 resize-none overflow-y-auto border-0 bg-transparent px-4 pb-4 text-sm leading-5 text-(--mc-overlay-caption) outline-none placeholder:text-(--mc-overlay-muted)"
      />
    </aside>
  );
};
