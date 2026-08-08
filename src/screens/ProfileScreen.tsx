import { useMemo, useState } from "react";
import { ProfileCard } from "../components/ProfileCard";
import { TeacherPicker } from "../components/TeacherPicker";
import { useAppState } from "../data/AppStateContext";
import { classLoad, currentMonth, monthLabel, monthlyStats } from "../profile/stats";

export function ProfileScreen() {
  const [state] = useAppState();
  const sortedFirst = [...state.teachers].sort((a, b) => a.name.localeCompare(b.name, "uk"))[0];
  const [selectedId, setSelectedId] = useState<string | null>(sortedFirst?.id ?? null);

  const teacher = state.teachers.find((t) => t.id === selectedId) ?? null;
  const month = useMemo(() => currentMonth(), []);

  const load = useMemo(() => (teacher ? classLoad(state.schedule, teacher.id) : []), [state.schedule, teacher]);
  const monthStats = useMemo(
    () => (teacher ? monthlyStats(state, teacher.id, month) : { substitutions: 0, refused: 0, silent: 0 }),
    [state, teacher, month]
  );

  return (
    <main className="screen">
      <h1 className="screen__title">Профілі</h1>

      {state.teachers.length === 0 ? (
        <p className="screen__empty">Немає вчителів у базі.</p>
      ) : (
        <TeacherPicker teachers={state.teachers} selectedId={selectedId} onSelect={setSelectedId} />
      )}

      {teacher && (
        <ProfileCard teacher={teacher} load={load} monthStats={monthStats} monthLabel={monthLabel(month)} />
      )}
    </main>
  );
}
