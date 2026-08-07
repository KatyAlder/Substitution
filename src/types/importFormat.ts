import type { Bell, ScheduleEntry } from "./schedule";
import type { TimeBlock } from "./teacher";

export interface ImportTeacher {
  id: string;
  name: string;
  phone?: string;
  curatorOf?: string;
  isHourly?: boolean;
  alwaysPresent?: boolean;
  subjects: string[];
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
