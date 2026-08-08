import { MONTH_GENITIVE } from "./parser/parseRequest";
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

/** Прев'ю тексту для сценарію "на весь день" (розділ 6 ТЗ) — дата в
 *  заголовку в родовому відмінку ("2 вересня"), формат часу — той самий
 *  zero-padded "09:00", що й у решті застосунку (буквальний приклад у ТЗ
 *  писав "9:00" без нуля — суто орфографія прикладу, не вимога). */
export function buildWholeDayMessage(
  date: string,
  weekday: number,
  entries: { class: string; lesson: number; start: string; end: string }[]
): string {
  const [, monthStr, dayStr] = date.split("-");
  const monthName = MONTH_GENITIVE[Number(monthStr) - 1];
  const header = `Заміни на ${weekdayName(weekday)}, ${Number(dayStr)} ${monthName}`;
  const lines = [...entries]
    .sort((a, b) => a.lesson - b.lesson)
    .map((e) => `${e.class} клас — ${e.start}–${e.end}`);
  return [header, ...lines].join("\n");
}

/** `undefined`, якщо у вчителя немає номера — wa.me без нього не працює (розділ 3 ТЗ). */
export function buildWhatsAppUrl(teacher: Teacher, message: string): string | undefined {
  const digits = teacher.phone?.replace(/\D/g, "");
  if (!digits) return undefined;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
