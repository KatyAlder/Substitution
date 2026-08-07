import { dateToWeekday, weekdayName } from "./ranking/presence";
import type { Bell } from "./types/schedule";
import type { Substitution } from "./types/substitution";
import type { Teacher } from "./types/teacher";

export function buildSubstitutionMessage(substitution: Substitution, weekday: number, bell: Bell | undefined): string {
  const time = bell ? ` (${bell.start}–${bell.end})` : "";
  return (
    `Привіт! Потрібна заміна: ${weekdayName(weekday)}, ${substitution.date}, ` +
    `урок ${substitution.lesson}${time}, ${substitution.class} клас. ` +
    `Підкажи, будь ласка, чи зможеш ти її взяти?`
  );
}

/** Розсилка "списком" для завчасних замін (розділ 1, 5, 6 ТЗ) — одне повідомлення
 *  на всі поточні завчасні заміни, що ще не в чаті. */
export function buildBroadcastMessage(substitutions: Substitution[], bells: Bell[]): string {
  const lines = substitutions.map((s) => {
    const bell = bells.find((b) => b.lesson === s.lesson);
    const time = bell ? ` (${bell.start}–${bell.end})` : "";
    return `- ${weekdayName(dateToWeekday(s.date))}, ${s.date}, ${s.class} клас, урок ${s.lesson}${time}`;
  });
  return `Потрібен доброволець:\n${lines.join("\n")}`;
}

/** `undefined`, якщо у вчителя немає номера — wa.me без нього не працює (розділ 3 ТЗ). */
export function buildWhatsAppUrl(teacher: Teacher, message: string): string | undefined {
  const digits = teacher.phone?.replace(/\D/g, "");
  if (!digits) return undefined;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
