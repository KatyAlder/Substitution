import type { DayLesson } from "../parser/resolveRequest";
import type { Substitution } from "../types/substitution";

export interface LessonChecklistItem {
  lesson: DayLesson;
  checked: boolean;
  conflict?: Substitution;
}

interface Props {
  items: LessonChecklistItem[];
  onToggle: (start: string) => void;
}

export function LessonChecklist({ items, onToggle }: Props) {
  return (
    <div className="lesson-checklist">
      {items.map(({ lesson, checked, conflict }) => (
        <label
          key={lesson.entry.lesson}
          className={`lesson-checklist__item${conflict ? " lesson-checklist__item--conflict" : ""}`}
        >
          <input
            type="checkbox"
            checked={checked && !conflict}
            disabled={!!conflict}
            onChange={() => onToggle(lesson.entry.start)}
          />
          <span>
            урок {lesson.entry.lesson}
            {` (${lesson.entry.start}–${lesson.entry.end})`} · {lesson.entry.class} клас ·{" "}
            {lesson.entry.subject}
            {conflict && <span className="lesson-checklist__warning"> — вже є заміна (статус: {conflict.status})</span>}
          </span>
        </label>
      ))}
    </div>
  );
}
