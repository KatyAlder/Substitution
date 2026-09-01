import { useMemo, useState } from "react";
import { importSchedule } from "../data/importSchedule";
import { parseScheduleImport, summarizeImport } from "../data/importValidation";
import { removeSeedTeachers } from "../data/actions";
import { SEED_TEACHER_IDS } from "../data/seed";
import { useAppState } from "../data/AppStateContext";

export function ImportScreen() {
  const [state, setState] = useAppState();
  const [text, setText] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const [seedDone, setSeedDone] = useState<string | null>(null);

  // Демо-вчителі, що ще лишились у базі після імпорту реальної.
  const seedLeft = useMemo(
    () => state.teachers.filter((t) => SEED_TEACHER_IDS.includes(t.id)),
    [state.teachers]
  );

  const parsed = useMemo(() => (text.trim() ? parseScheduleImport(text) : null), [text]);
  const summary = useMemo(() => (parsed?.ok ? summarizeImport(state, parsed.data) : null), [parsed, state]);

  function handleChange(value: string) {
    setText(value);
    setDone(null);
  }

  function handleImport() {
    if (!parsed?.ok || !summary) return;
    const confirmMsg =
      `Нових вчителів: ${summary.newTeachers.length}, оновлених: ${summary.updatedTeachers.length}. ` +
      `Нових записів розкладу: ${summary.newScheduleCount}, оновлених: ${summary.updatedScheduleCount}. ` +
      "Імпортувати?";
    if (!window.confirm(confirmMsg)) return;
    setState((prev) => importSchedule(prev, parsed.data));
    setDone(`Імпортовано. updatedAt бази: ${parsed.data.updatedAt}.`);
    setText("");
  }

  function handleRemoveSeed() {
    const confirmMsg =
      `Видалити ${seedLeft.length} тестових вчителів (${seedLeft.map((t) => t.name).join(", ")}) ` +
      "разом з їхнім розкладом, замінами й спробами? Дію не можна скасувати.";
    if (!window.confirm(confirmMsg)) return;
    setState((prev) => removeSeedTeachers(prev));
    setSeedDone(`Прибрано тестових вчителів: ${seedLeft.length}.`);
  }

  return (
    <main className="screen">
      <h1 className="screen__title">Імпорт розкладу</h1>
      <p className="parse-panel__hint">
        Вставте JSON базового розкладу (розділ 8 ТЗ). Оновлює лише вчителів і записи розкладу,
        що прийшли в JSON — заміни, спроби й статистику не чіпає.
      </p>

      <section className="parse-panel">
        <div className="parse-panel__field">
          <textarea
            className="parse-panel__textarea"
            placeholder='{"version": 1, "updatedAt": "2026-09-05", "bells": [...], "teachers": [...], "schedule": [...]}'
            value={text}
            onChange={(e) => handleChange(e.target.value)}
            rows={10}
          />
        </div>

        {parsed && !parsed.ok && <p className="parse-panel__warning">{parsed.error}</p>}

        {summary && (
          <div className="parse-panel__field">
            <div className="parse-panel__label">Що зміниться</div>
            <ul className="import-summary">
              <li>
                Нові вчителі: {summary.newTeachers.length}
                {summary.newTeachers.length > 0 ? ` — ${summary.newTeachers.join(", ")}` : ""}
              </li>
              <li>
                Оновлені вчителі: {summary.updatedTeachers.length}
                {summary.updatedTeachers.length > 0 ? ` — ${summary.updatedTeachers.join(", ")}` : ""}
              </li>
              <li>Нові записи розкладу: {summary.newScheduleCount}</li>
              <li>Оновлені записи розкладу: {summary.updatedScheduleCount}</li>
            </ul>
            {summary.unknownTeacherIds.length > 0 && (
              <p className="parse-panel__warning">
                Розклад посилається на вчителів, яких немає ні в базі, ні серед імпортованих —
                можливо, одрук в id: {summary.unknownTeacherIds.join(", ")}
              </p>
            )}
            {summary.bellsWithoutLevel && (
              <p className="parse-panel__warning">
                У дзвінках не вказано ланку (`level`). Тоді номер уроку знову стає спільним для всієї школи, і вчитель,
                зайнятий уроком у своїй ланці, вважатиметься вільним для заміни в іншій.
              </p>
            )}
          </div>
        )}

        {done && <p className="parse-panel__hint">{done}</p>}

        <div className="parse-panel__actions">
          <button type="button" className="btn btn--agree" disabled={!parsed?.ok} onClick={handleImport}>
            Імпортувати
          </button>
        </div>
      </section>

      {(seedLeft.length > 0 || seedDone) && (
        <section className="parse-panel">
          <div className="parse-panel__label">Тестові дані</div>
          {seedLeft.length > 0 ? (
            <>
              <p className="parse-panel__hint">
                У базі ще є вигадані вчителі, з якими застосунок постачався ({seedLeft.length}):{" "}
                {seedLeft.map((t) => t.name).join(", ")}. Разом з ними приберуться їхній розклад,
                заміни та спроби.
              </p>
              <div className="parse-panel__actions">
                <button type="button" className="btn btn--refuse" onClick={handleRemoveSeed}>
                  Прибрати тестових вчителів
                </button>
              </div>
            </>
          ) : (
            <p className="parse-panel__hint">{seedDone}</p>
          )}
        </section>
      )}
    </main>
  );
}
