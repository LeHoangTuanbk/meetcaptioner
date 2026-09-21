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

type CopyTarget = "original" | "translation";
type TranslationTone = "default" | "refining" | "error";

export function useCaptionItem(caption: Caption) {
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState<CopyTarget | null>(null);
  const editTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (editTimerRef.current) clearTimeout(editTimerRef.current);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    },
    []
  );

  const copy = async (value: string, target: CopyTarget) => {
    if (!value || !(await copyToClipboard(value))) return;

    setCopied(target);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(null), 2000);
  };

  const saveTranslation = (value: string) => {
    setEditing(false);
    if (value === caption.translation) return;

    caption.translation = value;
    caption.userEdited = true;
    updateCaptionInHistory(caption.id, { translation: value });
    saveCaptionsDebounced();
    notifyStateChange();
  };

  const startEditing = () => {
    if (
      caption.translationStatus === TranslationStatus.Translating ||
      caption.translationStatus === TranslationStatus.Refining
    ) {
      return;
    }

    if (editTimerRef.current) clearTimeout(editTimerRef.current);
    editTimerRef.current = setTimeout(() => setEditing(true), 220);
  };

  const copyTranslation = () => {
    if (editTimerRef.current) clearTimeout(editTimerRef.current);
    void copy(caption.translation, "translation");
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
    editing,
    copied,
    translationText,
    translationTone,
    showLoadingDots,
    showReload:
      Boolean(caption.translation) &&
      caption.translationStatus !== TranslationStatus.Translating &&
      caption.translationStatus !== TranslationStatus.Refining,
    cancelEditing: () => setEditing(false),
    copyOriginal: () => void copy(caption.text, "original"),
    copyTranslation,
    manualTranslate: () => manualTranslate(caption),
    retranslate: () => retranslateCaption(caption),
    saveTranslation,
    startEditing,
  };
}

export type CaptionItemViewModel = ReturnType<typeof useCaptionItem>;
