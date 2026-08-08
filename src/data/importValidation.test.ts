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
  schedule: [{ teacherId: "novak-hanna", weekday: 2, lesson: 3, class: "11", subject: "біологія", room: "каб-12" }],
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
    data.schedule.push({ teacherId: "nobody-such", weekday: 1, lesson: 1, class: "5", subject: "х", room: "1" });
    const summary = summarizeImport(seedState, data);
    expect(summary.unknownTeacherIds).toEqual(["nobody-such"]);
  });

  it("не мутує вихідний стан", () => {
    const before = JSON.stringify(seedState);
    summarizeImport(seedState, JSON.parse(validJson));
    expect(JSON.stringify(seedState)).toBe(before);
  });
});
