import { describe, expect, it } from "vitest";
import { seedState } from "./seed";
import { migrateState } from "./migrate";
import type { AppState } from "../types/state";
import type { Bell } from "../types/schedule";

/** Дзвінки з ланками — саме те, чого бракувало старій моделі. */
const bells: Bell[] = [
  { lesson: 2, start: "10:50", end: "11:35", level: "primary" },
  { lesson: 2, start: "11:05", end: "11:50", level: "senior" },
];

/** Старий запис — без start/end, як лежало в localStorage до цієї зміни. */
function legacy(over: Partial<AppState> = {}): AppState {
  return {
    ...seedState,
    bells,
    schedule: [
      { teacherId: "t1", weekday: 1, lesson: 2, class: "3", subject: "читання", room: "к1" },
      { teacherId: "t2", weekday: 1, lesson: 2, class: "9-А", subject: "фізика", room: "к9" },
    ] as unknown as AppState["schedule"],
    substitutions: [],
    attempts: [],
    ...over,
  };
}

describe("migrateState", () => {
  it("той самий номер уроку в різних ланках отримує РІЗНИЙ час", () => {
    const { state, report } = migrateState(legacy());
    expect(report.changed).toBe(true);
    expect(state.schedule[0]).toMatchObject({ class: "3", start: "10:50", end: "11:35" });
    expect(state.schedule[1]).toMatchObject({ class: "9-А", start: "11:05", end: "11:50" });
  });

  it("нічого не робить, якщо час уже проставлений", () => {
    const already = migrateState(legacy()).state;
    const { state, report } = migrateState(already);
    expect(report.changed).toBe(false);
    expect(state).toBe(already);
  });

  it("запис, для якого час вивести не вдалось, не зникає — лишається з порожнім часом", () => {
    const broken = legacy({
      schedule: [
        { teacherId: "t1", weekday: 1, lesson: 13, class: "2", subject: "читання", room: "к1" },
      ] as unknown as AppState["schedule"],
    });
    const { state, report } = migrateState(broken);
    expect(state.schedule).toHaveLength(1);
    expect(state.schedule[0]).toMatchObject({ lesson: 13, start: "", end: "" });
    expect(report.unresolvedSchedule).toBe(1);
  });

  it("заміни мігрують так само, як розклад", () => {
    const withSub = legacy({
      substitutions: [
        {
          id: "s1",
          date: "2026-09-03",
          lesson: 2,
          class: "9-А",
          absentTeacherId: "t2",
          mode: "urgent",
          status: "open",
          officialCalendarUpdated: false,
        },
      ] as unknown as AppState["substitutions"],
    });
    const { state } = migrateState(withSub);
    expect(state.substitutions[0]).toMatchObject({ start: "11:05", end: "11:50" });
  });
});
