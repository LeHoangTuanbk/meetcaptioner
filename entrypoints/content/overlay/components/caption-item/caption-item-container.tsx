import type { Caption } from "@content/types";
import { CaptionItem } from "./caption-item";
import { useCaptionItem } from "./use-caption-item";

type Props = {
  caption: Caption;
  isTranslationEnabled: boolean;
};

export const CaptionItemContainer = ({
  caption,
  isTranslationEnabled,
}: Props) => {
  const {
    isEditing,
    copiedTarget,
    translationText,
    translationTone,
    isLoading,
    isReloadVisible,
    handleCancelEditing,
    handleCopyOriginal,
    handleCopyTranslation,
    handleManualTranslate,
    handleRetranslate,
    handleSaveTranslation,
    handleStartEditing,
  } = useCaptionItem(caption);

  return (
    <CaptionItem
      caption={caption}
      isTranslationEnabled={isTranslationEnabled}
      isEditing={isEditing}
      copiedTarget={copiedTarget}
      translationText={translationText}
      translationTone={translationTone}
      isLoading={isLoading}
      isReloadVisible={isReloadVisible}
      onCancelEditing={handleCancelEditing}
      onCopyOriginal={handleCopyOriginal}
      onCopyTranslation={handleCopyTranslation}
      onManualTranslate={handleManualTranslate}
      onRetranslate={handleRetranslate}
      onSaveTranslation={handleSaveTranslation}
      onStartEditing={handleStartEditing}
    />
  );
};
