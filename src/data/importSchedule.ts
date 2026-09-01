import type { ScheduleEntry } from "../types/schedule";
import type { AppState } from "../types/state";
import type { ImportTeacher, ScheduleImport } from "../types/importFormat";
import type { Teacher } from "../types/teacher";
import { levelIdsForClass } from "../ranking/levels";

function mergeTeacher(existing: Teacher | undefined, incoming: ImportTeacher): Teacher {
  return {
    id: incoming.id,
    name: incoming.name,
    phone: incoming.phone ?? existing?.phone,
    curatorOf: incoming.curatorOf ?? existing?.curatorOf,
    isHourly: incoming.isHourly ?? existing?.isHourly,
    alwaysPresent: incoming.alwaysPresent ?? existing?.alwaysPresent,
    subjects: incoming.subjects,
    teaches: incoming.teaches ?? existing?.teaches,
    presence: incoming.presence ?? existing?.presence ?? [],
    goldenHours: incoming.goldenHours ?? existing?.goldenHours ?? [],
  };
}

/** Ключ запису розкладу. Номер уроку унікальний лише в межах ланки школи,
 *  тож без неї урок 1 у 3 класі й урок 1 у 9-А того самого дня дали б один
 *  ключ і затерли б одне одного при імпорті. */
export function scheduleKey(entry: Pick<ScheduleEntry, "teacherId" | "weekday" | "lesson" | "class">): string {
  return `${entry.teacherId}|${entry.weekday}|${entry.lesson}|${levelIdsForClass(entry.class).sort().join(",")}`;
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
