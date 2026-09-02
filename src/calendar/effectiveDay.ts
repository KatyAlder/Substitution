import type { AppState } from "../types/state";
import type { SubstitutionStatus } from "../types/substitution";
import { classesOverlap } from "../ranking/classes";
import { intervalsOverlap } from "../ranking/levels";
import { dateToWeekday } from "../ranking/presence";

export interface EffectiveSlot {
  start: string;
  end: string;
  lesson: number;
  class: string;
  subject: string;
  room: string;
  /** Хто фактично веде цей слот. */
  teacherId: string;
  /** true — слот перейшов заміснику (закрита заміна). */
  isSubstitution: boolean;
  /** teacherId відсутнього, якщо isSubstitution. */
  substituteFor?: string;
  /** Заміна на цей слот ще не закрита — "open" / "in-chat" / "dead-end". */
  pendingStatus?: SubstitutionStatus;
}

/** Актуальний розклад дня = база + заміни (розділ 2, 5 ТЗ).
 *  Закрита заміна знімає слот з календаря відсутнього і додає заміснику;
 *  незакрита лишає слот за відсутнім, але з позначкою статусу пошуку. */
export function effectiveDaySchedule(state: AppState, date: string): EffectiveSlot[] {
  const weekday = dateToWeekday(date);
  const daySubstitutions = state.substitutions.filter((s) => s.date === date);

  return state.schedule
    .filter((entry) => entry.weekday === weekday)
    .map((entry) => {
      const sub = daySubstitutions.find(
        (s) =>
          intervalsOverlap(s, entry) && classesOverlap(s.class, entry.class) && s.absentTeacherId === entry.teacherId
      );

      if (sub?.status === "closed" && sub.substituteId) {
        return {
          start: entry.start,
          end: entry.end,
          lesson: entry.lesson,
          class: entry.class,
          subject: entry.subject,
          room: entry.room,
          teacherId: sub.substituteId,
          isSubstitution: true,
          substituteFor: entry.teacherId,
        };
      }

      return {
        start: entry.start,
        end: entry.end,
        lesson: entry.lesson,
        class: entry.class,
        subject: entry.subject,
        room: entry.room,
        teacherId: entry.teacherId,
        isSubstitution: false,
        pendingStatus: sub && sub.status !== "closed" ? sub.status : undefined,
      };
    });
}
