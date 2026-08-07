import type { AppState } from "../types/state";
import type { AttemptResult, ClosedVia } from "../types/substitution";

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

/** Розсилка в чат (розділ 5 ТЗ) — переводить усі перелічені завчасні заміни
 *  в статус "в чаті" одним кліком, разом з переліком у повідомленні. */
export function markBroadcast(state: AppState, substitutionIds: string[]): AppState {
  const ids = new Set(substitutionIds);
  return {
    ...state,
    substitutions: state.substitutions.map((s) => (ids.has(s.id) ? { ...s, status: "in-chat" as const } : s)),
  };
}
