import { dateToWeekday, weekdayName } from "../ranking/presence";
import type { Bell } from "../types/schedule";
import type { Substitution } from "../types/substitution";
import type { Teacher } from "../types/teacher";

interface Props {
  substitutions: Substitution[];
  teachers: Teacher[];
  bells: Bell[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function SlotPicker({ substitutions, teachers, bells, selectedId, onSelect }: Props) {
  return (
    <div className="slot-picker">
      {substitutions.map((sub) => {
        const absent = teachers.find((t) => t.id === sub.absentTeacherId);
        const bell = bells.find((b) => b.lesson === sub.lesson);
        const weekday = dateToWeekday(sub.date);
        const isSelected = sub.id === selectedId;

        return (
          <button
            key={sub.id}
            type="button"
            className={`slot-picker__item${isSelected ? " slot-picker__item--active" : ""}`}
            onClick={() => onSelect(sub.id)}
          >
            <span className={`slot-picker__mode slot-picker__mode--${sub.mode}`}>
              {sub.mode === "urgent" ? "термінова" : "завчасна"}
            </span>
            <span className="slot-picker__main">
              {weekdayName(weekday)}, {sub.date} · {bell ? `${bell.start}–${bell.end}` : `урок ${sub.lesson}`} ·{" "}
              {sub.class} клас
            </span>
            <span className="slot-picker__sub">відсутній: {absent?.name ?? sub.absentTeacherId}</span>
          </button>
        );
      })}
    </div>
  );
}
