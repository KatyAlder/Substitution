export type SubstitutionMode = "urgent" | "planned";
export type SubstitutionStatus = "open" | "in-chat" | "closed" | "dead-end";
export type ClosedVia = "call" | "chat" | "voluntary" | "manual";

export interface Substitution {
  id: string;
  date: string; // "YYYY-MM-DD"
  /** Час слоту — джерело істини (див. коментар у ScheduleEntry). */
  start: string; // "HH:MM"
  end: string; // "HH:MM"
  /** Номер уроку — лише підпис. */
  lesson: number;
  class: string;
  absentTeacherId: string;
  mode: SubstitutionMode;
  status: SubstitutionStatus;
  substituteId?: string;
  closedVia?: ClosedVia;
  officialCalendarUpdated: boolean;
  /** Кандидати "на олівці" — кого планую поставити на цю заміну (id вчителів,
   *  максимум 2). Це лише помітка для планування розподілу на день; на
   *  ранжування, статистику й закриття заміни не впливає. Відсутнє = порожньо. */
  shortlist?: string[];
}

export type AttemptResult = "agreed" | "refused" | "silent";

export interface Attempt {
  id: string;
  substitutionId: string;
  teacherId: string;
  at: string; // ISO timestamp
  result: AttemptResult;
}
