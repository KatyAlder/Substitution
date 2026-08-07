export interface Bell {
  lesson: number;
  start: string; // "HH:MM"
  end: string; // "HH:MM"
}

export interface ScheduleEntry {
  teacherId: string;
  weekday: number;
  lesson: number;
  class: string;
  subject: string;
  room: string;
}
