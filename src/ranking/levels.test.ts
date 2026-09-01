import { describe, expect, it } from "vitest";
import type { Bell } from "../types/schedule";
import { bellsForSlot, intervalsOverlap, levelIdsForClass, slotBell, slotInterval, slotsOverlap } from "./levels";

/** Реальні дзвінки школи (вересень 2026). Ключове: збігається лише 1-й урок,
 *  решта зсунуті, а уроки 3 і 5 початкової накривають по два уроки старшої. */
const bells: Bell[] = [
  { lesson: 1, start: "10:00", end: "10:45", level: "primary" },
  { lesson: 2, start: "10:50", end: "11:35", level: "primary" },
  { lesson: 3, start: "11:45", end: "12:30", level: "primary" },
  { lesson: 4, start: "13:30", end: "14:15", level: "primary" },
  { lesson: 5, start: "14:20", end: "15:05", level: "primary" },
  { lesson: 6, start: "15:25", end: "16:10", level: "primary" },

  { lesson: 1, start: "10:00", end: "10:45", level: "middle" },
  { lesson: 2, start: "11:05", end: "11:50", level: "middle" },
  { lesson: 3, start: "12:00", end: "12:45", level: "middle" },
  { lesson: 4, start: "13:45", end: "14:30", level: "middle" },
  { lesson: 5, start: "14:40", end: "15:25", level: "middle" },
  { lesson: 6, start: "15:45", end: "16:30", level: "middle" },
  { lesson: 7, start: "16:35", end: "17:20", level: "middle" },
  { lesson: 8, start: "17:25", end: "18:10", level: "middle" },

  { lesson: 1, start: "10:00", end: "10:45", level: "senior" },
  { lesson: 2, start: "11:05", end: "11:50", level: "senior" },
  { lesson: 3, start: "12:00", end: "12:45", level: "senior" },
  { lesson: 4, start: "13:45", end: "14:30", level: "senior" },
  { lesson: 5, start: "14:40", end: "15:25", level: "senior" },
  { lesson: 6, start: "15:45", end: "16:30", level: "senior" },
  { lesson: 7, start: "16:35", end: "17:20", level: "senior" },
  { lesson: 8, start: "17:25", end: "18:10", level: "senior" },
];

describe("levelIdsForClass", () => {
  it("виводить ланку з числа в мітці класу", () => {
    expect(levelIdsForClass("3")).toEqual(["primary"]);
    expect(levelIdsForClass("4-Б")).toEqual(["primary"]);
    expect(levelIdsForClass("7")).toEqual(["middle"]);
    expect(levelIdsForClass("9-А")).toEqual(["senior"]);
    expect(levelIdsForClass("11")).toEqual(["senior"]);
  });

  it("спарений урок у межах однієї ланки дає одну ланку", () => {
    expect(levelIdsForClass("5-6")).toEqual(["middle"]);
    expect(levelIdsForClass("9-А/9-Б")).toEqual(["senior"]);
  });

  it("спарений урок через ланки дає обидві", () => {
    expect(new Set(levelIdsForClass("4-5"))).toEqual(new Set(["primary", "middle"]));
  });

  it("мітка без числа дає всі ланки — найширший, найобережніший варіант", () => {
    expect(levelIdsForClass("Дошкільна")).toEqual(["primary", "middle", "senior"]);
  });
});

describe("slotInterval / slotBell", () => {
  it("той самий номер уроку в різних ланках дає різний час", () => {
    expect(slotInterval(bells, "3", 2)).toEqual({ start: "10:50", end: "11:35" });
    expect(slotInterval(bells, "9-А", 2)).toEqual({ start: "11:05", end: "11:50" });
  });

  it("спарений через ланки урок накриває об'єднаний проміжок", () => {
    expect(slotInterval(bells, "4-5", 3)).toEqual({ start: "11:45", end: "12:45" });
  });

  it("номера, якого в цій ланці немає, не існує", () => {
    expect(slotInterval(bells, "3", 8)).toBeUndefined();
    expect(slotBell(bells, "9-А", 8)).toEqual({ lesson: 8, start: "17:25", end: "18:10", level: "senior" });
  });

  it("дзвінок без ланки чинний для всіх — старі бази поводяться як раніше", () => {
    const legacy: Bell[] = [{ lesson: 2, start: "09:55", end: "10:40" }];
    expect(bellsForSlot(legacy, "3", 2)).toHaveLength(1);
    expect(bellsForSlot(legacy, "11", 2)).toHaveLength(1);
  });
});

describe("intervalsOverlap", () => {
  it("суміжні уроки не конфліктують (проміжок напіввідкритий)", () => {
    expect(intervalsOverlap({ start: "10:00", end: "10:45" }, { start: "10:45", end: "11:30" })).toBe(false);
  });

  it("часткова накладка — конфлікт", () => {
    expect(intervalsOverlap({ start: "10:50", end: "11:35" }, { start: "11:05", end: "11:50" })).toBe(true);
  });
});

describe("slotsOverlap — та сама діра, через яку зайнятий вчитель вважався вільним", () => {
  it("урок 2 початкової накладається на урок 2 старшої при різних номерах? — ні, тут номери рівні, але час зсунутий", () => {
    expect(slotsOverlap(bells, { class: "3", lesson: 2 }, { class: "9-А", lesson: 2 })).toBe(true);
  });

  it("РІЗНІ номери, що перетинаються в часі, ловляться (урок 3 початкової × урок 2 старшої)", () => {
    // 11:45–12:30 проти 11:05–11:50 — спільні 11:45–11:50
    expect(slotsOverlap(bells, { class: "3", lesson: 3 }, { class: "9-А", lesson: 2 })).toBe(true);
  });

  it("урок 3 початкової накриває одразу два уроки старшої", () => {
    expect(slotsOverlap(bells, { class: "3", lesson: 3 }, { class: "11", lesson: 3 })).toBe(true);
  });

  it("ОДНАКОВІ номери, що НЕ перетинаються в часі, не вважаються конфліктом", () => {
    // урок 6 початкової 15:25–16:10 проти уроку 5 старшої 14:40–15:25 — стик, не накладка
    expect(slotsOverlap(bells, { class: "3", lesson: 6 }, { class: "9-А", lesson: 5 })).toBe(false);
    // урок 1 початкової проти уроку 2 старшої
    expect(slotsOverlap(bells, { class: "3", lesson: 1 }, { class: "9-А", lesson: 2 })).toBe(false);
  });

  it("без дзвінків падає назад на порівняння номерів", () => {
    expect(slotsOverlap([], { class: "3", lesson: 2 }, { class: "9-А", lesson: 2 })).toBe(true);
    expect(slotsOverlap([], { class: "3", lesson: 2 }, { class: "9-А", lesson: 3 })).toBe(false);
  });
});
