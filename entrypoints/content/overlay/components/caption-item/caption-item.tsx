import type { Caption } from "@content/types";
import { TranslationEditor } from "../translation-editor";
import type { CopyTarget, TranslationTone } from "./use-caption-item";

type Props = {
  caption: Caption;
  isTranslationEnabled: boolean;
  isEditing: boolean;
  copiedTarget: CopyTarget | null;
  translationText: string;
  translationTone: TranslationTone;
  isLoading: boolean;
  isReloadVisible: boolean;
  onCancelEditing: () => void;
  onCopyOriginal: () => void;
  onCopyTranslation: () => void;
  onManualTranslate: () => void;
  onRetranslate: () => void;
  onSaveTranslation: (value: string) => void;
  onStartEditing: () => void;
};

const actionClass =
  "cursor-pointer rounded border-0 bg-transparent px-1.5 py-0.5 text-xs text-slate-500 transition hover:bg-white/10 hover:text-white";

const translationToneClass: Record<TranslationTone, string> = {
  default: "text-blue-400 italic",
  refining: "text-violet-400 italic",
  error: "text-red-400 not-italic",
};

export const CaptionItem = ({
  caption,
  isTranslationEnabled,
  isEditing,
  copiedTarget,
  translationText,
  translationTone,
  isLoading,
  isReloadVisible,
  onCancelEditing,
  onCopyOriginal,
  onCopyTranslation,
  onManualTranslate,
  onRetranslate,
  onSaveTranslation,
  onStartEditing,
}: Props) => (
  <article
    data-caption-id={caption.id}
    className="mc-caption-enter relative flex flex-col gap-1 border-b border-white/6 pb-2 last:border-b-0"
  >
    <div className="text-[11px] font-semibold text-green-400">
      {caption.speaker}
    </div>

    <div
      className={`grid gap-3 ${
        isTranslationEnabled ? "grid-cols-2" : "grid-cols-1"
      }`}
    >
      <button
        type="button"
        title="Double-click to copy"
        onDoubleClick={onCopyOriginal}
        className={`cursor-pointer rounded border-0 bg-transparent p-0 text-left text-[13px] leading-[1.45] text-zinc-200 transition hover:bg-white/5 ${
          copiedTarget === "original" ? "bg-green-400/15" : ""
        }`}
      >
        {caption.text}
      </button>

      {isTranslationEnabled && (
        <div className="flex items-start gap-1">
          {isEditing ? (
            <TranslationEditor
              initialValue={caption.translation}
              onSave={onSaveTranslation}
              onCancel={onCancelEditing}
            />
          ) : (
            <button
              type="button"
              title={
                caption.translationError ||
                "Click to edit, double-click to copy"
              }
              onClick={onStartEditing}
              onDoubleClick={onCopyTranslation}
              className={`min-w-0 flex-1 cursor-pointer rounded border-0 bg-transparent p-0 text-left text-[13px] leading-[1.45] transition hover:bg-white/5 ${
                translationToneClass[translationTone]
              } ${copiedTarget === "translation" ? "bg-green-400/15" : ""}`}
            >
              {translationText}
              {isLoading && <span className="mc-dots">...</span>}
            </button>
          )}

          {isReloadVisible && (
            <button
              type="button"
              className={`${actionClass} text-violet-400`}
              title="Re-translate"
              onClick={onRetranslate}
            >
              ↻
            </button>
          )}
        </div>
      )}
    </div>

    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] text-slate-500">{caption.time}</span>
      {isTranslationEnabled && (
        <button
          type="button"
          className={`${actionClass} text-blue-400`}
          title="Translate"
          onClick={onManualTranslate}
        >
          Translate
        </button>
      )}
    </div>

    {copiedTarget && (
      <span className="mc-copy-pop pointer-events-none absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-md bg-black/85 px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-green-400">
        ✓ Copied!
      </span>
    )}
  </article>
);
