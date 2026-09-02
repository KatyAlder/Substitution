import { slotInterval } from "../ranking/levels";
import type { AppState } from "../types/state";
import type { Bell } from "../types/schedule";

/** Міграція баз, збережених до того, як час уроку став окремим полем.
 *  Раніше час виводився з номера уроку через `bells` — а це і було дірою
 *  (у кожної ланки школи своя нумерація). Тут ми робимо цю конвертацію
 *  востаннє й записуємо час явно.
 *
 *  Запис, для якого час вивести не вдалось (номера немає в дзвінках), НЕ
 *  викидається — він лишається з порожнім часом, щоб не зникнути мовчки:
 *  форма "Розклад" покаже його як незаповнений рядок, який видно й можна
 *  полагодити руками. */
function timesFor(bells: Bell[], className: string, lesson: number): { start: string; end: string } {
  return slotInterval(bells, className, lesson) ?? { start: "", end: "" };
}

export interface MigrationReport {
  changed: boolean;
  /** Записи розкладу й заміни, яким час вивести не вдалося. */
  unresolvedSchedule: number;
  unresolvedSubstitutions: number;
}

export function migrateState(state: AppState): { state: AppState; report: MigrationReport } {
  const needsSchedule = state.schedule.some((e) => !e.start || !e.end);
  const needsSubstitutions = state.substitutions.some((s) => !s.start || !s.end);
  if (!needsSchedule && !needsSubstitutions) {
    return { state, report: { changed: false, unresolvedSchedule: 0, unresolvedSubstitutions: 0 } };
  }

  const schedule = state.schedule.map((e) =>
    e.start && e.end ? e : { ...e, ...timesFor(state.bells, e.class, e.lesson) }
  );
  const substitutions = state.substitutions.map((s) =>
    s.start && s.end ? s : { ...s, ...timesFor(state.bells, s.class, s.lesson) }
  );

  return {
    state: { ...state, schedule, substitutions },
    report: {
      changed: true,
      unresolvedSchedule: schedule.filter((e) => !e.start).length,
      unresolvedSubstitutions: substitutions.filter((s) => !s.start).length,
    },
  };
}
