import { describe, expect, it } from "vitest";
import type { AppState } from "../types/state";
import type { ScheduleImport } from "../types/importFormat";
import { importSchedule } from "./importSchedule";

// Мінімальна база з одним вчителем, у якого заповнені всі "профільні" поля,
// які збирає рука в застосунку (телефон, teaches, присутність, золоті години).
const baseState: AppState = {
  version: 1,
  updatedAt: "2026-09-01",
  bells: [{ lesson: 1, start: "09:00", end: "09:45" }],
  teachers: [
    {
      id: "tkachenko-ihor",
      name: "Ткаченко Ігор",
      phone: "+380000000000",
      subjects: ["інформатика"],
      teaches: [{ subject: "інформатика", classes: ["11", "9-Б"] }],
      presence: [{ weekday: 2, from: "08:30", to: "14:00" }],
      goldenHours: [{ weekday: 2, from: "12:00", to: "12:45" }],
    },
  ],
  schedule: [
    { teacherId: "tkachenko-ihor", weekday: 2, start: "09:00", end: "09:45", lesson: 1, class: "11", subject: "інформатика", room: "Hardlab" },
  ],
  substitutions: [],
  attempts: [],
};

const importWithTeacher = (extra: Partial<ScheduleImport["teachers"][number]> = {}): ScheduleImport => ({
  version: 2,
  updatedAt: "2026-09-10",
  bells: baseState.bells,
  teachers: [{ id: "tkachenko-ihor", name: "Ткаченко Ігор", subjects: ["інформатика"], ...extra }],
  schedule: [
    { teacherId: "tkachenko-ihor", weekday: 3, start: "09:55", end: "10:40", lesson: 2, class: "9-Б", subject: "інформатика", room: "Hardlab" },
  ],
});

describe("importSchedule — збереження профільних полів вчителя", () => {
  it("вчитель в імпорті без teaches — наявне teaches лишається", () => {
    const next = importSchedule(baseState, importWithTeacher());
    const t = next.teachers.find((x) => x.id === "tkachenko-ihor")!;
    expect(t.teaches).toEqual([{ subject: "інформатика", classes: ["11", "9-Б"] }]);
  });

  it("вчитель в імпорті з teaches — заміщує наявне", () => {
    const next = importSchedule(
      baseState,
      importWithTeacher({ teaches: [{ subject: "робототехніка", classes: ["10-А"] }] })
    );
    const t = next.teachers.find((x) => x.id === "tkachenko-ihor")!;
    expect(t.teaches).toEqual([{ subject: "робототехніка", classes: ["10-А"] }]);
  });

  it("phone / presence / goldenHours теж зберігаються, коли їх нема в JSON", () => {
    const next = importSchedule(baseState, importWithTeacher());
    const t = next.teachers.find((x) => x.id === "tkachenko-ihor")!;
    expect(t.phone).toBe("+380000000000");
    expect(t.presence).toEqual([{ weekday: 2, from: "08:30", to: "14:00" }]);
    expect(t.goldenHours).toEqual([{ weekday: 2, from: "12:00", to: "12:45" }]);
  });

  it("імпорт лише розкладу (teachers: []) не змінює запис вчителя жодним полем", () => {
    const scheduleOnly: ScheduleImport = {
      version: 2,
      updatedAt: "2026-09-10",
      bells: baseState.bells,
      teachers: [],
      schedule: [
        { teacherId: "tkachenko-ihor", weekday: 2, start: "09:00", end: "09:45", lesson: 1, class: "11", subject: "інформатика", room: "Softlab" },
      ],
    };
    const next = importSchedule(baseState, scheduleOnly);
    expect(next.teachers).toEqual(baseState.teachers);
    // а сам розклад за ключем (teacherId, weekday, lesson) — оновився
    expect(next.schedule.find((e) => e.weekday === 2 && e.lesson === 1)!.room).toBe("Softlab");
  });

  it("заміни та спроби не чіпаються", () => {
    const stateWithSubs: AppState = {
      ...baseState,
      substitutions: [
        {
          id: "sub-1",
          date: "2026-09-02",
          start: "09:00",
          end: "09:45",
          lesson: 1,
          class: "11",
          absentTeacherId: "tkachenko-ihor",
          status: "open",
          mode: "urgent",
          officialCalendarUpdated: false,
        },
      ],
      attempts: [{ id: "att-1", substitutionId: "sub-1", teacherId: "someone", at: "2026-09-02T09:00:00", result: "silent" }],
    };
    const next = importSchedule(stateWithSubs, importWithTeacher());
    expect(next.substitutions).toEqual(stateWithSubs.substitutions);
    expect(next.attempts).toEqual(stateWithSubs.attempts);
  });
});

describe("ключ запису розкладу — вчитель, день і ЧАС початку", () => {
  const base: AppState = {
    ...baseState,
    schedule: [{ teacherId: "t1", weekday: 1, start: "09:00", end: "09:45", lesson: 1, class: "3", subject: "читання", room: "каб-1" }],
  };

  it("уроки в різний час того самого дня — два різні записи, не затирають одне одного", () => {
    const next = importSchedule(base, {
      version: 1,
      updatedAt: "2026-09-10",
      bells: base.bells,
      teachers: [],
      // Той самий номер уроку (1), але інший час — у 9-А своя ланка й свій дзвінок.
      schedule: [{ teacherId: "t1", weekday: 1, start: "09:55", end: "10:40", lesson: 1, class: "9-А", subject: "фізика", room: "каб-9" }],
    });
    expect(next.schedule).toHaveLength(2);
    expect(next.schedule.map((e) => e.class).sort()).toEqual(["3", "9-А"]);
  });

  it("той самий час — і далі заміщення, а не дубль", () => {
    const next = importSchedule(base, {
      version: 1,
      updatedAt: "2026-09-10",
      bells: base.bells,
      teachers: [],
      schedule: [{ teacherId: "t1", weekday: 1, start: "09:00", end: "09:45", lesson: 1, class: "3", subject: "математика", room: "каб-2" }],
    });
    expect(next.schedule).toHaveLength(1);
    expect(next.schedule[0].subject).toBe("математика");
  });
});

describe("replaceSchedule — збирання розкладу заново", () => {
  const base: AppState = {
    ...baseState,
    schedule: [
      { teacherId: "t1", weekday: 1, start: "09:00", end: "09:45", lesson: 1, class: "3", subject: "читання", room: "к1" },
      { teacherId: "t9", weekday: 2, start: "", end: "", lesson: 13, class: "2", subject: "старе сміття", room: "" },
    ],
  };

  const fresh = {
    version: 1,
    updatedAt: "2026-09-10",
    bells: base.bells,
    teachers: [],
    replaceSchedule: true,
    schedule: [
      { teacherId: "t1", weekday: 1, start: "10:00", end: "10:45", lesson: 1, class: "3", subject: "читання", room: "к1" },
    ],
  };

  it("замінює розклад повністю — старі записи, включно з битими, зникають", () => {
    const next = importSchedule(base, fresh);
    expect(next.schedule).toHaveLength(1);
    expect(next.schedule[0]).toMatchObject({ start: "10:00", end: "10:45" });
  });

  it("без прапорця — стара поведінка, старі записи лишаються", () => {
    const next = importSchedule(base, { ...fresh, replaceSchedule: false });
    expect(next.schedule).toHaveLength(3);
  });

  it("профілі вчителів не зачіпаються навіть при повній заміні розкладу", () => {
    const next = importSchedule(base, fresh);
    expect(next.teachers).toEqual(base.teachers);
  });
});
