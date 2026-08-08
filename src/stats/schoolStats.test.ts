import { describe, expect, it } from "vitest";
import { seedState } from "../data/seed";
import { monthlyStats } from "../profile/stats";
import { deadEndsForMonth, shiftMonth, teacherMonthlyRows } from "./schoolStats";

describe("teacherMonthlyRows", () => {
  it("рядок конкретного вчителя збігається з прямим викликом monthlyStats", () => {
    const rows = teacherMonthlyRows(seedState, "2026-09");
    const kravets = rows.find((r) => r.teacherId === "kravets-maryna")!;
    expect(kravets).toEqual({
      teacherId: "kravets-maryna",
      name: "Кравець Марина",
      ...monthlyStats(seedState, "kravets-maryna", "2026-09"),
    });
  });

  it("включає всіх учителів, навіть без активності цього місяця, відсортовано за іменем", () => {
    const rows = teacherMonthlyRows(seedState, "2026-09");
    expect(rows).toHaveLength(seedState.teachers.length);
    const names = rows.map((r) => r.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "uk")));

    const lytvyn = rows.find((r) => r.teacherId === "lytvyn-oleh")!;
    expect(lytvyn.substitutions).toBe(0);
    expect(lytvyn.refused).toBe(0);
    expect(lytvyn.silent).toBe(0);
  });
});

describe("deadEndsForMonth", () => {
  it("порожній список, коли тупиків цього місяця в стані немає", () => {
    expect(deadEndsForMonth(seedState, "2026-09")).toEqual([]);
  });

  it("знаходить dead-end заміну за місяць і підставляє ім'я відсутнього", () => {
    const state = {
      ...seedState,
      substitutions: [
        ...seedState.substitutions,
        {
          id: "sub-dead",
          date: "2026-09-10",
          lesson: 2,
          class: "11",
          absentTeacherId: "tkachenko-ihor",
          mode: "urgent" as const,
          status: "dead-end" as const,
          officialCalendarUpdated: false,
        },
      ],
    };
    const rows = deadEndsForMonth(state, "2026-09");
    expect(rows).toEqual([
      {
        id: "sub-dead",
        date: "2026-09-10",
        lesson: 2,
        class: "11",
        absentTeacherName: "Ткаченко Ігор",
      },
    ]);
  });
});

describe("shiftMonth", () => {
  it("зсуває в межах року в обидва боки", () => {
    expect(shiftMonth("2026-09", 1)).toBe("2026-10");
    expect(shiftMonth("2026-09", -1)).toBe("2026-08");
  });

  it("коректно згортає межу року", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
  });
});
