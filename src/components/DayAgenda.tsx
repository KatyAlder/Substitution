import type { EffectiveSlot } from "../calendar/effectiveDay";
import { slotBell } from "../ranking/levels";
import { toMinutes } from "../ranking/presence";
import type { Bell } from "../types/schedule";
import type { SubstitutionStatus } from "../types/substitution";
import type { Teacher, TimeBlock } from "../types/teacher";

const PENDING_LABELS: Record<Exclude<SubstitutionStatus, "closed">, string> = {
  open: "шукають заміну",
  "in-chat": "у чаті",
  "dead-end": "тупик",
};

interface PresenceInfo {
  alwaysPresent?: boolean;
  blocks: TimeBlock[];
}

interface Props {
  slots: EffectiveSlot[];
  teachers: Teacher[];
  bells: Bell[];
  presence?: PresenceInfo;
}

export function DayAgenda({ slots, teachers, bells, presence }: Props) {
  // Порядок — за реальним часом: у дні, де є уроки різних ланок, номер
  // уроку не задає послідовності (урок 3 початкової починається об 11:45,
  // урок 3 старшої — о 12:00).
  const sorted = [...slots]
    .map((slot) => ({ slot, bell: slotBell(bells, slot.class, slot.lesson) }))
    .sort((a, b) =>
      a.bell && b.bell ? toMinutes(a.bell.start) - toMinutes(b.bell.start) : a.slot.lesson - b.slot.lesson
    );
  const teacherName = (id: string) => teachers.find((t) => t.id === id)?.name ?? id;

  return (
    <div className="day-agenda">
      {presence && (
        <div className="day-agenda__presence">
          Присутність:{" "}
          {presence.alwaysPresent
            ? "увесь день"
            : presence.blocks.length > 0
              ? presence.blocks.map((b) => `${b.from}–${b.to}`).join(", ")
              : "не позначено"}
        </div>
      )}

      {sorted.length === 0 ? (
        <p className="screen__empty">Уроків цього дня немає.</p>
      ) : (
        sorted.map(({ slot, bell }, i) => {
          return (
            <div
              key={`${slot.lesson}-${slot.class}-${i}`}
              className={`day-agenda__slot${slot.isSubstitution ? " day-agenda__slot--substitution" : ""}`}
            >
              <div className="day-agenda__slot-main">
                урок {slot.lesson}{bell ? ` (${bell.start}–${bell.end})` : ""} · {slot.class} клас · {slot.subject} ·{" "}
                {slot.room}
              </div>
              <div className="day-agenda__slot-teacher">
                {teacherName(slot.teacherId)}
                {slot.isSubstitution && slot.substituteFor && (
                  <span className="day-agenda__badge">заміна за {teacherName(slot.substituteFor)}</span>
                )}
                {slot.pendingStatus && (
                  <span className="day-agenda__badge day-agenda__badge--pending">
                    {PENDING_LABELS[slot.pendingStatus as Exclude<SubstitutionStatus, "closed">]}
                  </span>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
