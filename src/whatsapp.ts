import { MONTH_GENITIVE } from "./parser/parseRequest";
import { slotBell } from "./ranking/levels";
import { dateToWeekday, toMinutes, weekdayName } from "./ranking/presence";
import type { Bell } from "./types/schedule";
import type { Substitution } from "./types/substitution";
import type { Teacher } from "./types/teacher";

export function buildSubstitutionMessage(substitution: Substitution, weekday: number, bell: Bell | undefined): string {
  const lesson = bell ? `${bell.start}–${bell.end}` : `${substitution.lesson}`;
  return (
    `Привіт! Потрібна заміна: ${weekdayName(weekday)}, ${substitution.date}, ` +
    `урок ${lesson}, ${substitution.class} клас. ` +
    `Підкажи, будь ласка, чи зможеш ти її взяти?`
  );
}

/** Форми днів тижня після "Заміни на …" (знахідний відмінок). Індекс 0 = понеділок. */
const WEEKDAY_ACCUSATIVE = [
  "понеділок",
  "вівторок",
  "середу",
  "четвер",
  "п'ятницю",
  "суботу",
  "неділю",
];

/** "Заміни на середу, 2 вересня" — спільний заголовок для розсилки й "на весь день". */
function substitutionsHeader(weekday: number, date: string): string {
  const [, monthStr, dayStr] = date.split("-");
  const monthName = MONTH_GENITIVE[Number(monthStr) - 1];
  const dayName = WEEKDAY_ACCUSATIVE[weekday - 1] ?? "?";
  return `Заміни на ${dayName}, ${Number(dayStr)} ${monthName}`;
}

/** Розсилка "списком" для завчасних замін (розділ 1, 5, 6 ТЗ) — одне повідомлення
 *  на всі поточні завчасні заміни, що ще не в чаті. Заміни групуються за датою
 *  (зазвичай одна, але завчасні можуть бути на різні дні); рядки в межах дати —
 *  за номером уроку. */
export function buildBroadcastMessage(substitutions: Substitution[], bells: Bell[]): string {
  const byDate = new Map<string, Substitution[]>();
  for (const s of substitutions) {
    const list = byDate.get(s.date) ?? [];
    list.push(s);
    byDate.set(s.date, list);
  }

  const blocks = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, subs]) => {
      const header = substitutionsHeader(dateToWeekday(date), date);
      // Сортуємо за реальним часом початку, а не за номером уроку: у різних
      // ланках однакові номери йдуть у різний час (урок 2: 10:50 у початковій,
      // 11:05 у старшій), тож номер не задає порядку в спільному списку.
      const lines = [...subs]
        .map((s) => ({ sub: s, bell: slotBell(bells, s.class, s.lesson) }))
        .sort((a, b) =>
          a.bell && b.bell ? toMinutes(a.bell.start) - toMinutes(b.bell.start) : a.sub.lesson - b.sub.lesson
        )
        .map(({ sub, bell }) => {
          const time = bell ? `${bell.start}-${bell.end}` : `урок ${sub.lesson}`;
          return `${sub.class} клас - ${time}`;
        });
      return [header, ...lines].join("\n");
    });

  return blocks.join("\n\n");
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
  const header = substitutionsHeader(weekday, date);
  const lines = [...entries]
    .sort((a, b) => toMinutes(a.start) - toMinutes(b.start) || a.lesson - b.lesson)
    .map((e) => `${e.class} клас — ${e.start}–${e.end}`);
  return [header, ...lines].join("\n");
}

/** `undefined`, якщо у вчителя немає номера — wa.me без нього не працює (розділ 3 ТЗ). */
export function buildWhatsAppUrl(teacher: Teacher, message: string): string | undefined {
  const digits = teacher.phone?.replace(/\D/g, "");
  if (!digits) return undefined;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
