import { useMemo, useState } from "react";
import {
  ScheduleListEditor,
  emptyRow,
  entryToRow,
  isScheduleRowValid,
  rowToEntry,
  type ScheduleRow,
} from "../components/ScheduleListEditor";
import { TeacherPicker } from "../components/TeacherPicker";
import { setTeacherSchedule } from "../data/actions";
import { useAppState } from "../data/AppStateContext";
import { intervalsOverlap } from "../ranking/levels";
import { shortWeekdayName, toMinutes } from "../ranking/presence";
import type { ScheduleEntry } from "../types/schedule";
import type { Teacher } from "../types/teacher";

function firstIdByName(teachers: Teacher[]): string | null {
  return [...teachers].sort((a, b) => a.name.localeCompare(b.name, "uk"))[0]?.id ?? null;
}

function sortRows(rows: ScheduleRow[]): ScheduleRow[] {
  return [...rows].sort((a, b) => a.weekday - b.weekday || toMinutes(a.start) - toMinutes(b.start));
}

export function ScheduleScreen() {
  const [state] = useAppState();
  const [selectedId, setSelectedId] = useState<string | null>(() => firstIdByName(state.teachers));

  const teacher = state.teachers.find((t) => t.id === selectedId) ?? null;

  return (
    <main className="screen">
      <h1 className="screen__title">Розклад</h1>

      {state.teachers.length === 0 ? (
        <p className="screen__empty">Немає вчителів у базі.</p>
      ) : (
        <TeacherPicker teachers={state.teachers} selectedId={selectedId} onSelect={setSelectedId} />
      )}

      {teacher && <ScheduleForm key={teacher.id} teacher={teacher} />}
    </main>
  );
}

function ScheduleForm({ teacher }: { teacher: Teacher }) {
  const [state, setState] = useAppState();

  const stored = useMemo<ScheduleRow[]>(
    () => sortRows(state.schedule.filter((e) => e.teacherId === teacher.id).map(entryToRow)),
    [state.schedule, teacher.id]
  );
  const [rows, setRows] = useState<ScheduleRow[]>(stored);

  const subjectOptions = useMemo(
    () => [...new Set([...teacher.subjects, ...state.schedule.map((e) => e.subject)])].sort((a, b) => a.localeCompare(b, "uk")),
    [teacher.subjects, state.schedule]
  );
  const startOptions = useMemo(
    () => [...new Set(state.bells.map((b) => b.start))].sort((a, b) => toMinutes(a) - toMinutes(b)),
    [state.bells]
  );
  const endOptions = useMemo(
    () => [...new Set(state.bells.map((b) => b.end))].sort((a, b) => toMinutes(a) - toMinutes(b)),
    [state.bells]
  );
  const roomOptions = useMemo(
    () => [...new Set(state.schedule.map((e) => e.room).filter(Boolean))].sort((a, b) => a.localeCompare(b, "uk")),
    [state.schedule]
  );

  // Перевіряємо накладку за ЧАСОМ, а не за номером уроку: у різних ланках
  // однакові номери — різний час (тож "урок 2 у 3 класі" і "урок 2 у 9-А"
  // цілком співіснують), а різні номери можуть перетинатися.
  const overlap = useMemo(() => {
    const valid = rows.filter(isScheduleRowValid).map((r) => ({ row: r, entry: rowToEntry(r) }));
    for (let i = 0; i < valid.length; i++) {
      for (let j = i + 1; j < valid.length; j++) {
        const a = valid[i];
        const b = valid[j];
        if (a.entry.weekday !== b.entry.weekday) continue;
        if (intervalsOverlap(a.entry, b.entry)) return [a.row, b.row] as const;
      }
    }
    return null;
  }, [rows]);

  const dirty = useMemo(() => JSON.stringify(rows) !== JSON.stringify(stored), [rows, stored]);
  const isValid = rows.every(isScheduleRowValid) && !overlap;

  function handleSave() {
    if (!isValid) return;
    const entries: Omit<ScheduleEntry, "teacherId">[] = rows.map(rowToEntry);
    setState((prev) => setTeacherSchedule(prev, teacher.id, entries));
    setRows(sortRows(entries.map(entryToRow)));
  }

  return (
    <section className="parse-panel">
      <ScheduleListEditor
        rows={rows}
        onChange={setRows}
        subjectOptions={subjectOptions}
        roomOptions={roomOptions}
        startOptions={startOptions}
        endOptions={endOptions}
      />

      <button type="button" className="btn" onClick={() => setRows([...rows, emptyRow()])}>
        + Додати урок
      </button>

      {overlap && (
        <p className="parse-panel__warning">
          {shortWeekdayName(overlap[0].weekday)}: {overlap[0].start}–{overlap[0].end} ({overlap[0].classes.join("/")}) і{" "}
          {overlap[1].start}–{overlap[1].end} ({overlap[1].classes.join("/")}) перетинаються — вчитель не може вести
          обидва уроки.
        </p>
      )}

      <div className="parse-panel__actions">
        <button type="button" className="btn btn--agree" disabled={!isValid || !dirty} onClick={handleSave}>
          Зберегти
        </button>
        <button type="button" className="btn" disabled={!dirty} onClick={() => setRows(stored)}>
          Скинути зміни
        </button>
      </div>
    </section>
  );
}
