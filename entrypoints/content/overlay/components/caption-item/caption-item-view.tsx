import type { Caption } from "@content/types";
import { TranslationEditor } from "../translation-editor";
import type { CaptionItemViewModel } from "./use-caption-item";

type CaptionItemViewProps = {
  caption: Caption;
  translationEnabled: boolean;
  viewModel: CaptionItemViewModel;
};

const actionClass =
  "cursor-pointer rounded border-0 bg-transparent px-1.5 py-0.5 text-xs text-slate-500 transition hover:bg-white/10 hover:text-white";

const translationToneClass = {
  default: "text-blue-400 italic",
  refining: "text-violet-400 italic",
  error: "text-red-400 not-italic",
} as const;

export function CaptionItemView({
  caption,
  translationEnabled,
  viewModel,
}: CaptionItemViewProps) {
  return (
    <article
      data-caption-id={caption.id}
      className="mc-caption-enter relative flex flex-col gap-1 border-b border-white/6 pb-2 last:border-b-0"
    >
      <div className="text-[11px] font-semibold text-green-400">
        {caption.speaker}
      </div>

      <div
        className={`grid gap-3 ${
          translationEnabled ? "grid-cols-2" : "grid-cols-1"
        }`}
      >
        <button
          type="button"
          title="Double-click to copy"
          onDoubleClick={viewModel.copyOriginal}
          className={`cursor-pointer rounded border-0 bg-transparent p-0 text-left text-[13px] leading-[1.45] text-zinc-200 transition hover:bg-white/5 ${
            viewModel.copied === "original" ? "bg-green-400/15" : ""
          }`}
        >
          {caption.text}
        </button>

        {translationEnabled && (
          <div className="flex items-start gap-1">
            {viewModel.editing ? (
              <TranslationEditor
                initialValue={caption.translation}
                onSave={viewModel.saveTranslation}
                onCancel={viewModel.cancelEditing}
              />
            ) : (
              <button
                type="button"
                title={
                  caption.translationError ||
                  "Click to edit, double-click to copy"
                }
                onClick={viewModel.startEditing}
                onDoubleClick={viewModel.copyTranslation}
                className={`min-w-0 flex-1 cursor-pointer rounded border-0 bg-transparent p-0 text-left text-[13px] leading-[1.45] transition hover:bg-white/5 ${
                  translationToneClass[viewModel.translationTone]
                } ${
                  viewModel.copied === "translation"
                    ? "bg-green-400/15"
                    : ""
                }`}
              >
                {viewModel.translationText}
                {viewModel.showLoadingDots && (
                  <span className="mc-dots">...</span>
                )}
              </button>
            )}

            {viewModel.showReload && (
              <button
                type="button"
                className={`${actionClass} text-violet-400`}
                title="Re-translate"
                onClick={viewModel.retranslate}
              >
                ↻
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] text-slate-500">{caption.time}</span>
        {translationEnabled && (
          <button
            type="button"
            className={`${actionClass} text-blue-400`}
            title="Translate"
            onClick={viewModel.manualTranslate}
          >
            Translate
          </button>
        )}
      </div>

      {viewModel.copied && (
        <span className="mc-copy-pop pointer-events-none absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-md bg-black/85 px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-green-400">
          ✓ Copied!
        </span>
      )}
    </article>
  );
}
