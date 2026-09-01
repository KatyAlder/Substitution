import type { Bell, ScheduleEntry } from "./schedule";
import type { TeachingAssignment, TimeBlock } from "./teacher";

export interface ImportTeacher {
  id: string;
  name: string;
  phone?: string;
  curatorOf?: string;
  isHourly?: boolean;
  alwaysPresent?: boolean;
  subjects: string[];
  /** Необов'язкове. Відсутнє в JSON — наявне значення вчителя лишається
   *  (як phone/presence/goldenHours). Присутнє — заміщує. */
  teaches?: TeachingAssignment[];
  presence?: TimeBlock[];
  goldenHours?: TimeBlock[];
}

export interface ScheduleImport {
  version: number;
  updatedAt: string; // "YYYY-MM-DD"
  bells: Bell[];
  teachers: ImportTeacher[];
  schedule: ScheduleEntry[];
}
