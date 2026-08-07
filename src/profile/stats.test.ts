import { describe, expect, it } from "vitest";
import { seedState } from "../data/seed";
import { classLoad, monthlyStats, weeklyGoldenHourLabel, weeklyPresenceLabel } from "./stats";

describe("classLoad", () => {
  it("групує уроки Кравець Марини по класу й предмету, відсортовано за класом", () => {
    expect(classLoad(seedState.schedule, "kravets-maryna")).toEqual([
      { class: "11", subject: "інформатика", lessonsPerWeek: 1 },
      { class: "7-А", subject: "інформатика", lessonsPerWeek: 1 },
      { class: "8-Б", subject: "інформатика", lessonsPerWeek: 1 },
      { class: "9-А", subject: "інформатика", lessonsPerWeek: 1 },
    ]);
  });

  it("рахує кілька уроків того самого класу й предмета за тиждень одним рядком", () => {
    const load = classLoad(seedState.schedule, "shevchenko-natalia");
    expect(load).toEqual([{ class: "8-Б", subject: "українська мова", lessonsPerWeek: 5 }]);
  });
});

describe("weeklyPresenceLabel / weeklyGoldenHourLabel", () => {
  it("'увесь час' для alwaysPresent, незалежно від дня тижня", () => {
    const pavliuk = seedState.teachers.find((t) => t.id === "pavliuk-olena")!;
    expect(weeklyPresenceLabel(pavliuk, 1)).toBe("увесь час");
    expect(weeklyPresenceLabel(pavliuk, 3)).toBe("увесь час");
  });

  it("формат блоку в конкретний день, '—' у решту днів", () => {
    const kravets = seedState.teachers.find((t) => t.id === "kravets-maryna")!;
    expect(weeklyPresenceLabel(kravets, 2)).toBe("08:00–14:30");
    expect(weeklyPresenceLabel(kravets, 3)).toBe("—");
  });

  it("золота година показується лише в свій день тижня", () => {
    const pavliuk = seedState.teachers.find((t) => t.id === "pavliuk-olena")!;
    expect(weeklyGoldenHourLabel(pavliuk, 3)).toBe("12:00–15:00");
    expect(weeklyGoldenHourLabel(pavliuk, 2)).toBe("—");
  });
});

describe("monthlyStats", () => {
  it("рахує тільки замінені 'agreed'-статуси в межах місяця для конкретного вчителя", () => {
    const stats = monthlyStats(seedState, "kravets-maryna", "2026-09");
    expect(stats.substitutions).toBe(4); // sub-h3..sub-h6
    expect(stats.refused).toBe(0);
    expect(stats.silent).toBe(0);
  });

  it("відмови й мовчання рахуються з attempts за конкретний місяць", () => {
    const stats = monthlyStats(seedState, "romaniuk-yulia", "2026-09");
    expect(stats.refused).toBe(3); // att-3, att-4, att-5 — всі вересень
    expect(stats.silent).toBe(0); // att-2 (мовчання) — серпень, не вересень
  });

  it("інший місяць не змішується зі статистикою", () => {
    const stats = monthlyStats(seedState, "romaniuk-yulia", "2026-08");
    expect(stats.silent).toBe(1); // att-2
    expect(stats.refused).toBe(0);
  });

  it("порожньо для вчителя без активності в цьому місяці", () => {
    expect(monthlyStats(seedState, "lytvyn-oleh", "2026-09")).toEqual({
      substitutions: 0,
      refused: 0,
      silent: 0,
    });
  });
});
