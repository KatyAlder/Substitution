import type { ScheduleEntry } from "../types/schedule";
import type { AppState } from "../types/state";
import type { ImportScheduleEntry, ImportTeacher, ScheduleImport } from "../types/importFormat";
import type { Teacher } from "../types/teacher";
import { slotInterval } from "../ranking/levels";
import type { Bell } from "../types/schedule";

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

/** Ключ запису розкладу — вчитель, день і ЧАС початку. Номер уроку для
 *  цього непридатний: у кожної ланки школи своя нумерація, тож урок 1 у
 *  3 класі й урок 1 у 9-А того самого дня затирали б одне одного. */
export function scheduleKey(entry: Pick<ScheduleEntry, "teacherId" | "weekday" | "start">): string {
  return `${entry.teacherId}|${entry.weekday}|${entry.start}`;
}

/** Час запису імпорту: явний `start`/`end`, інакше виведений із `bells`
 *  за парою (клас → ланка, номер уроку). `undefined` — валідація імпорту
 *  такий запис не пропускає, тож сюди він не доходить. */
export function importEntryTimes(entry: ImportScheduleEntry, bells: Bell[]): { start: string; end: string } | undefined {
  if (entry.start && entry.end) return { start: entry.start, end: entry.end };
  return slotInterval(bells, entry.class, entry.lesson);
}

function toScheduleEntry(entry: ImportScheduleEntry, bells: Bell[]): ScheduleEntry | undefined {
  const times = importEntryTimes(entry, bells);
  if (!times) return undefined;
  const { start: _s, end: _e, ...rest } = entry;
  return { ...rest, start: times.start, end: times.end };
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
 *  (teacherId, weekday, start). З `replaceSchedule: true` розклад
 *  замінюється цілком (вчителів це не стосується). */
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
    schedule: mergeSchedule(
      json.replaceSchedule ? [] : state.schedule,
      json.schedule.map((e) => toScheduleEntry(e, json.bells)).filter((e): e is ScheduleEntry => e !== undefined)
    ),
  };
}
