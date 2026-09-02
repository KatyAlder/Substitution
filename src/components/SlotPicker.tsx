import { dateToWeekday, weekdayName } from "../ranking/presence";
import type { Substitution } from "../types/substitution";
import type { Teacher } from "../types/teacher";

interface Props {
  substitutions: Substitution[];
  teachers: Teacher[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function SlotPicker({ substitutions, teachers, selectedId, onSelect, onDelete }: Props) {
  return (
    <div className="slot-picker">
      {substitutions.map((sub) => {
        const absent = teachers.find((t) => t.id === sub.absentTeacherId);
        const weekday = dateToWeekday(sub.date);
        const isSelected = sub.id === selectedId;

        return (
          <div key={sub.id} className="slot-picker__row">
            <button
              type="button"
              className={`slot-picker__item${isSelected ? " slot-picker__item--active" : ""}`}
              onClick={() => onSelect(sub.id)}
            >
              <span
                className={`slot-picker__mode slot-picker__mode--${sub.status === "in-chat" ? "in-chat" : sub.mode}`}
              >
                {sub.status === "in-chat" ? "в чаті" : sub.mode === "urgent" ? "термінова" : "завчасна"}
              </span>
              <span className="slot-picker__main">
                {weekdayName(weekday)}, {sub.date} · {sub.start}–{sub.end} ·{" "}
                {sub.class} клас
              </span>
              <span className="slot-picker__sub">відсутній: {absent?.name ?? sub.absentTeacherId}</span>
            </button>
            <button
              type="button"
              className="slot-picker__delete"
              title="Видалити заміну"
              aria-label="Видалити заміну"
              onClick={() => onDelete(sub.id)}
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
