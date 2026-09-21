import { useEffect, useRef, useState } from "react";
import { TranslationStatus } from "@content/constants";
import {
  saveCaptionsDebounced,
  updateCaptionInHistory,
} from "@content/history-service";
import { copyToClipboard } from "@content/libs";
import { notifyStateChange } from "@content/state";
import {
  manualTranslate,
  retranslateCaption,
} from "@content/translation";
import type { Caption } from "@content/types";

export type CopyTarget = "original" | "translation";
export type TranslationTone = "default" | "refining" | "error";

export const useCaptionItem = (caption: Caption) => {
  const [isEditing, setIsEditing] = useState(false);
  const [copiedTarget, setCopiedTarget] = useState<CopyTarget | null>(null);
  const editTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (editTimerRef.current) clearTimeout(editTimerRef.current);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    },
    []
  );

  const handleCopy = async (value: string, target: CopyTarget) => {
    if (!value || !(await copyToClipboard(value))) return;

    setCopiedTarget(target);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopiedTarget(null), 2000);
  };

  const handleSaveTranslation = (value: string) => {
    setIsEditing(false);
    if (value === caption.translation) return;

    caption.translation = value;
    caption.userEdited = true;
    updateCaptionInHistory(caption.id, { translation: value });
    saveCaptionsDebounced();
    notifyStateChange();
  };

  const handleStartEditing = () => {
    if (
      caption.translationStatus === TranslationStatus.Translating ||
      caption.translationStatus === TranslationStatus.Refining
    ) {
      return;
    }

    if (editTimerRef.current) clearTimeout(editTimerRef.current);
    editTimerRef.current = setTimeout(() => setIsEditing(true), 220);
  };

  const handleCopyTranslation = () => {
    if (editTimerRef.current) clearTimeout(editTimerRef.current);
    void handleCopy(caption.translation, "translation");
  };

  let translationText = caption.translation;
  let translationTone: TranslationTone = "default";
  let showLoadingDots = false;

  if (
    caption.translationStatus === TranslationStatus.Translating ||
    caption.translationStatus === TranslationStatus.Pending
  ) {
    showLoadingDots = true;
  } else if (caption.translationStatus === TranslationStatus.Refining) {
    translationText = caption.translation ? `${caption.translation} ↻` : "...";
    translationTone = "refining";
  } else if (caption.translationStatus === TranslationStatus.Error) {
    translationText = caption.translation
      ? `${caption.translation} ⚠`
      : `⚠ ${caption.translationError || "Error"}`;
    translationTone = "error";
  }

  return {
    isEditing,
    copiedTarget,
    translationText,
    translationTone,
    isLoading: showLoadingDots,
    isReloadVisible:
      Boolean(caption.translation) &&
      caption.translationStatus !== TranslationStatus.Translating &&
      caption.translationStatus !== TranslationStatus.Refining,
    handleCancelEditing: () => setIsEditing(false),
    handleCopyOriginal: () => void handleCopy(caption.text, "original"),
    handleCopyTranslation,
    handleManualTranslate: () => manualTranslate(caption),
    handleRetranslate: () => retranslateCaption(caption),
    handleSaveTranslation,
    handleStartEditing,
  };
};
