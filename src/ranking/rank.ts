import type { Teacher } from "../types/teacher";
import type { Bell, ScheduleEntry } from "../types/schedule";
import type { Attempt, Substitution } from "../types/substitution";
import { CONSECUTIVE_REFUSALS_THRESHOLD, TECHNICAL_SUBJECT_ROOMS } from "../config/settings";
import { classesOverlap } from "./classes";
import { dateToWeekday, isInGoldenHour, isPresentAtSlot } from "./presence";

export type Tier = 1 | 2 | 3 | 4 | 5 | 6;

export const TIERS: Tier[] = [1, 2, 3, 4, 5, 6];

export const TIER_LABELS: Record<Tier, string> = {
  1: "Присутні, викладають клас",
  2: "Куратори, викладають клас",
  3: "Не присутні зараз, але викладають клас",
  4: "Присутні, не викладають клас",
  5: "Куратори, не викладають клас",
  6: "Не присутні, не викладають клас",
};

export interface RankedCandidate {
  teacher: Teacher;
  tier: Tier;
  lessonsToday: number;
  substitutionsThisMonth: number;
  consecutiveRefusals: number;
  inGoldenHour: boolean;
  bonusCount: number;
}

export interface RankingResult {
  weekday: number;
  subject?: string;
  room?: string;
  /** Чи цей предмет взагалі прив'язаний до конкретної авдиторії (розділ 9). */
  labApplicable: boolean;
  /** Має сенс лише якщо labApplicable. */
  labAvailable: boolean;
  tiers: Record<Tier, RankedCandidate[]>;
}

export interface RankState {
  teachers: Teacher[];
  schedule: ScheduleEntry[];
  bells: Bell[];
  substitutions: Substitution[];
  attempts: Attempt[];
}

function getBell(bells: Bell[], lesson: number): Bell | undefined {
  return bells.find((b) => b.lesson === lesson);
}

/** Чи вчитель викладає у вказаному класі. Два незалежні джерела, об'єднані union:
 *  явне поле `teacher.teaches` (не потребує розкладу) і записи `schedule`.
 *  Спарена мітка ("5-6") зараховується як викладання в кожному зі своїх класів. */
function teacherTeachesClass(teacher: Teacher, schedule: ScheduleEntry[], className: string): boolean {
  if (teacher.teaches?.some((a) => a.classes.some((c) => classesOverlap(c, className)))) return true;
  return schedule.some((e) => e.teacherId === teacher.id && classesOverlap(e.class, className));
}

/** Предмет уроку відсутнього — зі `schedule`, а якщо повного розкладу немає,
 *  з його явного `teaches` за перетином класу. Потрібно лише для позначки
 *  про лабораторію технічного предмета (розділ 9). */
function absentSubject(
  absentEntry: ScheduleEntry | undefined,
  absentTeacher: Teacher | undefined,
  className: string
): string | undefined {
  if (absentEntry?.subject) return absentEntry.subject;
  return absentTeacher?.teaches?.find((a) => a.classes.some((c) => classesOverlap(c, className)))?.subject;
}

function lessonsOnWeekday(schedule: ScheduleEntry[], teacherId: string, weekday: number): number {
  return schedule.filter((e) => e.teacherId === teacherId && e.weekday === weekday).length;
}

function hasSelfConflict(schedule: ScheduleEntry[], teacherId: string, weekday: number, lesson: number): boolean {
  return schedule.some((e) => e.teacherId === teacherId && e.weekday === weekday && e.lesson === lesson);
}

/** Тир визначається виключно трьома ознаками — куратор / викладає / присутній.
 *  Погодинність тут ролі не грає: присутність погодинника рахується так само,
 *  через його власні (вручну заповнені) блоки `presence`. */
function classifyTier(isCurator: boolean, teaches: boolean, present: boolean): Tier {
  if (isCurator) return teaches ? 2 : 5;
  if (teaches) return present ? 1 : 3;
  return present ? 4 : 6;
}

