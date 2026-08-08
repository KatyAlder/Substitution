import { useMemo, useState } from "react";
import { ChipPicker } from "../components/ChipPicker";
import { DayAgenda } from "../components/DayAgenda";
import { TeacherPicker } from "../components/TeacherPicker";
import { effectiveDaySchedule } from "../calendar/effectiveDay";
import { useAppState } from "../data/useAppState";
import { dateToWeekday, weekdayName } from "../ranking/presence";

type FilterMode = "teacher" | "class" | "room";

const MODE_ITEMS: { value: FilterMode; label: string }[] = [
  { value: "teacher", label: "Вчитель" },
  { value: "class", label: "Клас" },
  { value: "room", label: "Авдиторія" },
];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function shiftDate(date: string, deltaDays: number): string {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

export function CalendarScreen() {
  const [state] = useAppState();
  const [date, setDate] = useState(todayIso());
  const [mode, setMode] = useState<FilterMode>("teacher");
  const [selectedValue, setSelectedValue] = useState<string | null>(null);

  const classes = useMemo(
    () => [...new Set(state.schedule.map((e) => e.class))].sort((a, b) => a.localeCompare(b, "uk")),
    [state.schedule]
  );
  const rooms = useMemo(
    () => [...new Set(state.schedule.map((e) => e.room))].sort((a, b) => a.localeCompare(b, "uk")),
    [state.schedule]
  );

  const daySlots = useMemo(() => effectiveDaySchedule(state, date), [state, date]);

  const filteredSlots = useMemo(() => {
    if (!selectedValue) return [];
    if (mode === "teacher") return daySlots.filter((s) => s.teacherId === selectedValue);
    if (mode === "class") return daySlots.filter((s) => s.class === selectedValue);
    return daySlots.filter((s) => s.room === selectedValue);
  }, [daySlots, mode, selectedValue]);

  const selectedTeacher = mode === "teacher" ? state.teachers.find((t) => t.id === selectedValue) : undefined;
  const presence =
    mode === "teacher" && selectedTeacher
      ? {
          alwaysPresent: selectedTeacher.alwaysPresent,
          blocks: selectedTeacher.presence.filter((b) => b.weekday === dateToWeekday(date)),
        }
      : undefined;

  function handleModeChange(value: string) {
    setMode(value as FilterMode);
    setSelectedValue(null);
  }

  return (
    <main className="screen">
      <h1 className="screen__title">Календар</h1>

      <div className="calendar-controls">
        <button type="button" onClick={() => setDate((d) => shiftDate(d, -1))} aria-label="попередній день">
          ◀
        </button>
        <input
          type="date"
          className="calendar-controls__date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button type="button" onClick={() => setDate((d) => shiftDate(d, 1))} aria-label="наступний день">
          ▶
        </button>
        <span className="calendar-controls__weekday">{weekdayName(dateToWeekday(date))}</span>
      </div>

      <ChipPicker items={MODE_ITEMS} selectedValue={mode} onSelect={handleModeChange} />

      {mode === "teacher" &&
        (state.teachers.length === 0 ? (
          <p className="screen__empty">Немає вчителів у базі.</p>
        ) : (
          <TeacherPicker teachers={state.teachers} selectedId={selectedValue} onSelect={setSelectedValue} />
        ))}

      {mode === "class" &&
        (classes.length === 0 ? (
          <p className="screen__empty">Немає класів у базі.</p>
        ) : (
          <ChipPicker
            items={classes.map((c) => ({ value: c, label: c }))}
            selectedValue={selectedValue}
            onSelect={setSelectedValue}
          />
        ))}

      {mode === "room" &&
        (rooms.length === 0 ? (
          <p className="screen__empty">Немає авдиторій у базі.</p>
        ) : (
          <ChipPicker
            items={rooms.map((r) => ({ value: r, label: r }))}
            selectedValue={selectedValue}
            onSelect={setSelectedValue}
          />
        ))}

      {!selectedValue ? (
        <p className="screen__empty">Обери вчителя, клас або авдиторію.</p>
      ) : (
        <DayAgenda slots={filteredSlots} teachers={state.teachers} bells={state.bells} presence={presence} />
      )}
    </main>
  );
}
