import type { ScheduleImport } from "../types/importFormat";
import type { AppState } from "../types/state";
import { scheduleKey } from "./importSchedule";
import { SCHOOL_LEVELS } from "../config/settings";

export type ImportParseResult = { ok: true; data: ScheduleImport } | { ok: false; error: string };

function isString(v: unknown): v is string {
  return typeof v === "string";
}

function isNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function checkTimeBlock(v: unknown, path: string): string | null {
  if (!isRecord(v)) return `${path}: очікувався об'єкт`;
  if (!isNumber(v.weekday)) return `${path}.weekday: очікувалося число`;
  if (!isString(v.from)) return `${path}.from: очікувався рядок`;
  if (!isString(v.to)) return `${path}.to: очікувався рядок`;
  return null;
}

function checkTimeBlockArray(v: unknown, path: string): string | null {
  if (!Array.isArray(v)) return `${path}: очікувався масив`;
  for (let i = 0; i < v.length; i++) {
    const err = checkTimeBlock(v[i], `${path}[${i}]`);
    if (err) return err;
  }
  return null;
}

function checkTeachingAssignment(v: unknown, path: string): string | null {
  if (!isRecord(v)) return `${path}: очікувався об'єкт`;
  if (!isString(v.subject)) return `${path}.subject: очікувався рядок`;
  if (!Array.isArray(v.classes) || !v.classes.every(isString)) return `${path}.classes: очікувався масив рядків`;
  return null;
}

function checkTeachingAssignmentArray(v: unknown, path: string): string | null {
  if (!Array.isArray(v)) return `${path}: очікувався масив`;
  for (let i = 0; i < v.length; i++) {
    const err = checkTeachingAssignment(v[i], `${path}[${i}]`);
    if (err) return err;
  }
  return null;
}

const LEVEL_IDS = SCHOOL_LEVELS.map((l) => l.id);

function checkBell(v: unknown, path: string): string | null {
  if (!isRecord(v)) return `${path}: очікувався об'єкт`;
  if (!isNumber(v.lesson)) return `${path}.lesson: очікувалося число`;
  if (!isString(v.start)) return `${path}.start: очікувався рядок`;
  if (!isString(v.end)) return `${path}.end: очікувався рядок`;
  if (v.level !== undefined) {
    if (!isString(v.level)) return `${path}.level: очікувався рядок`;
    if (!LEVEL_IDS.includes(v.level)) return `${path}.level: невідома ланка "${v.level}" (очікувалось: ${LEVEL_IDS.join(", ")})`;
  }
  return null;
}

function checkTeacher(v: unknown, path: string): string | null {
  if (!isRecord(v)) return `${path}: очікувався об'єкт`;
  if (!isString(v.id)) return `${path}.id: очікувався рядок`;
  if (!isString(v.name)) return `${path}.name: очікувався рядок`;
  if (!Array.isArray(v.subjects) || !v.subjects.every(isString)) return `${path}.subjects: очікувався масив рядків`;
  if (v.phone !== undefined && !isString(v.phone)) return `${path}.phone: очікувався рядок`;
  if (v.curatorOf !== undefined && !isString(v.curatorOf)) return `${path}.curatorOf: очікувався рядок`;
  if (v.isHourly !== undefined && typeof v.isHourly !== "boolean") return `${path}.isHourly: очікувалося true/false`;
  if (v.alwaysPresent !== undefined && typeof v.alwaysPresent !== "boolean")
    return `${path}.alwaysPresent: очікувалося true/false`;
  if (v.teaches !== undefined) {
    const err = checkTeachingAssignmentArray(v.teaches, `${path}.teaches`);
    if (err) return err;
  }
  if (v.presence !== undefined) {
    const err = checkTimeBlockArray(v.presence, `${path}.presence`);
    if (err) return err;
  }
  if (v.goldenHours !== undefined) {
    const err = checkTimeBlockArray(v.goldenHours, `${path}.goldenHours`);
    if (err) return err;
  }
  return null;
}

