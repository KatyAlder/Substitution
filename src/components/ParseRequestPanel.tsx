import { useMemo, useState } from "react";
import { ChipPicker } from "./ChipPicker";
import { LessonChecklist } from "./LessonChecklist";
import { TeacherPicker } from "./TeacherPicker";
import type { NewSubstitutionInput } from "../data/actions";
import { parseMessage } from "../parser/parseRequest";
import { findConflict, resolveBySlot, suggestedMode, teacherDayLessons } from "../parser/resolveRequest";
import { dateToWeekday, todayIso, weekdayName } from "../ranking/presence";
import type { AppState } from "../types/state";
import type { SubstitutionMode } from "../types/substitution";
import { buildWholeDayMessage } from "../whatsapp";

interface Props {
  state: AppState;
  onCreate: (inputs: NewSubstitutionInput[]) => void;
}

const MODE_ITEMS: { value: SubstitutionMode; label: string }[] = [
  { value: "urgent", label: "термінова" },
  { value: "planned", label: "завчасна" },
];

export function ParseRequestPanel({ state, onCreate }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState("");
  const [manualTeacherId, setManualTeacherId] = useState<string | null>(null);
  const [manualDate, setManualDate] = useState<string | null>(null);
  const [manualWholeDay, setManualWholeDay] = useState<boolean | null>(null);
  const [manualMode, setManualMode] = useState<SubstitutionMode | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null);
  const [uncheckedLessons, setUncheckedLessons] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState(false);

  const today = todayIso();
  const parsed = useMemo(() => parseMessage(text, state.teachers, today), [text, state.teachers, today]);

  const teacherId = manualTeacherId ?? (parsed.teacherMatches.length === 1 ? parsed.teacherMatches[0].id : null);
  const teacher = teacherId ? (state.teachers.find((t) => t.id === teacherId) ?? null) : null;
  const showTeacherPicker = !teacher;
  const teacherPickerList = parsed.teacherMatches.length > 0 ? parsed.teacherMatches : state.teachers;

  const date = manualDate ?? parsed.date ?? today;
  const wholeDay = manualWholeDay ?? parsed.wholeDay;
  const mode = manualMode ?? suggestedMode(date, today);
  const weekday = dateToWeekday(date);

  const dayLessons = teacher ? teacherDayLessons(state.schedule, state.bells, teacher.id, weekday) : [];

  const resolution = teacher ? resolveBySlot(state.bells, dayLessons, { lesson: parsed.lesson, time: parsed.time }) : {};
  const effectiveLesson = selectedLesson ?? resolution.matched?.entry.lesson ?? null;
  const selectedDayLesson = dayLessons.find((l) => l.entry.lesson === effectiveLesson) ?? null;
  const singleConflict = selectedDayLesson
    ? findConflict(state.substitutions, date, selectedDayLesson.entry.lesson, selectedDayLesson.entry.class)
    : undefined;

  const checklistItems = dayLessons.map((lesson) => ({
    lesson,
    checked: !uncheckedLessons.has(lesson.entry.lesson),
    conflict: findConflict(state.substitutions, date, lesson.entry.lesson, lesson.entry.class),
  }));
  const checklistSelected = checklistItems.filter((item) => item.checked && !item.conflict);

  const wholeDayMessage = buildWholeDayMessage(
    date,
    weekday,
    checklistSelected.map((item) => ({
      class: item.lesson.entry.class,
      lesson: item.lesson.entry.lesson,
      start: item.lesson.bell?.start ?? "?",
      end: item.lesson.bell?.end ?? "?",
    }))
  );

  function resetPanel() {
    setText("");
    setManualTeacherId(null);
    setManualDate(null);
    setManualWholeDay(null);
    setManualMode(null);
    setSelectedLesson(null);
    setUncheckedLessons(new Set());
    setExpanded(false);
  }

  function handleToggleLesson(lessonNumber: number) {
    setUncheckedLessons((prev) => {
      const next = new Set(prev);
      if (next.has(lessonNumber)) next.delete(lessonNumber);
      else next.add(lessonNumber);
      return next;
    });
  }

  function handleCreateSingle() {
    if (!teacher || !selectedDayLesson || singleConflict) return;
    onCreate([
      {
        date,
        lesson: selectedDayLesson.entry.lesson,
        class: selectedDayLesson.entry.class,
        absentTeacherId: teacher.id,
        mode,
      },
    ]);
    resetPanel();
  }

  function handleCreateWholeDay() {
    if (!teacher || checklistSelected.length === 0) return;
    onCreate(
      checklistSelected.map((item) => ({
        date,
        lesson: item.lesson.entry.lesson,
        class: item.lesson.entry.class,
        absentTeacherId: teacher.id,
        mode,
      }))
    );
    resetPanel();
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(wholeDayMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!expanded) {
    return (
      <button type="button" className="btn parse-panel__toggle" onClick={() => setExpanded(true)}>
        + Додати заміну з повідомлення
      </button>
    );
  }

  return (
    <section className="parse-panel">
      <div className="parse-panel__field">
        <textarea
          className="parse-panel__textarea"
          placeholder="Вставте повідомлення, напр. «Заміни Олені Павлюк на завтра на 15:00»"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
        />
      </div>

      <div className="parse-panel__field">
        <div className="parse-panel__label">Вчитель</div>
        {teacher && !showTeacherPicker ? (
          <button type="button" className="btn" onClick={() => setManualTeacherId(null)}>
            {teacher.name} (змінити)
          </button>
        ) : (
          <TeacherPicker teachers={teacherPickerList} selectedId={teacherId} onSelect={setManualTeacherId} />
        )}
      </div>

      <div className="parse-panel__field">
        <div className="parse-panel__label">Дата</div>
        <input type="date" value={date} onChange={(e) => setManualDate(e.target.value)} />
        <span className="parse-panel__hint">{weekdayName(weekday)}</span>
      </div>

      <label className="parse-panel__field parse-panel__checkbox">
        <input
          type="checkbox"
          checked={wholeDay}
          onChange={(e) => setManualWholeDay(e.target.checked)}
        />
        На весь день
      </label>

      {teacher && !wholeDay && (
        <div className="parse-panel__field">
          <div className="parse-panel__label">Урок</div>
          {resolution.nearestBell && !effectiveLesson && (
            <div className="parse-panel__hint">
              час поза розкладом — найближчий дзвінок: {resolution.nearestBell.start}–{resolution.nearestBell.end}
            </div>
          )}
          {dayLessons.length === 0 ? (
            <p className="screen__empty">Цього дня в учителя немає уроків.</p>
          ) : (
            <ChipPicker
              items={dayLessons.map((l) => ({
                value: String(l.entry.lesson),
                label: `урок ${l.entry.lesson}${l.bell ? ` (${l.bell.start}–${l.bell.end})` : ""} · ${l.entry.class} клас · ${l.entry.subject}`,
              }))}
              selectedValue={effectiveLesson !== null ? String(effectiveLesson) : null}
              onSelect={(v) => setSelectedLesson(Number(v))}
            />
          )}
          {singleConflict && (
            <p className="parse-panel__warning">У цього слоту вже є заміна (статус: {singleConflict.status}).</p>
          )}
        </div>
      )}

      {teacher && wholeDay && (
        <div className="parse-panel__field">
          <div className="parse-panel__label">Уроки цього дня</div>
          {dayLessons.length === 0 ? (
            <p className="screen__empty">Цього дня в учителя немає уроків.</p>
          ) : (
            <>
              <LessonChecklist items={checklistItems} onToggle={handleToggleLesson} />
              <pre className="parse-panel__preview">{wholeDayMessage}</pre>
              <button type="button" className="btn" onClick={handleCopy}>
                {copied ? "Скопійовано" : "Копіювати текст"}
              </button>
            </>
          )}
        </div>
      )}

      <div className="parse-panel__field">
        <div className="parse-panel__label">Режим</div>
        <ChipPicker items={MODE_ITEMS} selectedValue={mode} onSelect={(v) => setManualMode(v as SubstitutionMode)} />
      </div>

      <div className="parse-panel__actions">
        {wholeDay ? (
          <button type="button" className="btn btn--agree" disabled={checklistSelected.length === 0} onClick={handleCreateWholeDay}>
            Створити {checklistSelected.length} замін
          </button>
        ) : (
          <button
            type="button"
            className="btn btn--agree"
            disabled={!teacher || !selectedDayLesson || !!singleConflict}
            onClick={handleCreateSingle}
          >
            Створити заміну
          </button>
        )}
        <button type="button" className="btn" onClick={resetPanel}>
          Скасувати
        </button>
      </div>
    </section>
  );
}
