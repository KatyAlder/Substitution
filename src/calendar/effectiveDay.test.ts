import { describe, expect, it } from "vitest";
import { seedState } from "../data/seed";
import { effectiveDaySchedule } from "./effectiveDay";

describe("effectiveDaySchedule", () => {
  it("звичайний день без замін — слоти = база один-в-один", () => {
    // 2026-09-06 (неділя) немає в базі жодного запису weekday=7,
    // тож візьмемо день без жодної заміни для його weekday: 2026-09-09 (ср).
    const slots = effectiveDaySchedule(seedState, "2026-09-09");
    const own = slots.find((s) => s.class === "7-А" && s.lesson === 1);
    expect(own).toBeDefined();
    expect(own?.teacherId).toBe("melnyk-taras");
    expect(own?.isSubstitution).toBe(false);
    expect(own?.pendingStatus).toBeUndefined();
  });

  it("закрита заміна переставляє teacherId на замісника й додає substituteFor", () => {
    // sub-h3: 2026-09-01 (вт), урок 4, 10-Б математика, відсутній koval-andrii,
    // closed -> kravets-maryna. У той самий слот (клас+урок, інший предмет)
    // паралельно є ще й інформатика Мельника — фільтруємо предметом, щоб не
    // сплутати два різні базові записи на той самий клас/урок.
    const slots = effectiveDaySchedule(seedState, "2026-09-01");
    const slot = slots.find((s) => s.class === "10-Б" && s.lesson === 4 && s.subject === "математика");
    expect(slot).toBeDefined();
    expect(slot?.teacherId).toBe("kravets-maryna");
    expect(slot?.isSubstitution).toBe(true);
    expect(slot?.substituteFor).toBe("koval-andrii");
    expect(slot?.pendingStatus).toBeUndefined();

    // паралельний запис (інформатика, той самий клас/урок) заміну не зачепила
    const other = slots.find((s) => s.class === "10-Б" && s.lesson === 4 && s.subject === "інформатика");
    expect(other?.teacherId).toBe("melnyk-taras");
    expect(other?.isSubstitution).toBe(false);
  });

  it("незакрита заміна (open) лишає слот за відсутнім із pendingStatus", () => {
    // sub-1: 2026-09-08, урок 3, 11 клас, відсутній tkachenko-ihor, status open
    const slots = effectiveDaySchedule(seedState, "2026-09-08");
    const slot = slots.find((s) => s.class === "11" && s.lesson === 3);
    expect(slot).toBeDefined();
    expect(slot?.teacherId).toBe("tkachenko-ihor");
    expect(slot?.isSubstitution).toBe(false);
    expect(slot?.pendingStatus).toBe("open");
  });

  it("заміна на іншу дату/урок/клас не чіпає слот", () => {
    // sub-h3 закрита на 2026-09-01 лише для (урок4, 10-Б, koval-andrii) —
    // інший урок Ткаченка того самого дня лишається звичайним
    const slots = effectiveDaySchedule(seedState, "2026-09-01");
    const untouched = slots.find((s) => s.class === "11" && s.lesson === 1);
    expect(untouched).toBeDefined();
    expect(untouched?.teacherId).toBe("tkachenko-ihor");
    expect(untouched?.isSubstitution).toBe(false);
  });

  it("закрита заміна без substituteId трактується як не закрита (захист)", () => {
    const state = {
      ...seedState,
      substitutions: [
        {
          id: "broken",
          date: "2026-09-09",
          lesson: 1,
          class: "7-А",
          absentTeacherId: "melnyk-taras",
          mode: "urgent" as const,
          status: "closed" as const,
          officialCalendarUpdated: false,
        },
      ],
    };
    const slots = effectiveDaySchedule(state, "2026-09-09");
    const slot = slots.find((s) => s.class === "7-А" && s.lesson === 1);
    expect(slot?.isSubstitution).toBe(false);
    expect(slot?.teacherId).toBe("melnyk-taras");
    expect(slot?.pendingStatus).toBeUndefined();
  });

  it("день без жодного запису в базі повертає порожній список", () => {
    const slots = effectiveDaySchedule(seedState, "2026-09-06"); // неділя
    expect(slots).toEqual([]);
  });
});
