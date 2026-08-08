import type { Bell, ScheduleEntry } from "./schedule";
import type { Attempt, Substitution } from "./substitution";
import type { Teacher } from "./teacher";

export interface AppState {
  version: number;
  updatedAt: string; // "YYYY-MM-DD", дата збірки бази (розділ 8 ТЗ, імпорт) — не чіпати для синхронізації
  bells: Bell[];
  teachers: Teacher[];
  schedule: ScheduleEntry[];
  substitutions: Substitution[];
  attempts: Attempt[];
  meta?: SyncMeta; // технічна мітка для Google Drive-синхронізації, не частина формату імпорту
}

export interface SyncMeta {
  updatedAt: number; // Date.now() в мс, проставляється useAppState перед кожним збереженням
}
