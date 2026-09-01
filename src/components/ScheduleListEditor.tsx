import { splitClassLabel } from "../ranking/classes";
import { shortWeekdayName } from "../ranking/presence";
import type { ScheduleEntry } from "../types/schedule";

const WEEKDAYS = [1, 2, 3, 4, 5];

/** Чернетковий рядок редактора розкладу. "Спареність" зроблена явною
 *  (перемикач + список класів), а не роздільником у вільному тексті:
 *  при збереженні класи склеюються через "/" (канонічний роздільник за
 *  вибором Kate). Наслідок round-trip: числова мітка "5-6" вантажиться
 *  як пара і зберігається як "5/6" — classesOverlap бачить їх однаково,
 *  календар/ранжування не зачеплені. */
export interface ScheduleRow {
  weekday: number;
  lesson: number;
  paired: boolean;
  classes: string[];
  subject: string;
  room: string;
}

export function entryToRow(entry: Omit<ScheduleEntry, "teacherId">): ScheduleRow {
  const parts = splitClassLabel(entry.class);
  return {
    weekday: entry.weekday,
    lesson: entry.lesson,
    paired: parts.length > 1,
    classes: parts.length > 1 ? parts : [entry.class],
    subject: entry.subject,
    room: entry.room,
  };
}

export function rowToEntry(row: ScheduleRow): Omit<ScheduleEntry, "teacherId"> {
  const cls = row.paired
    ? row.classes.map((c) => c.trim()).filter(Boolean).join("/")
    : (row.classes[0] ?? "").trim();
  return {
    weekday: row.weekday,
    lesson: row.lesson,
    class: cls,
    subject: row.subject.trim(),
    room: row.room.trim(),
  };
}

export function emptyRow(): ScheduleRow {
  return { weekday: 1, lesson: 1, paired: false, classes: [""], subject: "", room: "" };
}

export function isScheduleRowValid(row: ScheduleRow): boolean {
  if (!WEEKDAYS.includes(row.weekday)) return false;
  if (!Number.isInteger(row.lesson) || row.lesson < 1) return false;
  const filled = row.classes.map((c) => c.trim()).filter(Boolean);
  if (filled.length < (row.paired ? 2 : 1)) return false;
  if (!row.subject.trim()) return false;
  return true;
}

interface Props {
  rows: ScheduleRow[];
  onChange: (rows: ScheduleRow[]) => void;
  subjectOptions: string[];
  roomOptions: string[];
}

export function ScheduleListEditor({ rows, onChange, subjectOptions, roomOptions }: Props) {
  function update(index: number, patch: Partial<ScheduleRow>) {
    onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function removeRow(index: number) {
    onChange(rows.filter((_, i) => i !== index));
  }

  function togglePaired(index: number, paired: boolean) {
    const r = rows[index];
    if (paired) {
      const classes = r.classes.length >= 2 ? r.classes : [r.classes[0] ?? "", ""];
      update(index, { paired: true, classes });
    } else {
      update(index, { paired: false, classes: [r.classes.find((c) => c.trim()) ?? r.classes[0] ?? ""] });
    }
  }

  function updateClass(index: number, ci: number, value: string) {
    update(index, { classes: rows[index].classes.map((c, i) => (i === ci ? value : c)) });
  }

  function addClass(index: number) {
    update(index, { classes: [...rows[index].classes, ""] });
  }

  function removeClass(index: number, ci: number) {
    update(index, { classes: rows[index].classes.filter((_, i) => i !== ci) });
  }

  return (
    <div className="schedule-editor">
      {rows.length === 0 && <p className="screen__empty">Немає уроків.</p>}

      {rows.map((row, i) => (
        <div
          className={`schedule-editor__row${isScheduleRowValid(row) ? "" : " schedule-editor__row--invalid"}`}
          key={i}
        >
          <div className="schedule-editor__line">
            <select
              value={row.weekday}
              onChange={(e) => update(i, { weekday: Number(e.target.value) })}
              aria-label="день тижня"
            >
              {WEEKDAYS.map((w) => (
                <option key={w} value={w}>
                  {shortWeekdayName(w)}
                </option>
              ))}
            </select>
            <input
              className="schedule-editor__lesson"
              type="number"
              min={1}
              step={1}
              value={row.lesson}
              onChange={(e) => update(i, { lesson: Math.trunc(Number(e.target.value)) })}
              aria-label="номер уроку"
            />
            <button
              type="button"
              className="schedule-editor__remove"
              onClick={() => removeRow(i)}
              aria-label="Видалити урок"
            >
              ✕
            </button>
          </div>

          <label className="schedule-editor__paired">
            <input
              type="checkbox"
              checked={row.paired}
              onChange={(e) => togglePaired(i, e.target.checked)}
            />
            спарений урок (кілька класів разом)
          </label>

          <div className="schedule-editor__classes">
            {row.paired ? (
              <>
                {row.classes.map((c, ci) => (
                  <span key={ci} className="schedule-editor__class-item">
                    <input
                      className="schedule-editor__class"
                      value={c}
                      onChange={(e) => updateClass(i, ci, e.target.value)}
                      placeholder="напр. 9-А"
                      aria-label={`клас ${ci + 1}`}
                    />
                    {row.classes.length > 2 && (
                      <button
                        type="button"
                        className="schedule-editor__remove"
                        onClick={() => removeClass(i, ci)}
                        aria-label="Прибрати клас"
                      >
                        ✕
                      </button>
                    )}
                  </span>
                ))}
                <button type="button" className="btn" onClick={() => addClass(i)}>
                  + клас
                </button>
              </>
            ) : (
              <input
                className="schedule-editor__class"
                value={row.classes[0] ?? ""}
                onChange={(e) => updateClass(i, 0, e.target.value)}
                placeholder="напр. 9-А"
                aria-label="клас"
              />
            )}
          </div>

          <div className="schedule-editor__line">
            <input
              value={row.subject}
              onChange={(e) => update(i, { subject: e.target.value })}
              placeholder="предмет"
              aria-label="предмет"
              list="schedule-subjects"
            />
            <input
              value={row.room}
              onChange={(e) => update(i, { room: e.target.value })}
              placeholder="авдиторія"
              aria-label="авдиторія"
              list="schedule-rooms"
            />
          </div>
        </div>
      ))}

      <datalist id="schedule-subjects">
        {subjectOptions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      <datalist id="schedule-rooms">
        {roomOptions.map((r) => (
          <option key={r} value={r} />
        ))}
      </datalist>
    </div>
  );
}
