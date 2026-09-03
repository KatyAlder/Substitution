import { dateToWeekday, weekdayName } from "../ranking/presence";
import type { Substitution } from "../types/substitution";
import type { Teacher } from "../types/teacher";

interface Props {
  substitutions: Substitution[];
  teachers: Teacher[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onUnshortlist: (substitutionId: string, teacherId: string) => void;
}

export function SlotPicker({ substitutions, teachers, selectedId, onSelect, onDelete, onUnshortlist }: Props) {
  return (
    <div className="slot-picker">
      {substitutions.map((sub) => {
        const absent = teachers.find((t) => t.id === sub.absentTeacherId);
        const weekday = dateToWeekday(sub.date);
        const isSelected = sub.id === selectedId;

        const shortlist = sub.shortlist ?? [];

        return (
          <div key={sub.id} className={`slot-picker__row${isSelected ? " slot-picker__row--active" : ""}`}>
            <button
              type="button"
              className="slot-picker__item"
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
            {shortlist.length > 0 && (
              <div className="slot-picker__shortlist">
                <span className="slot-picker__shortlist-label">на олівці</span>
                {shortlist.map((teacherId) => {
                  const t = teachers.find((x) => x.id === teacherId);
                  return (
                    <span key={teacherId} className="slot-picker__pencil">
                      {t?.name ?? teacherId}
                      <button
                        type="button"
                        className="slot-picker__pencil-remove"
                        title="Прибрати з олівця"
                        aria-label={`Прибрати ${t?.name ?? teacherId} з олівця`}
                        onClick={() => onUnshortlist(sub.id, teacherId)}
                      >
                        ✕
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
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
