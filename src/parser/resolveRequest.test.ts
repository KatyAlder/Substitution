import { describe, expect, it } from "vitest";
import { seedState } from "../data/seed";
import { findConflict, resolveBySlot, suggestedMode, teacherDayLessons } from "./resolveRequest";

const { schedule, bells, substitutions } = seedState;

describe("teacherDayLessons", () => {
  it("уроки Ткаченка у вівторок, відсортовані за номером", () => {
    const lessons = teacherDayLessons(schedule, bells, "tkachenko-ihor", 2);
    expect(lessons.map((l) => l.entry.lesson)).toEqual([1, 3]);
    expect(lessons[0].bell).toEqual({ lesson: 1, start: "09:00", end: "09:45" });
    expect(lessons[1].entry.class).toBe("11");
  });

  it("порожньо, якщо вчитель того дня не викладає", () => {
    expect(teacherDayLessons(schedule, bells, "tkachenko-ihor", 5)).toEqual([]);
  });
});

describe("resolveBySlot", () => {
  const lessons = teacherDayLessons(schedule, bells, "tkachenko-ihor", 2);

  it("номер уроку, який учитель того дня веде — matched", () => {
    const result = resolveBySlot(bells, lessons, { lesson: 3 });
    expect(result.matched?.entry.class).toBe("11");
    expect(result.matched?.entry.lesson).toBe(3);
    expect(result.nearestBell).toBeUndefined();
  });

  it("номер уроку, якого вчитель того дня не має — matched відсутній, без підказки", () => {
    const result = resolveBySlot(bells, lessons, { lesson: 2 });
    expect(result.matched).toBeUndefined();
    expect(result.nearestBell).toBeUndefined();
  });

  it("час потрапляє в дзвінок, який учитель веде — matched", () => {
    const result = resolveBySlot(bells, lessons, { time: "10:50" });
    expect(result.matched?.entry.lesson).toBe(3);
  });

  it("час потрапляє в реальний дзвінок школи, але вчитель того уроку не має — matched відсутній", () => {
    const result = resolveBySlot(bells, lessons, { time: "09:55" }); // урок 2 — не Ткаченків
    expect(result.matched).toBeUndefined();
    expect(result.nearestBell).toBeUndefined();
  });

  it("час поза жодним дзвінком школи — найближчий за часом початку", () => {
    const result = resolveBySlot(bells, lessons, { time: "08:20" });
    expect(result.matched).toBeUndefined();
    expect(result.nearestBell).toEqual({ lesson: 1, start: "09:00", end: "09:45" });
  });

  it("ні номера, ні часу — нічого не резолвиться", () => {
    expect(resolveBySlot(bells, lessons, {})).toEqual({});
  });
});

describe("findConflict", () => {
  it("знаходить наявну заміну на той самий date/lesson/class", () => {
    const conflict = findConflict(substitutions, "2026-09-08", 3, "11");
    expect(conflict?.id).toBe("sub-1");
  });

  it("немає конфлікту для вільного слоту", () => {
    expect(findConflict(substitutions, "2026-09-08", 1, "11")).toBeUndefined();
  });
});

describe("suggestedMode", () => {
  it("дата = сьогодні -> urgent, інакше -> planned", () => {
    expect(suggestedMode("2026-09-07", "2026-09-07")).toBe("urgent");
    expect(suggestedMode("2026-09-08", "2026-09-07")).toBe("planned");
  });
});
