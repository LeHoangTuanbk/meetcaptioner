import { useEffect, useState } from "react";
import { PencilSimpleIcon, FloppyDiskIcon, XIcon } from "@phosphor-icons/react";

type Props = {
  notes?: string;
  onSave: (notes: string) => Promise<void>;
};

export const MeetingNotes = ({ notes, onSave }: Props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(notes ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const hasNotes = Boolean(notes?.trim());

  useEffect(() => {
    if (!isEditing) setDraft(notes ?? "");
  }, [notes, isEditing]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(draft);
      setIsEditing(false);
    } catch {
      // Keep the editor open so the user can retry without losing the draft.
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="mt-6 overflow-hidden rounded-xl border border-(--mc-app-border) bg-(--mc-app-surface)">
      <div className="border-b border-(--mc-app-border) bg-(--mc-app-surface-solid) py-4 pl-5">
        <div className="flex items-center justify-between gap-3 pr-4">
          <h3 className="text-lg leading-5 font-medium text-(--mc-app-text)">Meeting notes</h3>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => { setDraft(notes ?? ""); setIsEditing(false); }} className="flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-(--mc-secondary) px-4 text-sm font-medium hover:bg-(--mc-secondary-hover)">
                <XIcon className="size-4" /> Cancel
              </button>
              <button type="button" disabled={isSaving} onClick={() => void handleSave()} className="flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-(--mc-primary) px-4 text-sm font-medium text-white hover:bg-(--mc-primary-hover) disabled:cursor-not-allowed disabled:opacity-60">
                <FloppyDiskIcon className="size-4" /> {isSaving ? "Saving…" : "Save notes"}
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setIsEditing(true)} className="flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-(--mc-secondary) px-4 text-sm font-medium hover:bg-(--mc-secondary-hover)">
              <PencilSimpleIcon className="size-4" /> {hasNotes ? "Edit notes" : "Add notes"}
            </button>
          )}
        </div>
      </div>
      {isEditing ? (
        <div className="p-5">
          <textarea autoFocus value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write your notes…" className="min-h-36 w-full resize-y rounded-lg border border-(--mc-app-field-border) bg-(--mc-app-canvas) px-3 py-2 text-sm leading-6 text-(--mc-app-text) outline-none focus:border-(--mc-app-field-hover)" />
        </div>
      ) : hasNotes ? (
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
