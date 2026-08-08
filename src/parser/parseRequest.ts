import { addDays, dateToWeekday } from "../ranking/presence";
import type { Teacher } from "../types/teacher";

export interface ParsedRequest {
  teacherMatches: Teacher[];
  date?: string; // "YYYY-MM-DD"
  wholeDay: boolean;
  lesson?: number;
  time?: string; // "HH:MM"
}

/** Токени коротші за це ігноруються при пошуку імені — інакше прийменники
 *  типу "на"/"у"/"в" здатні випадково match-нути "Наталія". */
const MIN_NAME_TOKEN_LENGTH = 3;

function tokenize(text: string): string[] {
  return text.match(/\p{L}+/gu) ?? [];
}

/** Двобічний префікс: покриває і "Ткаченко"+відмінкове закінчення зверху
 *  (токен довший за словникову форму), і навпаки. Чергування "втрачених"
 *  голосних (Кравець → Кравця) свідомо не покривається — той самий рівень
 *  спрощення, що ТЗ приймає для звичайних закінчень. */
function wordMatches(dictionaryWord: string, token: string): boolean {
  return dictionaryWord.startsWith(token) || token.startsWith(dictionaryWord);
}

export function findTeacherMatches(text: string, teachers: Teacher[]): Teacher[] {
  const tokens = tokenize(text)
    .map((t) => t.toLocaleLowerCase("uk"))
    .filter((t) => t.length >= MIN_NAME_TOKEN_LENGTH);

  const matched = new Map<string, Teacher>();
  for (const teacher of teachers) {
    const nameWords = teacher.name.toLocaleLowerCase("uk").split(/\s+/);
    const isMatch = tokens.some((token) => nameWords.some((word) => wordMatches(word, token)));
    if (isMatch) matched.set(teacher.id, teacher);
  }
  return [...matched.values()];
}

export function findWholeDay(text: string): boolean {
  return /на\s+весь\s+день/iu.test(text);
}

export function findTime(text: string): string | undefined {
  const match = text.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (!match) return undefined;
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

export function findLessonNumber(text: string): number | undefined {
  const afterWord = text.match(/урок[а-щьюяіїєґ']*\s*№?\s*(\d{1,2})/iu);
  if (afterWord) return Number(afterWord[1]);

  const beforeWord = text.match(/(\d{1,2})\s*-?\s*(?:й|му|м)?\s*урок/iu);
  if (beforeWord) return Number(beforeWord[1]);

  return undefined;
}

const WEEKDAY_TOKENS: Record<string, number> = {
  "понеділок": 1,
  "вівторок": 2,
  "середа": 3,
  "середу": 3,
  "четвер": 4,
  "п'ятниця": 5,
  "п'ятницю": 5,
  "пятниця": 5,
  "пятницю": 5,
  "субота": 6,
  "суботу": 6,
  "неділя": 7,
  "неділю": 7,
};

export const MONTH_GENITIVE = [
  "січня",
  "лютого",
  "березня",
  "квітня",
  "травня",
  "червня",
  "липня",
  "серпня",
  "вересня",
  "жовтня",
  "листопада",
  "грудня",
];

/** Найближча дата (рахуючи сьогодні) з таким weekday, від referenceDate. */
function nearestDateForWeekday(referenceDate: string, weekday: number): string {
  const refWeekday = dateToWeekday(referenceDate);
  const delta = (weekday - refWeekday + 7) % 7;
  return addDays(referenceDate, delta);
}

/** Пріоритет: "сьогодні" > "завтра" > день тижня > "число місяць". Перший
 *  знайдений вид перемагає, якщо в тексті випадково є кілька. Порівняння
 *  йде по токенах (не `\b`-регекс) — JS `\b` не бачить кириличні літери як
 *  "word chars", тож межа слова навколо кириличного тексту не спрацьовує. */
export function findDate(text: string, referenceDate: string): string | undefined {
  const tokens = tokenize(text).map((t) => t.toLocaleLowerCase("uk"));

  if (tokens.includes("сьогодні")) return referenceDate;
  if (tokens.includes("завтра")) return addDays(referenceDate, 1);

  for (const token of tokens) {
    const weekday = WEEKDAY_TOKENS[token];
    if (weekday) return nearestDateForWeekday(referenceDate, weekday);
  }

  const monthPattern = new RegExp(`(\\d{1,2})\\s+(${MONTH_GENITIVE.join("|")})`, "iu");
  const monthMatch = text.match(monthPattern);
  if (monthMatch) {
    const day = Number(monthMatch[1]);
    const monthIndex = MONTH_GENITIVE.indexOf(monthMatch[2].toLocaleLowerCase("uk"));
    const year = Number(referenceDate.slice(0, 4));
    const month = String(monthIndex + 1).padStart(2, "0");
    return `${year}-${month}-${String(day).padStart(2, "0")}`;
  }

  return undefined;
}

export function parseMessage(text: string, teachers: Teacher[], referenceDate: string): ParsedRequest {
  return {
    teacherMatches: findTeacherMatches(text, teachers),
    date: findDate(text, referenceDate),
    wholeDay: findWholeDay(text),
    lesson: findLessonNumber(text),
    time: findTime(text),
  };
}
