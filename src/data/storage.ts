import type { AppState } from "../types/state";
import { seedState } from "./seed";

const STORAGE_KEY = "zaminy-state-v1";

export function loadState(): AppState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return seedState;
  try {
    return JSON.parse(raw) as AppState;
  } catch {
    return seedState;
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetToSeed(): AppState {
  saveState(seedState);
  return seedState;
}
