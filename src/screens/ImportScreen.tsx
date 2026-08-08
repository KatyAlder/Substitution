import { useMemo, useState } from "react";
import { importSchedule } from "../data/importSchedule";
import { parseScheduleImport, summarizeImport } from "../data/importValidation";
import { useAppState } from "../data/useAppState";

export function ImportScreen() {
  const [state, setState] = useAppState();
  const [text, setText] = useState("");
  const [done, setDone] = useState<string | null>(null);

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
          </div>
        )}

        {done && <p className="parse-panel__hint">{done}</p>}

        <div className="parse-panel__actions">
          <button type="button" className="btn btn--agree" disabled={!parsed?.ok} onClick={handleImport}>
            Імпортувати
          </button>
        </div>
      </section>
    </main>
  );
}
