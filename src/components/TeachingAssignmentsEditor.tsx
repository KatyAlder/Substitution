import type { TeachingAssignment } from "../types/teacher";

interface Props {
  assignments: TeachingAssignment[];
  onChange: (assignments: TeachingAssignment[]) => void;
  subjectOptions: string[];
}

/** Рядок валідний, коли є предмет і хоч один непорожній клас. */
export function isAssignmentValid(a: TeachingAssignment): boolean {
  return !!a.subject.trim() && a.classes.some((c) => c.trim() !== "");
}

/** Прибирає порожні класи й порожні рядки — канонічна форма для збереження. */
export function cleanAssignments(assignments: TeachingAssignment[]): TeachingAssignment[] {
  return assignments
    .map((a) => ({ subject: a.subject.trim(), classes: a.classes.map((c) => c.trim()).filter(Boolean) }))
    .filter((a) => a.subject && a.classes.length > 0);
}

function emptyAssignment(): TeachingAssignment {
  return { subject: "", classes: [""] };
}

export function TeachingAssignmentsEditor({ assignments, onChange, subjectOptions }: Props) {
  function update(index: number, patch: Partial<TeachingAssignment>) {
    onChange(assignments.map((a, i) => (i === index ? { ...a, ...patch } : a)));
  }

  function updateClass(index: number, ci: number, value: string) {
    update(index, { classes: assignments[index].classes.map((c, i) => (i === ci ? value : c)) });
  }

  return (
    <div className="schedule-editor">
      {assignments.length === 0 && <p className="screen__empty">Не позначено.</p>}

      {assignments.map((a, i) => (
        <div
          className={`schedule-editor__row${isAssignmentValid(a) ? "" : " schedule-editor__row--invalid"}`}
          key={i}
        >
          <div className="schedule-editor__line">
            <input
              value={a.subject}
              onChange={(e) => update(i, { subject: e.target.value })}
              placeholder="предмет"
              aria-label="предмет"
              list="teaching-subjects"
            />
            <button
              type="button"
              className="schedule-editor__remove"
              onClick={() => onChange(assignments.filter((_, idx) => idx !== i))}
              aria-label="Прибрати предмет"
            >
              ✕
            </button>
          </div>

          <div className="schedule-editor__classes">
            {a.classes.map((c, ci) => (
              <span key={ci} className="schedule-editor__class-item">
                <input
                  className="schedule-editor__class"
                  value={c}
                  onChange={(e) => updateClass(i, ci, e.target.value)}
                  placeholder="напр. 9-А"
                  aria-label={`клас ${ci + 1}`}
                />
                {a.classes.length > 1 && (
                  <button
                    type="button"
                    className="schedule-editor__remove"
                    onClick={() => update(i, { classes: a.classes.filter((_, idx) => idx !== ci) })}
                    aria-label="Прибрати клас"
                  >
                    ✕
                  </button>
                )}
              </span>
            ))}
            <button type="button" className="btn" onClick={() => update(i, { classes: [...a.classes, ""] })}>
              + клас
            </button>
          </div>
        </div>
      ))}

      <button type="button" className="btn" onClick={() => onChange([...assignments, emptyAssignment()])}>
        + предмет
      </button>

      <datalist id="teaching-subjects">
        {subjectOptions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </div>
  );
}
