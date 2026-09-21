import { useSyncExternalStore } from "react";
import {
  captions,
  getStateVersion,
  isCCEnabled,
  isWaveActive,
  settings,
  subscribe,
} from "@content/state";

export function useOverlayState() {
  const version = useSyncExternalStore(subscribe, getStateVersion, getStateVersion);

  return {
    captions,
    isCCEnabled,
    isWaveActive,
    settings,
    version,
  };
}
