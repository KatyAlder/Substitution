import type { ScheduleEntry } from "../types/schedule";
import type { AppState } from "../types/state";
import type { AttemptResult, ClosedVia, SubstitutionMode } from "../types/substitution";
import type { Teacher } from "../types/teacher";
import { SEED_TEACHER_IDS } from "./seed";

/** Записує спробу; при "agreed" одразу закриває заміну (розділ 3, 5 ТЗ).
 *  Канал закриття визначається статусом заміни в момент згоди: "in-chat"
 *  (завчасна, уже розіслана в чат) — це "voluntary" (розділ 3: "добровільно
 *  взяті з чату — теж звичайна згода"), інакше — "chat" (цей екран веде
 *  через WhatsApp-кнопку; окремого запису "закрито дзвінком" поки немає). */
export function recordAttempt(
  state: AppState,
  substitutionId: string,
  teacherId: string,
  result: AttemptResult
): AppState {
  const attempt = {
    id: crypto.randomUUID(),
    substitutionId,
    teacherId,
    at: new Date().toISOString(),
    result,
  };

  const target = state.substitutions.find((s) => s.id === substitutionId);
  const closedVia: ClosedVia = target?.status === "in-chat" ? "voluntary" : "chat";

  const substitutions =
    result === "agreed"
      ? state.substitutions.map((s) =>
          s.id === substitutionId ? { ...s, status: "closed" as const, substituteId: teacherId, closedVia } : s
        )
      : state.substitutions;

  return { ...state, attempts: [...state.attempts, attempt], substitutions };
}

/** Тупик — список кандидатів вичерпано. Причину (розділ 3 ТЗ) свідомо не пишемо. */
export function markDeadEnd(state: AppState, substitutionId: string): AppState {
  return {
    ...state,
    substitutions: state.substitutions.map((s) => (s.id === substitutionId ? { ...s, status: "dead-end" as const } : s)),
  };
}

/** Видалення заміни з переліку активних — на відміну від markDeadEnd, який
 *  лишає заміну в історії й статистиці (тупик — теж результат пошуку), це
 *  прибирає її повністю разом зі спробами обдзвону: для замін, заведених
 *  помилково (одрук у розборі тексту, скасований урок тощо). */
export function deleteSubstitution(state: AppState, substitutionId: string): AppState {
  return {
    ...state,
    substitutions: state.substitutions.filter((s) => s.id !== substitutionId),
    attempts: state.attempts.filter((a) => a.substitutionId !== substitutionId),
  };
}

/** Розсилка в чат (розділ 5 ТЗ) — переводить усі перелічені завчасні заміни
 *  в статус "в чаті" одним кліком, разом з переліком у повідомленні. */
export function markBroadcast(state: AppState, substitutionIds: string[]): AppState {
  const ids = new Set(substitutionIds);
  return {
    ...state,
    substitutions: state.substitutions.map((s) => (ids.has(s.id) ? { ...s, status: "in-chat" as const } : s)),
  };
}

export interface NewSubstitutionInput {
  date: string;
  lesson: number;
  class: string;
  absentTeacherId: string;
  mode: SubstitutionMode;
}

/** Заводить одну чи кілька нових замін одразу зі статусом "open" (розділ 6
 *  ТЗ — результат розбору тексту, і одиночний слот, і пакет "на весь
 *  день", це той самий шлях, просто масив різної довжини). Далі в чергу
 *  опитування чи в розсилку заводить наявна логіка CandidatesScreen за
 *  mode/status — тут нічого додатково не потрібно. */
export function createSubstitutions(state: AppState, inputs: NewSubstitutionInput[]): AppState {
  const created = inputs.map((input) => ({
    id: crypto.randomUUID(),
    ...input,
    status: "open" as const,
    officialCalendarUpdated: false,
  }));
  return { ...state, substitutions: [...state.substitutions, ...created] };
}

/** Ручне редагування профілю вчителя (екран "Профілі"). id — стабільний
 *  зовнішній ключ, тому свідомо не приймається в патчі. На відміну від
 *  importSchedule.mergeTeacher (яка робить incoming.X ?? existing.X), тут
 *  просте присвоєння — патч заміняє поле цілком, включно з можливістю
 *  очистити phone/curatorOf через undefined. */
export function updateTeacher(state: AppState, teacherId: string, patch: Omit<Partial<Teacher>, "id">): AppState {
  return {
    ...state,
    teachers: state.teachers.map((t) => (t.id === teacherId ? { ...t, ...patch } : t)),
  };
}

/** Ручне редагування базового тижневого розкладу одного вчителя (вкладка
 *  "Розклад"). Замінює ВСІ записи цього вчителя на передані — форма веде
 *  повний список його уроків. Унікальність (weekday, lesson) — інваріант
 *  scheduleKey з importSchedule.ts — гарантує форма перед збереженням.
 *  Записи інших учителів, дзвінки, заміни й спроби не чіпає. */
export function setTeacherSchedule(
  state: AppState,
  teacherId: string,
  entries: Omit<ScheduleEntry, "teacherId">[]
): AppState {
  const others = state.schedule.filter((e) => e.teacherId !== teacherId);
  return { ...state, schedule: [...others, ...entries.map((e) => ({ ...e, teacherId }))] };
}

/** Видалення вчителя — повне очищення (свідомий вибір Kate, а не
 *  лишати історію/тупики): прибирає вчителя, його розклад, усі заміни,
 *  де він відсутній або був замісником, і спроби, де він фігурує сам
 *  або що належали вже видаленим замінам. */
export function deleteTeacher(state: AppState, teacherId: string): AppState {
  const removedSubstitutionIds = new Set(
    state.substitutions
      .filter((s) => s.absentTeacherId === teacherId || s.substituteId === teacherId)
      .map((s) => s.id)
  );
  return {
    ...state,
    teachers: state.teachers.filter((t) => t.id !== teacherId),
    schedule: state.schedule.filter((e) => e.teacherId !== teacherId),
    substitutions: state.substitutions.filter((s) => !removedSubstitutionIds.has(s.id)),
    attempts: state.attempts.filter(
      (a) => a.teacherId !== teacherId && !removedSubstitutionIds.has(a.substitutionId)
    ),
  };
}

/** Одноразове прибирання вигаданих (сідових) вчителів після імпорту реальної
 *  бази. Йде тим самим шляхом, що й ручне видалення на "Профілях", —
 *  разом із вчителем зникають його розклад, заміни й спроби. */
export function removeSeedTeachers(state: AppState): AppState {
  return SEED_TEACHER_IDS.reduce((acc, id) => deleteTeacher(acc, id), state);
}
