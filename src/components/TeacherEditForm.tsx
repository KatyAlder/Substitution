import { useMemo, useState } from "react";
import { TimeBlockListEditor, isTimeBlockValid } from "./TimeBlockListEditor";
import type { Teacher, TimeBlock } from "../types/teacher";

interface Props {
  teacher: Teacher;
  onSave: (patch: Omit<Partial<Teacher>, "id">) => void;
  onCancel: () => void;
}

export function TeacherEditForm({ teacher, onSave, onCancel }: Props) {
  const [name, setName] = useState(teacher.name);
  const [phone, setPhone] = useState(teacher.phone ?? "");
  const [curatorOf, setCuratorOf] = useState(teacher.curatorOf ?? "");
  const [isHourly, setIsHourly] = useState(!!teacher.isHourly);
  const [alwaysPresent, setAlwaysPresent] = useState(!!teacher.alwaysPresent);
  const [subjectsText, setSubjectsText] = useState(teacher.subjects.join(", "));
  const [presence, setPresence] = useState<TimeBlock[]>(teacher.presence);
  const [goldenHours, setGoldenHours] = useState<TimeBlock[]>(teacher.goldenHours);

  const isValid = useMemo(() => {
    if (!name.trim()) return false;
    if (!alwaysPresent && !presence.every(isTimeBlockValid)) return false;
    if (!goldenHours.every(isTimeBlockValid)) return false;
    return true;
  }, [name, alwaysPresent, presence, goldenHours]);

  function handleSave() {
    if (!isValid) return;
    onSave({
      name: name.trim(),
      phone: phone.trim() || undefined,
      curatorOf: curatorOf.trim() || undefined,
      isHourly,
      alwaysPresent,
      subjects: subjectsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      presence,
      goldenHours,
    });
  }

  return (
    <section className="parse-panel">
      <div className="parse-panel__field">
        <div className="parse-panel__label">Ім'я</div>
        <input className="parse-panel__input" value={name} onChange={(e) => setName(e.target.value)} />
        {!name.trim() && <p className="parse-panel__warning">Ім'я обов'язкове.</p>}
      </div>

      <div className="parse-panel__field">
        <div className="parse-panel__label">Телефон</div>
        <input className="parse-panel__input" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>

      <div className="parse-panel__field">
        <div className="parse-panel__label">Класне керівництво</div>
        <input
          className="parse-panel__input"
          value={curatorOf}
          onChange={(e) => setCuratorOf(e.target.value)}
          placeholder="напр. 7-А"
        />
      </div>

      <label className="parse-panel__field parse-panel__checkbox">
        <input type="checkbox" checked={isHourly} onChange={(e) => setIsHourly(e.target.checked)} />
        Погодинник
      </label>

      <label className="parse-panel__field parse-panel__checkbox">
        <input type="checkbox" checked={alwaysPresent} onChange={(e) => setAlwaysPresent(e.target.checked)} />
        Присутній увесь час
      </label>

      <div className="parse-panel__field">
        <div className="parse-panel__label">Предмети (через кому)</div>
        <input className="parse-panel__input" value={subjectsText} onChange={(e) => setSubjectsText(e.target.value)} />
      </div>

      {!alwaysPresent && (
        <div className="parse-panel__field">
          <div className="parse-panel__label">Присутність</div>
          <TimeBlockListEditor blocks={presence} onChange={setPresence} />
        </div>
      )}

      <div className="parse-panel__field">
        <div className="parse-panel__label">Золоті години</div>
        <TimeBlockListEditor blocks={goldenHours} onChange={setGoldenHours} />
      </div>

      <div className="parse-panel__actions">
        <button type="button" className="btn btn--agree" disabled={!isValid} onClick={handleSave}>
          Зберегти
        </button>
        <button type="button" className="btn" onClick={onCancel}>
          Скасувати
        </button>
      </div>
    </section>
  );
}
