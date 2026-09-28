import { useSyncExternalStore } from "react";
import {
  captions,
  getStateVersion,
  isCCEnabled,
  isMeetingEnded,
  isWaveActive,
  settings,
  subscribe,
} from "@content/state";

export function useOverlayState() {
  const version = useSyncExternalStore(subscribe, getStateVersion, getStateVersion);

  return {
    captions,
    isCCEnabled,
    isMeetingEnded,
    isWaveActive,
    settings,
    version,
  };
}
