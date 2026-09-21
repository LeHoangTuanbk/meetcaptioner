import { useSyncExternalStore } from "react";

export type OverlayToast = {
  id: number;
  message: string;
};

type Listener = () => void;

const listeners = new Set<Listener>();
let currentToast: OverlayToast | null = null;
let dismissTimer: ReturnType<typeof setTimeout> | null = null;

function emit(): void {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): OverlayToast | null {
  return currentToast;
}

export function dismissToast(): void {
  if (dismissTimer) clearTimeout(dismissTimer);
  dismissTimer = null;
  currentToast = null;
  emit();
}

export function showErrorToast(message: string): void {
  if (dismissTimer) clearTimeout(dismissTimer);
  currentToast = { id: Date.now(), message };
  emit();
  dismissTimer = setTimeout(dismissToast, 4000);
}

export function useOverlayToast(): OverlayToast | null {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
