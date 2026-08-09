import { useMemo, useState } from "react";
import { ProfileCard } from "../components/ProfileCard";
import { TeacherEditForm } from "../components/TeacherEditForm";
import { TeacherPicker } from "../components/TeacherPicker";
import { deleteTeacher, updateTeacher } from "../data/actions";
import { useAppState } from "../data/AppStateContext";
import { classLoad, currentMonth, monthLabel, monthlyStats } from "../profile/stats";
import type { Teacher } from "../types/teacher";

function firstIdByName(teachers: Teacher[]): string | null {
  return [...teachers].sort((a, b) => a.name.localeCompare(b.name, "uk"))[0]?.id ?? null;
}

export function ProfileScreen() {
  const [state, setState] = useAppState();
  const [selectedId, setSelectedId] = useState<string | null>(() => firstIdByName(state.teachers));
  const [editing, setEditing] = useState(false);

  const teacher = state.teachers.find((t) => t.id === selectedId) ?? null;
  const month = useMemo(() => currentMonth(), []);

  const load = useMemo(() => (teacher ? classLoad(state.schedule, teacher.id) : []), [state.schedule, teacher]);
  const monthStats = useMemo(
    () => (teacher ? monthlyStats(state, teacher.id, month) : { substitutions: 0, refused: 0, silent: 0 }),
    [state, teacher, month]
  );

  function handleSelectTeacher(id: string) {
    setSelectedId(id);
    setEditing(false);
  }

  function handleSaveTeacher(patch: Omit<Partial<Teacher>, "id">) {
    if (!teacher) return;
    setState((prev) => updateTeacher(prev, teacher.id, patch));
    setEditing(false);
  }

  function handleDeleteTeacher() {
    if (!teacher) return;
    const confirmed = window.confirm(
      `Видалити ${teacher.name}? Разом з учителем зникнуть його розклад і всі заміни/спроби, де він фігурує.`
    );
    if (!confirmed) return;
    setState((prev) => deleteTeacher(prev, teacher.id));
    setSelectedId(firstIdByName(state.teachers.filter((t) => t.id !== teacher.id)));
    setEditing(false);
  }

  return (
    <main className="screen">
      <h1 className="screen__title">Профілі</h1>

      {state.teachers.length === 0 ? (
        <p className="screen__empty">Немає вчителів у базі.</p>
      ) : (
        <TeacherPicker teachers={state.teachers} selectedId={selectedId} onSelect={handleSelectTeacher} />
      )}

      {teacher && !editing && (
        <>
          <div className="profile-card__toolbar">
            <button type="button" className="btn" onClick={() => setEditing(true)}>
              Редагувати
            </button>
            <button type="button" className="btn btn--refuse" onClick={handleDeleteTeacher}>
              Видалити вчителя
            </button>
          </div>
          <ProfileCard teacher={teacher} load={load} monthStats={monthStats} monthLabel={monthLabel(month)} />
        </>
      )}

      {teacher && editing && (
        <TeacherEditForm
          key={teacher.id}
          teacher={teacher}
          onSave={handleSaveTeacher}
          onCancel={() => setEditing(false)}
        />
      )}
    </main>
  );
}
