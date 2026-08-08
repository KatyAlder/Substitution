import type { TimeBlock } from "../types/teacher";

/** Локальна календарна дата як "YYYY-MM-DD" — НЕ `toISOString().slice(0, 10)`,
 *  бо та конвертує в UTC і в поясах на схід від нього (напр. UTC+3) відкушує
 *  день назад біля півночі. */
function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayIso(): string {
  return formatLocalDate(new Date());
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return formatLocalDate(d);
}

/** "YYYY-MM-DD" -> 1 = понеділок ... 7 = неділя (наскрізна конвенція ТЗ). */
export function dateToWeekday(dateStr: string): number {
  const jsDay = new Date(`${dateStr}T00:00:00`).getDay(); // 0 = неділя
  return ((jsDay + 6) % 7) + 1;
}

export const WEEKDAY_NAMES = [
  "понеділок",
  "вівторок",
  "середа",
  "четвер",
  "п'ятниця",
  "субота",
  "неділя",
];

export function weekdayName(weekday: number): string {
  return WEEKDAY_NAMES[weekday - 1] ?? "?";
}

export const SHORT_WEEKDAY_NAMES = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

export function shortWeekdayName(weekday: number): string {
  return SHORT_WEEKDAY_NAMES[weekday - 1] ?? "?";
}

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** Чи блок часу того самого дня тижня повністю покриває інтервал [start, end). */
function blockCovers(block: TimeBlock, weekday: number, start: string, end: string): boolean {
  if (block.weekday !== weekday) return false;
  return toMinutes(block.from) <= toMinutes(start) && toMinutes(end) <= toMinutes(block.to);
}

export function isPresentAtSlot(
  teacher: { alwaysPresent?: boolean; presence: TimeBlock[] },
  weekday: number,
  start: string,
  end: string
): boolean {
  if (teacher.alwaysPresent) return true;
  return teacher.presence.some((block) => blockCovers(block, weekday, start, end));
}

export function isInGoldenHour(
  teacher: { goldenHours: TimeBlock[] },
  weekday: number,
  start: string,
  end: string
): boolean {
  return teacher.goldenHours.some((block) => blockCovers(block, weekday, start, end));
}
