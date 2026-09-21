import type { RefObject } from "react";
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
import { WaveIndicator } from "./wave-indicator";

type HeaderProps = {
  headerRef: RefObject<HTMLDivElement | null>;
  isMinimized: boolean;
  isWaveActive: boolean;
  settings: Settings;
  onMinimize: () => void;
  onExpand: () => void;
};

const iconButtonClass =
  "flex size-7 shrink-0 items-center justify-center rounded-lg border-0 bg-transparent text-base text-white/60 transition hover:bg-white/10 hover:text-white";

export function Header({
  headerRef,
  isMinimized,
  isWaveActive,
  settings,
  onMinimize,
  onExpand,
}: HeaderProps) {
  const toggleTranslation = async () => {
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

  if (isMinimized) {
    return (
      <div ref={headerRef} className="flex cursor-grab items-center gap-2 rounded-xl bg-[#252540] px-3 py-2 select-none active:cursor-grabbing">
        <WaveIndicator active={isWaveActive} />
        <button className={iconButtonClass} type="button" title="Expand" onClick={onExpand}>
          +
        </button>
      </div>
    );
  }

  return (
    <div ref={headerRef} className="flex shrink-0 cursor-grab items-center gap-3 rounded-t-xl bg-[#252540] px-3.5 py-2.5 select-none active:cursor-grabbing">
      <div className="flex flex-1 items-center">
        <span className="text-sm font-semibold whitespace-nowrap text-white">Captions</span>
      </div>

      <div className="flex flex-1 items-center justify-end gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold whitespace-nowrap text-white">Translations</span>
          <button
            type="button"
            role="switch"
            aria-checked={settings.translationEnabled}
            title={settings.translationEnabled ? "Translation ON" : "Translation OFF"}
            onClick={toggleTranslation}
            className={`relative h-5 w-9 cursor-pointer rounded-full border-0 transition-colors ${
              settings.translationEnabled ? "bg-emerald-500" : "bg-white/20"
            }`}
          >
            <span
              className={`absolute top-0.5 size-4 rounded-full bg-white transition-[left] ${
                settings.translationEnabled ? "left-[18px]" : "left-0.5"
              }`}
            />
          </button>
        </div>

        <select
          aria-label="Target language"
          title="Target language"
          value={settings.targetLanguage}
          disabled={!settings.translationEnabled}
          onChange={(event) => saveOverlaySettings({ targetLanguage: event.target.value })}
          className={`cursor-pointer rounded-md bg-white/8 text-xs text-white outline-none transition-all hover:bg-white/12 ${
            settings.translationEnabled
              ? "min-w-[100px] border border-white/15 px-2.5 py-1.5 opacity-100 hover:border-white/25"
              : "pointer-events-none w-0 min-w-0 border-0 p-0 opacity-0"
          }`}
        >
          {LANGUAGES.map((language) => (
            <option key={language.code} value={language.code} className="bg-[#252540] text-white">
              {language.name}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-0.5 opacity-50 transition-opacity hover:opacity-100">
          <button className={iconButtonClass} type="button" title="Settings" onClick={() => chrome.runtime.sendMessage({ action: "openOptions" })}>
            ⚙
          </button>
          <button className={iconButtonClass} type="button" title="Minimize" onClick={onMinimize}>
            −
          </button>
        </div>
      </div>
    </div>
  );
}
