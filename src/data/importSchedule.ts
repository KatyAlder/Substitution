import type { ScheduleEntry } from "../types/schedule";
import type { AppState } from "../types/state";
import type { ImportTeacher, ScheduleImport } from "../types/importFormat";
import type { Teacher } from "../types/teacher";

function mergeTeacher(existing: Teacher | undefined, incoming: ImportTeacher): Teacher {
  return {
    id: incoming.id,
    name: incoming.name,
    phone: incoming.phone ?? existing?.phone,
    curatorOf: incoming.curatorOf ?? existing?.curatorOf,
    isHourly: incoming.isHourly ?? existing?.isHourly,
    alwaysPresent: incoming.alwaysPresent ?? existing?.alwaysPresent,
    subjects: incoming.subjects,
    presence: incoming.presence ?? existing?.presence ?? [],
    goldenHours: incoming.goldenHours ?? existing?.goldenHours ?? [],
  };
}

function scheduleKey(entry: Pick<ScheduleEntry, "teacherId" | "weekday" | "lesson">): string {
  return `${entry.teacherId}|${entry.weekday}|${entry.lesson}`;
}

function mergeSchedule(existing: ScheduleEntry[], incoming: ScheduleEntry[]): ScheduleEntry[] {
  const byKey = new Map(existing.map((entry) => [scheduleKey(entry), entry]));
  for (const entry of incoming) {
    byKey.set(scheduleKey(entry), entry);
  }
  return Array.from(byKey.values());
}

/** Часткове оновлення бази (розділ 8): чіпає лише вчителів і записи розкладу,
 *  що прийшли в JSON. Заміни, спроби й статистику не чіпає. Вчитель
 *  оновлюється патчем поверх наявного запису (поле відсутнє в імпорті —
 *  лишається старе значення), запис розкладу — заміною за ключем
 *  (teacherId, weekday, lesson). */
export function importSchedule(state: AppState, json: ScheduleImport): AppState {
  const teacherById = new Map(state.teachers.map((t) => [t.id, t]));
  for (const incoming of json.teachers) {
    teacherById.set(incoming.id, mergeTeacher(teacherById.get(incoming.id), incoming));
  }

  return {
    ...state,
    version: json.version,
    updatedAt: json.updatedAt,
    bells: json.bells,
    teachers: Array.from(teacherById.values()),
    schedule: mergeSchedule(state.schedule, json.schedule),
  };
}
