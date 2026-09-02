import type { AppState } from "../types/state";
import { migrateState } from "./migrate";
import { seedState } from "./seed";

const STORAGE_KEY = "zaminy-state-v1";

export function loadState(): AppState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return seedState;
  try {
    // Бази, збережені до того, як час уроку став окремим полем, конвертуються
    // тут один раз — далі номер уроку на логіку не впливає взагалі.
    return migrateState(JSON.parse(raw) as AppState).state;
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
