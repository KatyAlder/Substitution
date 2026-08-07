import type { Bell, ScheduleEntry } from "./schedule";
import type { Attempt, Substitution } from "./substitution";
import type { Teacher } from "./teacher";

export interface AppState {
  version: number;
  updatedAt: string; // "YYYY-MM-DD"
  bells: Bell[];
  teachers: Teacher[];
  schedule: ScheduleEntry[];
  substitutions: Substitution[];
  attempts: Attempt[];
}
