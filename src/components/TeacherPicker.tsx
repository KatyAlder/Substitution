import type { Teacher } from "../types/teacher";

interface Props {
  teachers: Teacher[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function TeacherPicker({ teachers, selectedId, onSelect }: Props) {
  const sorted = [...teachers].sort((a, b) => a.name.localeCompare(b.name, "uk"));

  return (
    <div className="teacher-picker">
      {sorted.map((teacher) => (
        <button
          key={teacher.id}
          type="button"
          className={`teacher-picker__item${teacher.id === selectedId ? " teacher-picker__item--active" : ""}`}
          onClick={() => onSelect(teacher.id)}
        >
          {teacher.name}
        </button>
      ))}
    </div>
  );
}
