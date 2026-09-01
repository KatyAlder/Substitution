import { useEffect, useMemo, useState } from "react";
import { BroadcastPanel } from "../components/BroadcastPanel";
import { ParseRequestPanel } from "../components/ParseRequestPanel";
import { SlotPicker } from "../components/SlotPicker";
import { TierSection } from "../components/TierSection";
import { createSubstitutions, deleteSubstitution, markBroadcast, markDeadEnd, recordAttempt } from "../data/actions";
import type { NewSubstitutionInput } from "../data/actions";
import { useAppState } from "../data/AppStateContext";
import { weekdayName } from "../ranking/presence";
import { slotBell } from "../ranking/levels";
import { TIERS, rankCandidates } from "../ranking/rank";
import type { AttemptResult } from "../types/substitution";
import { buildSubstitutionMessage } from "../whatsapp";

export function CandidatesScreen() {
  const [state, setState] = useAppState();

  // Завчасні заміни, які ще не розіслані в чат — показуються окремою панеллю,
  // а не в черзі (розділ 1, 5 ТЗ: "спершу список у чат").
  const pendingBroadcast = useMemo(
    () => state.substitutions.filter((s) => s.mode === "planned" && s.status === "open"),
    [state.substitutions]
  );

  // Черга для опитування: термінові одразу, завчасні — тільки після розсилки ("в чаті").
  const queueSubstitutions = useMemo(
    () => state.substitutions.filter((s) => s.status === "in-chat" || (s.status === "open" && s.mode === "urgent")),
    [state.substitutions]
  );

  const [selectedId, setSelectedId] = useState<string | null>(queueSubstitutions[0]?.id ?? null);

  // Після закриття/тупика поточної заміни вона зникає з черги —
  // підхоплюємо наступну замість порожнього екрана.
  useEffect(() => {
    if (!queueSubstitutions.some((s) => s.id === selectedId)) {
      setSelectedId(queueSubstitutions[0]?.id ?? null);
    }
  }, [queueSubstitutions, selectedId]);

  const selected = queueSubstitutions.find((s) => s.id === selectedId) ?? null;

  const result = useMemo(() => (selected ? rankCandidates(state, selected) : null), [state, selected]);
  const absentTeacher = selected ? state.teachers.find((t) => t.id === selected.absentTeacherId) : undefined;
  const bell = selected ? slotBell(state.bells, selected.class, selected.lesson) : undefined;

  const whatsappMessage = selected && result ? buildSubstitutionMessage(selected, result.weekday, bell) : "";

  const attemptsForSelected = useMemo(
    () => (selected ? state.attempts.filter((a) => a.substitutionId === selected.id) : []),
    [state.attempts, selected]
  );

  function handleResult(teacherId: string, attemptResult: AttemptResult) {
    if (!selected) return;
    setState((prev) => recordAttempt(prev, selected.id, teacherId, attemptResult));
  }

  function handleDeadEnd() {
    if (!selected) return;
    if (!window.confirm("Позначити заміну як тупик — список кандидатів вичерпано?")) return;
    setState((prev) => markDeadEnd(prev, selected.id));
  }

  // Видалення — не те саме, що "Тупик": тупик лишається в історії й
  // статистиці, а видалення прибирає помилково заведену заміну повністю.
  function handleDeleteSubstitution(id: string) {
    const sub = state.substitutions.find((s) => s.id === id);
    if (!sub) return;
    const absent = state.teachers.find((t) => t.id === sub.absentTeacherId);
    const confirmMsg =
      `Видалити заміну ${sub.date}, урок ${sub.lesson}, ${sub.class} клас ` +
      `(відсутній: ${absent?.name ?? sub.absentTeacherId})? ` +
      "Разом з нею зникнуть записи обдзвону. Дію не можна скасувати.";
    if (!window.confirm(confirmMsg)) return;
    setState((prev) => deleteSubstitution(prev, id));
  }

  function handleMarkAllInChat() {
    setState((prev) => markBroadcast(prev, pendingBroadcast.map((s) => s.id)));
  }

  function handleCreate(inputs: NewSubstitutionInput[]) {
    setState((prev) => createSubstitutions(prev, inputs));
  }

  return (
    <main className="screen">
      <h1 className="screen__title">Активні заміни</h1>

      <ParseRequestPanel state={state} onCreate={handleCreate} />

      {pendingBroadcast.length > 0 && (
        <BroadcastPanel
          substitutions={pendingBroadcast}
          bells={state.bells}
          onMarkAllInChat={handleMarkAllInChat}
          onDelete={handleDeleteSubstitution}
        />
      )}

      {queueSubstitutions.length === 0 ? (
        <p className="screen__empty">Немає відкритих замін.</p>
      ) : (
        <SlotPicker
          substitutions={queueSubstitutions}
          teachers={state.teachers}
          bells={state.bells}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onDelete={handleDeleteSubstitution}
        />
      )}

      {selected && result && (
        <>
          <div className="slot-summary">
            <div className="slot-summary__main">
              {weekdayName(result.weekday)}, {selected.date} · {selected.class} клас
              {result.subject ? ` · ${result.subject}` : ""}
            </div>
            <div className="slot-summary__absent">відсутній: {absentTeacher?.name ?? selected.absentTeacherId}</div>
            {selected.status === "in-chat" && (
              <div className="slot-summary__in-chat">у чаті — згода тут рахується як добровільна</div>
            )}
            {result.labApplicable && (
              <div className={`slot-summary__lab${result.labAvailable ? "" : " slot-summary__lab--busy"}`}>
                лабораторія {result.room ?? "?"}: {result.labAvailable ? "вільна" : "зайнята іншим уроком"}
              </div>
            )}
          </div>

          {TIERS.map((tier) => (
            <TierSection
              key={tier}
              tier={tier}
              candidates={result.tiers[tier]}
              labApplicable={result.labApplicable}
              labAvailable={result.labAvailable}
              whatsappMessage={whatsappMessage}
              attempts={attemptsForSelected}
              onResult={handleResult}
            />
          ))}

          <button type="button" className="dead-end-btn" onClick={handleDeadEnd}>
            Тупик — список вичерпано
          </button>
        </>
      )}
    </main>
  );
}
