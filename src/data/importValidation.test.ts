import { describe, expect, it } from "vitest";
import { seedState } from "./seed";
import { parseScheduleImport, summarizeImport } from "./importValidation";

const validJson = JSON.stringify({
  version: 2,
  updatedAt: "2026-09-05",
  bells: [{ lesson: 1, start: "09:00", end: "09:45" }],
  teachers: [
    { id: "novak-hanna", name: "Ганна Новак", subjects: ["біологія"] },
    { id: "melnyk-taras", name: "Тарас Мельник", subjects: ["фізика"] },
  ],
  schedule: [{ teacherId: "novak-hanna", weekday: 2, start: "10:50", end: "11:35", lesson: 3, class: "11", subject: "біологія", room: "каб-12" }],
});

describe("parseScheduleImport", () => {
  it("приймає коректний JSON", () => {
    const result = parseScheduleImport(validJson);
    expect(result.ok).toBe(true);
  });

  it("відхиляє некоректний JSON з поясненням", () => {
    const result = parseScheduleImport("{not valid json");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("JSON");
  });

  it("відхиляє відсутнє обов'язкове поле верхнього рівня", () => {
    const result = parseScheduleImport(JSON.stringify({ version: 1, updatedAt: "2026-09-05", bells: [], teachers: [] }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("schedule");
  });

  it("відхиляє вчителя без subjects із точним шляхом помилки", () => {
    const bad = JSON.parse(validJson);
    delete bad.teachers[0].subjects;
    const result = parseScheduleImport(JSON.stringify(bad));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("teachers[0].subjects: очікувався масив рядків");
  });

  it("відхиляє запис розкладу з number замість string у class", () => {
    const bad = JSON.parse(validJson);
    bad.schedule[0].class = 11;
    const result = parseScheduleImport(JSON.stringify(bad));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("schedule[0].class: очікувався рядок");
  });

  it("приймає вчителя без необов'язкових полів (phone/presence/goldenHours)", () => {
    const result = parseScheduleImport(validJson);
    expect(result.ok).toBe(true);
  });

  it("приймає вчителя з коректним teaches", () => {
    const good = JSON.parse(validJson);
    good.teachers[0].teaches = [{ subject: "біологія", classes: ["11", "10-А"] }];
    const result = parseScheduleImport(JSON.stringify(good));
    expect(result.ok).toBe(true);
  });

  it("відхиляє teaches із number замість рядка в classes — з точним шляхом", () => {
    const bad = JSON.parse(validJson);
    bad.teachers[0].teaches = [{ subject: "біологія", classes: [11] }];
    const result = parseScheduleImport(JSON.stringify(bad));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("teachers[0].teaches[0].classes: очікувався масив рядків");
  });

  it("відхиляє teaches без subject — з точним шляхом", () => {
    const bad = JSON.parse(validJson);
    bad.teachers[0].teaches = [{ classes: ["11"] }];
    const result = parseScheduleImport(JSON.stringify(bad));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("teachers[0].teaches[0].subject: очікувався рядок");
  });
});

describe("summarizeImport", () => {
  it("рахує нових і оновлених вчителів окремо", () => {
    const data = JSON.parse(validJson);
    const summary = summarizeImport(seedState, data);
    // novak-hanna відсутня в сідових даних, melnyk-taras присутній
    expect(summary.newTeachers).toContain("Ганна Новак");
    expect(summary.updatedTeachers).toContain("Тарас Мельник");
  });

  it("рахує нові й оновлені записи розкладу за ключем (teacherId, weekday, lesson)", () => {
    const data = JSON.parse(validJson);
    const summary = summarizeImport(seedState, data);
    expect(summary.newScheduleCount + summary.updatedScheduleCount).toBe(data.schedule.length);
  });

  it("виявляє teacherId у schedule, якого немає ні в стані, ні в самому імпорті", () => {
    const data = JSON.parse(validJson);
    data.schedule.push({ teacherId: "nobody-such", weekday: 1, start: "09:00", end: "09:45", lesson: 1, class: "5", subject: "х", room: "1" });
    const summary = summarizeImport(seedState, data);
    expect(summary.unknownTeacherIds).toEqual(["nobody-such"]);
  });

  it("не мутує вихідний стан", () => {
    const before = JSON.stringify(seedState);
    summarizeImport(seedState, JSON.parse(validJson));
    expect(JSON.stringify(seedState)).toBe(before);
  });
});

describe("час запису розкладу в імпорті", () => {
  const withLevels = {
    version: 1,
    updatedAt: "2026-09-01",
    bells: [
      { lesson: 2, start: "10:50", end: "11:35", level: "primary" },
      { lesson: 2, start: "11:05", end: "11:50", level: "senior" },
    ],
    teachers: [],
    schedule: [{ teacherId: "t1", weekday: 1, lesson: 2, class: "3", subject: "читання", room: "к1" }],
  };

  it("номер уроку без явного часу резолвиться через дзвінки своєї ланки", () => {
    const r = parseScheduleImport(JSON.stringify(withLevels));
    expect(r.ok).toBe(true);
  });

  it("номер, якого немає в дзвінках цієї ланки, блокує імпорт із поясненням", () => {
    const bad = { ...withLevels, schedule: [{ ...withLevels.schedule[0], lesson: 9 }] };
    const r = parseScheduleImport(JSON.stringify(bad));
    expect(r.ok).toBe(false);
    expect(r.ok ? "" : r.error).toContain("не вдалося визначити час");
  });

  it("явні start/end приймаються навіть без відповідного дзвінка", () => {
    const explicit = {
      ...withLevels,
      schedule: [{ ...withLevels.schedule[0], lesson: 9, start: "14:00", end: "14:45" }],
    };
    const r = parseScheduleImport(JSON.stringify(explicit));
    expect(r.ok).toBe(true);
  });
});
