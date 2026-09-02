import { SCHOOL_LEVELS } from "../config/settings";
import type { Bell } from "../types/schedule";
import { splitClassLabel } from "./classes";
import { toMinutes } from "./presence";

/** Час уроку зберігається явно в `ScheduleEntry`/`Substitution`, і саме за
 *  ним рахується будь-яка зайнятість (`intervalsOverlap`). Номер уроку —
 *  лише підпис: у кожної ланки школи свій розклад дзвінків, тож однакові
 *  номери означають різний час, а різні — можуть перетинатися.
 *
 *  Переведення "номер уроку → час" (`slotInterval`) лишилось тільки для двох
 *  меж, де номер іще трапляється: розбір файлу імпорту й одноразова міграція
 *  старих баз. Дзвінок без `level` чинний для всіх ланок. */

export interface TimeInterval {
  start: string; // "HH:MM"
  end: string; // "HH:MM"
}

const ALL_LEVEL_IDS = SCHOOL_LEVELS.map((l) => l.id);

/** Провідне число мітки класу: "9-А" → 9, "11" → 11, "Дошкільна" → undefined. */
function classNumber(part: string): number | undefined {
  const match = part.trim().match(/^(\d+)/);
  return match ? Number(match[1]) : undefined;
}

/** Ланки, до яких належить мітка класу. Спарений урок через ланки ("4-5")
 *  дає обидві. Мітка без числа (нерозпізнана) дає ВСІ ланки — навмисно
 *  найширший варіант: краще зайвий раз порахувати кандидата зайнятим,
 *  ніж запропонувати того, хто фізично на уроці. */
export function levelIdsForClass(className: string): string[] {
  const ids = new Set<string>();
  for (const part of splitClassLabel(className)) {
    const n = classNumber(part);
    if (n === undefined) continue;
    const level = SCHOOL_LEVELS.find((l) => n >= l.classFrom && n <= l.classTo);
    if (level) ids.add(level.id);
  }
  return ids.size > 0 ? [...ids] : [...ALL_LEVEL_IDS];
}

/** Дзвінки, чинні для цього слоту (клас + номер уроку). */
export function bellsForSlot(bells: Bell[], className: string, lesson: number): Bell[] {
  const ids = levelIdsForClass(className);
  return bells.filter((b) => b.lesson === lesson && (b.level === undefined || ids.includes(b.level)));
}

/** Проміжок часу слоту для РОЗРАХУНКІВ — об'єднання всіх чинних дзвінків
 *  (від найранішого початку до найпізнішого кінця). Для класу однієї ланки
 *  збігається зі `slotBell`; для спареного через ланки накриває обидва. */
export function slotInterval(bells: Bell[], className: string, lesson: number): TimeInterval | undefined {
  const list = bellsForSlot(bells, className, lesson);
  if (list.length === 0) return undefined;

  let start = list[0].start;
  let end = list[0].end;
  for (const b of list) {
    if (toMinutes(b.start) < toMinutes(start)) start = b.start;
    if (toMinutes(b.end) > toMinutes(end)) end = b.end;
  }
  return { start, end };
}

/** Напіввідкриті проміжки: урок 10:50–11:35 і урок 11:35–12:20 не конфліктують. */
export function intervalsOverlap(a: TimeInterval, b: TimeInterval): boolean {
  return toMinutes(a.start) < toMinutes(b.end) && toMinutes(b.start) < toMinutes(a.end);
}