function checkScheduleEntry(v: unknown, path: string): string | null {
  if (!isRecord(v)) return `${path}: очікувався об'єкт`;
  if (!isString(v.teacherId)) return `${path}.teacherId: очікувався рядок`;
  if (!isNumber(v.weekday)) return `${path}.weekday: очікувалося число`;
  if (!isNumber(v.lesson)) return `${path}.lesson: очікувалося число`;
  if (!isString(v.class)) return `${path}.class: очікувався рядок`;
  if (!isString(v.subject)) return `${path}.subject: очікувався рядок`;
  if (!isString(v.room)) return `${path}.room: очікувався рядок`;
  return null;
}

/** Розбір і структурна перевірка JSON імпорту (розділ 8 ТЗ) — до злиття зі
 *  станом. Нічого не вгадує: перше ж поле, що не відповідає формату,
 *  повертає помилку з точним шляхом, а не намагається імпортувати частково. */
export function parseScheduleImport(text: string): ImportParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "Некоректний JSON: не вдалося розпарсити текст." };
  }

  if (!isRecord(raw)) return { ok: false, error: "Очікувався об'єкт верхнього рівня." };
  if (!isNumber(raw.version)) return { ok: false, error: "version: очікувалося число." };
  if (!isString(raw.updatedAt)) return { ok: false, error: "updatedAt: очікувався рядок формату YYYY-MM-DD." };
  if (!Array.isArray(raw.bells)) return { ok: false, error: "bells: очікувався масив." };
  if (!Array.isArray(raw.teachers)) return { ok: false, error: "teachers: очікувався масив." };
  if (!Array.isArray(raw.schedule)) return { ok: false, error: "schedule: очікувався масив." };

  for (let i = 0; i < raw.bells.length; i++) {
    const err = checkBell(raw.bells[i], `bells[${i}]`);
    if (err) return { ok: false, error: err };
  }
  for (let i = 0; i < raw.teachers.length; i++) {
    const err = checkTeacher(raw.teachers[i], `teachers[${i}]`);
    if (err) return { ok: false, error: err };
  }
  for (let i = 0; i < raw.schedule.length; i++) {
    const err = checkScheduleEntry(raw.schedule[i], `schedule[${i}]`);
    if (err) return { ok: false, error: err };
  }

  return { ok: true, data: raw as unknown as ScheduleImport };
}

export interface ImportSummary {
  newTeachers: string[];
  updatedTeachers: string[];
  newScheduleCount: number;
  updatedScheduleCount: number;
  /** teacherId у schedule, якого немає ні в наявних вчителях, ні серед вчителів у самому імпорті — типова ознака одруку. */
  unknownTeacherIds: string[];
  /** У жодного дзвінка немає `level`, хоча ланок кілька — тоді номер уроку
   *  знову стає глобальним, і вчитель, зайнятий у своїй ланці, вважатиметься
   *  вільним у чужій. Попередження, не блокування. */
  bellsWithoutLevel: boolean;
}

/** Прев'ю "що зміниться" перед підтвердженням — рахує нове/оновлене, не
 *  чіпаючи стан (`importSchedule` виконує саме злиття). */
export function summarizeImport(state: AppState, data: ScheduleImport): ImportSummary {
  const existingTeacherIds = new Set(state.teachers.map((t) => t.id));
  const newTeachers: string[] = [];
  const updatedTeachers: string[] = [];
  for (const t of data.teachers) {
    (existingTeacherIds.has(t.id) ? updatedTeachers : newTeachers).push(t.name);
  }

  const existingScheduleKeys = new Set(state.schedule.map(scheduleKey));
  let newScheduleCount = 0;
  let updatedScheduleCount = 0;
  for (const entry of data.schedule) {
    if (existingScheduleKeys.has(scheduleKey(entry))) updatedScheduleCount++;
    else newScheduleCount++;
  }

  const knownTeacherIds = new Set([...existingTeacherIds, ...data.teachers.map((t) => t.id)]);
  const unknownTeacherIds = Array.from(
    new Set(data.schedule.filter((e) => !knownTeacherIds.has(e.teacherId)).map((e) => e.teacherId))
  );

  const bellsWithoutLevel = data.bells.length > 0 && data.bells.every((b) => b.level === undefined);

  return { newTeachers, updatedTeachers, newScheduleCount, updatedScheduleCount, unknownTeacherIds, bellsWithoutLevel };
}
