/** Спарені (об'єднані) класи — один урок, на якому сидять два чи більше класів
 *  разом. У розкладі це один запис із міткою на кшталт "5-6" або "9-А/9-Б":
 *  вчитель такого запису вважається таким, що викладає в кожному зі згаданих
 *  класів, а сам урок з'являється в календарі кожного з них.
 *
 *  Розбір навмисно консервативний, бо звичайна мітка класу теж має дефіс:
 *  "/" розділяє завжди, а "-" — лише коли всі частини числові ("5-6"),
 *  тож "9-А" лишається одним класом. */

function normalize(part: string): string {
  return part.trim();
}

const NUMERIC_RANGE = /^\d+(-\d+)+$/;

/** Складові класи мітки. Для звичайної мітки — вона сама одним елементом. */
export function splitClassLabel(label: string): string[] {
  const trimmed = normalize(label);
  if (trimmed === "") return [label];

  const parts = trimmed.includes("/")
    ? trimmed.split("/").map(normalize).filter((p) => p !== "")
    : NUMERIC_RANGE.test(trimmed)
      ? trimmed.split("-").map(normalize)
      : [trimmed];

  return [...new Set(parts.length > 0 ? parts : [trimmed])];
}

/** Чи мітки позначають хоч один спільний клас ("5-6" і "6" — так). */
export function classesOverlap(a: string, b: string): boolean {
  if (a === b) return true;
  const left = new Set(splitClassLabel(a));
  return splitClassLabel(b).some((cls) => left.has(cls));
}
