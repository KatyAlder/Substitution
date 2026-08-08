import { toMinutes } from "../ranking/presence";
import type { Bell, ScheduleEntry } from "../types/schedule";
import type { Substitution, SubstitutionMode } from "../types/substitution";

export interface DayLesson {
  entry: ScheduleEntry;
  bell?: Bell;
}

/** Уроки вчителя в конкретний weekday, відсортовані за номером уроку. */
export function teacherDayLessons(
  schedule: ScheduleEntry[],
  bells: Bell[],
  teacherId: string,
  weekday: number
): DayLesson[] {
  return schedule
    .filter((entry) => entry.teacherId === teacherId && entry.weekday === weekday)
    .sort((a, b) => a.lesson - b.lesson)
    .map((entry) => ({ entry, bell: bells.find((b) => b.lesson === entry.lesson) }));
}

export interface SlotResolution {
  /** Однозначно резолвлений урок цього вчителя цього дня. */
  matched?: DayLesson;
  /** Час не потрапив у жоден дзвінок школи взагалі — найближчий за часом початку, про який варто перепитати. */
  nearestBell?: Bell;
}

/** Нічого не вгадує мовчки (розділ 6 ТЗ): номер уроку, якого вчитель того
 *  дня не має, чи час, що не влучив у слот учителя, повертають `matched:
 *  undefined` — форма показує повний список його уроків цього дня для
 *  ручного вибору. Час, що не влучив у ЖОДЕН дзвінок школи (а не тільки
 *  учителя), додатково повертає `nearestBell` для підказки. */
export function resolveBySlot(
  bells: Bell[],
  lessons: DayLesson[],
  parsed: { lesson?: number; time?: string }
): SlotResolution {
  if (parsed.lesson !== undefined) {
    return { matched: lessons.find((l) => l.entry.lesson === parsed.lesson) };
  }

  if (parsed.time !== undefined) {
    const minutes = toMinutes(parsed.time);
    const containingBell = bells.find((b) => toMinutes(b.start) <= minutes && minutes < toMinutes(b.end));
    if (containingBell) {
      return { matched: lessons.find((l) => l.entry.lesson === containingBell.lesson) };
    }
    if (bells.length === 0) return {};
    const nearestBell = [...bells].sort(
      (a, b) => Math.abs(toMinutes(a.start) - minutes) - Math.abs(toMinutes(b.start) - minutes)
    )[0];
    return { nearestBell };
  }

  return {};
}

/** Заміна на цей date/lesson/class уже існує (будь-який статус) —
 *  попередити, а не створювати мовчки дублікат (розділ 6 ТЗ). */
export function findConflict(
  substitutions: Substitution[],
  date: string,
  lesson: number,
  className: string
): Substitution | undefined {
  return substitutions.find((s) => s.date === date && s.lesson === lesson && s.class === className);
}

/** Дата = сьогодні → термінова, інакше завчасна. Лише дефолт для форми —
 *  Kate завжди може перемкнути вручну. */
export function suggestedMode(date: string, referenceDate: string): SubstitutionMode {
  return date === referenceDate ? "urgent" : "planned";
}
