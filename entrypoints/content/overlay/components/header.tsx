import type { ChangeEvent, RefObject } from "react";
import { GearIcon, MinusIcon, PlusIcon } from "@phosphor-icons/react";
import {
  LANGUAGES,
  MAX_AUTO_TRANSLATE_DISTANCE,
} from "@content/constants";
import { hasActiveProviderCredentials } from "@content/state";
import {
  clearTranslationQueue,
  enqueueNearbyCaptions,
} from "@content/translation-queue";
import type { Settings } from "@content/types";
import { saveOverlaySettings } from "@content/overlay/shared";
import { FontSizeControlContainer } from "./font-size-control";
import { WaveIndicator } from "./wave-indicator";

type Props = {
  headerRef: RefObject<HTMLDivElement | null>;
  isMinimized: boolean;
  isWaveActive: boolean;
  settings: Settings;
  onMinimize: () => void;
  onExpand: () => void;
};

const iconButtonClass =
  "flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent transition hover:bg-(--mc-overlay-control-hover) hover:text-white";

export const Header = ({
  headerRef,
  isMinimized,
  isWaveActive,
  settings,
  onMinimize,
  onExpand,
}: Props) => {
  const handleToggleTranslation = async () => {
    if (!settings.translationEnabled && !hasActiveProviderCredentials()) {
      chrome.runtime.sendMessage({ action: "openOptions" });
      return;
    }

    const enabled = !settings.translationEnabled;
    const saved = await saveOverlaySettings({ translationEnabled: enabled });
    if (!saved) return;
    if (enabled) enqueueNearbyCaptions(MAX_AUTO_TRANSLATE_DISTANCE);
    else clearTranslationQueue();
  };

  const handleTargetLanguageChange = (
    event: ChangeEvent<HTMLSelectElement>
  ) => {
    void saveOverlaySettings({ targetLanguage: event.target.value });
  };

  const handleOpenSettings = () => {
    void chrome.runtime.sendMessage({ action: "openOptions" });
  };

  if (isMinimized) {
    return (
      <div ref={headerRef} className="flex h-12 w-27 cursor-grab items-center justify-center gap-5 rounded-3xl bg-(--mc-overlay-header) select-none active:cursor-grabbing">
        <WaveIndicator active={isWaveActive} />
        <button className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-white transition-colors hover:bg-white/15" type="button" title="Expand" aria-label="Expand" onClick={onExpand}>
          <PlusIcon className="size-5" weight="regular" />
        </button>
      </div>
    );
  }

  return (
    <div ref={headerRef} className="flex h-14.5 min-w-max shrink-0 cursor-grab items-center gap-3 rounded-t-xl bg-(--mc-overlay-header) px-3.5 select-none active:cursor-grabbing">
      <div className="mr-auto flex shrink-0 items-center">
        <span className="text-sm font-semibold whitespace-nowrap text-white">Captions</span>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold whitespace-nowrap text-white">Translations</span>
          <button
            type="button"
            role="switch"
            aria-checked={settings.translationEnabled}
            title={settings.translationEnabled ? "Translation ON" : "Translation OFF"}
            onClick={handleToggleTranslation}
            className={`relative h-5 w-9 cursor-pointer rounded-full border-0 transition-colors ${
              settings.translationEnabled
                ? "bg-(--mc-primary)"
                : "bg-white/20"
            }`}
          >
            <span
              className={`absolute top-0.5 size-4 rounded-full bg-white transition-[left] ${
                settings.translationEnabled ? "left-4.5" : "left-0.5"
              }`}
            />
          </button>
        </div>

        <select
          aria-label="Target language"
          title="Target language"
          value={settings.targetLanguage}
          disabled={!settings.translationEnabled}
          onChange={handleTargetLanguageChange}
          className={`h-8 cursor-pointer rounded-md bg-(--mc-overlay-control) text-xs text-white outline-none transition-colors field-sizing-content hover:bg-(--mc-overlay-control-hover) ${
            settings.translationEnabled
              ? "w-fit border border-(--mc-overlay-control-border) px-2.5 opacity-100"
              : "pointer-events-none w-0 min-w-0 border-0 p-0 opacity-0"
          }`}
        >
          {LANGUAGES.map((language) => (
            <option key={language.code} value={language.code} className="bg-[#252540] text-white">
              {language.name}
            </option>
          ))}
        </select>

        <FontSizeControlContainer fontSize={settings.captionFontSize} />

        <div className="flex items-center gap-0.5">
          <button
            className={`${iconButtonClass} text-white`}
            type="button"
            title="Settings"
            onClick={handleOpenSettings}
          >
            <GearIcon className="size-6" weight="regular" />
          </button>
          <button className={`${iconButtonClass} text-white`} type="button" title="Minimize" onClick={onMinimize}>
            <MinusIcon className="size-4" weight="regular" />
          </button>
        </div>
      </div>
    </div>
  );
};
