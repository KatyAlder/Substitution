import { monthOf } from "../ranking/rank";
import { monthlyStats } from "../profile/stats";
import type { AppState } from "../types/state";

export interface TeacherMonthRow {
  teacherId: string;
  name: string;
  substitutions: number;
  refused: number;
  silent: number;
}

/** Один рядок на вчителя за місяць — зведення по всіх (розділ 5 ТЗ), на
 *  відміну від картки одного вчителя на профілі. Рахунок — той самий
 *  `monthlyStats`, що й на профілі, просто в циклі по всіх учителях. */
export function teacherMonthlyRows(state: AppState, month: string): TeacherMonthRow[] {
  return [...state.teachers]
    .sort((a, b) => a.name.localeCompare(b.name, "uk"))
    .map((teacher) => ({
      teacherId: teacher.id,
      name: teacher.name,
      ...monthlyStats(state, teacher.id, month),
    }));
}

export interface DeadEndRow {
  id: string;
  date: string;
  lesson: number;
  class: string;
  absentTeacherName: string;
}

/** Тупики не прив'язані до конкретного вчителя (немає кандидата, що взяв
 *  заміну) — тож окремий список, а не колонка в таблиці по вчителях. */
export function deadEndsForMonth(state: AppState, month: string): DeadEndRow[] {
  return state.substitutions
    .filter((s) => s.status === "dead-end" && monthOf(s.date) === month)
    .map((s) => ({
      id: s.id,
      date: s.date,
      lesson: s.lesson,
      class: s.class,
      absentTeacherName: state.teachers.find((t) => t.id === s.absentTeacherId)?.name ?? s.absentTeacherId,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** "2026-09" -> "2026-08" / "2026-10", коректно згортає межу року. */
export function shiftMonth(month: string, deltaMonths: number): string {
  const [year, monthNum] = month.split("-").map(Number);
  const d = new Date(year, monthNum - 1 + deltaMonths, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