export function monthOf(dateStr: string): string {
  return dateStr.slice(0, 7); // "YYYY-MM"
}

export const AGREED_CLOSED_VIA = new Set(["call", "chat", "voluntary", "manual"]);

function substitutionsThisMonth(substitutions: Substitution[], teacherId: string, dateStr: string): number {
  const month = monthOf(dateStr);
  return substitutions.filter(
    (s) =>
      s.substituteId === teacherId &&
      s.status === "closed" &&
      s.closedVia &&
      AGREED_CLOSED_VIA.has(s.closedVia) &&
      monthOf(s.date) === month
  ).length;
}

/** Мовчання не рахується й не переривається — просто пропускається,
 *  щоб не псувати лічильник тим, хто був на уроці (розділ 3). */
function consecutiveRefusals(attempts: Attempt[], teacherId: string): number {
  const relevant = attempts
    .filter((a) => a.teacherId === teacherId && a.result !== "silent")
    .sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));

  let count = 0;
  for (const attempt of relevant) {
    if (attempt.result === "refused") count++;
    else break;
  }
  return count;
}

export function rankCandidates(state: RankState, substitution: Substitution): RankingResult {
  const weekday = dateToWeekday(substitution.date);
  const bell = getBell(state.bells, substitution.lesson);

  const absentEntry = state.schedule.find(
    (e) =>
      e.teacherId === substitution.absentTeacherId &&
      e.weekday === weekday &&
      e.lesson === substitution.lesson &&
      classesOverlap(e.class, substitution.class)
  );
  const absentTeacher = state.teachers.find((t) => t.id === substitution.absentTeacherId);

  const subject = absentSubject(absentEntry, absentTeacher, substitution.class);
  const room = absentEntry?.room;
  const labApplicable = !!subject && subject in TECHNICAL_SUBJECT_ROOMS;
  const labAvailable =
    !labApplicable ||
    !room ||
    !state.schedule.some(
      (e) =>
        e.room === room &&
        e.weekday === weekday &&
        e.lesson === substitution.lesson &&
        e.teacherId !== substitution.absentTeacherId
    );

  const tiers: Record<Tier, RankedCandidate[]> = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

  if (bell) {
    for (const teacher of state.teachers) {
      if (teacher.id === substitution.absentTeacherId) continue;
      if (hasSelfConflict(state.schedule, teacher.id, weekday, substitution.lesson)) continue;

      const isCurator = !!teacher.curatorOf;
      const teaches = teacherTeachesClass(teacher, state.schedule, substitution.class);
      const present = isPresentAtSlot(teacher, weekday, bell.start, bell.end);
      const tier = classifyTier(isCurator, teaches, present);

      const inGoldenHour = isInGoldenHour(teacher, weekday, bell.start, bell.end);
      const refusalsStreak = consecutiveRefusals(state.attempts, teacher.id);
      const refusalsBonus = refusalsStreak >= CONSECUTIVE_REFUSALS_THRESHOLD;
      const bonusCount = (inGoldenHour ? 1 : 0) + (refusalsBonus ? 1 : 0);

      tiers[tier].push({
        teacher,
        tier,
        lessonsToday: lessonsOnWeekday(state.schedule, teacher.id, weekday),
        substitutionsThisMonth: substitutionsThisMonth(state.substitutions, teacher.id, substitution.date),
        consecutiveRefusals: refusalsStreak,
        inGoldenHour,
        bonusCount,
      });
    }
  }

  for (const tier of TIERS) {
    tiers[tier].sort((a, b) => {
      if (b.bonusCount !== a.bonusCount) return b.bonusCount - a.bonusCount;
      if (a.lessonsToday !== b.lessonsToday) return a.lessonsToday - b.lessonsToday;
      return a.teacher.name.localeCompare(b.teacher.name, "uk");
    });
  }

  return { weekday, subject, room, labApplicable, labAvailable, tiers };
}
