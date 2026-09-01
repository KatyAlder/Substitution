import { describe, expect, it } from "vitest";
import { seedState } from "./seed";
import { createSubstitutions, deleteSubstitution, deleteTeacher, markBroadcast, markDeadEnd, recordAttempt, removeSeedTeachers, setTeacherSchedule, updateTeacher } from "./actions";
import { classesOverlap } from "../ranking/classes";

describe("recordAttempt", () => {
  it("додає спробу й лишає заміну відкритою, якщо результат не 'agreed'", () => {
    const next = recordAttempt(seedState, "sub-1", "melnyk-taras", "refused");
    expect(next.attempts).toHaveLength(seedState.attempts.length + 1);

    const added = next.attempts.at(-1)!;
    expect(added).toMatchObject({ substitutionId: "sub-1", teacherId: "melnyk-taras", result: "refused" });

    const sub = next.substitutions.find((s) => s.id === "sub-1")!;
    expect(sub.status).toBe("open");
    expect(sub.substituteId).toBeUndefined();
  });

  it("при 'agreed' закриває заміну й фіксує замісника", () => {
    const next = recordAttempt(seedState, "sub-1", "kravets-maryna", "agreed");
    const sub = next.substitutions.find((s) => s.id === "sub-1")!;
    expect(sub.status).toBe("closed");
    expect(sub.substituteId).toBe("kravets-maryna");
    expect(sub.closedVia).toBe("chat");
  });

  it("'silent' і 'refused' не закривають заміну, тільки 'agreed'", () => {
    const next = recordAttempt(seedState, "sub-1", "melnyk-taras", "silent");
    expect(next.substitutions.find((s) => s.id === "sub-1")!.status).toBe("open");
  });

  it("не мутує вихідний стан", () => {
    const before = JSON.stringify(seedState);
    recordAttempt(seedState, "sub-1", "melnyk-taras", "agreed");
    expect(JSON.stringify(seedState)).toBe(before);
  });

  it("при 'agreed' на заміні зі статусом 'in-chat' пише closedVia 'voluntary' (розділ 3 ТЗ)", () => {
    const inChatState = markBroadcast(seedState, ["sub-2"]);
    const next = recordAttempt(inChatState, "sub-2", "melnyk-taras", "agreed");
    const sub = next.substitutions.find((s) => s.id === "sub-2")!;
    expect(sub.status).toBe("closed");
    expect(sub.closedVia).toBe("voluntary");
  });
});

describe("markDeadEnd", () => {
  it("переводить лише вказану заміну в статус dead-end", () => {
    const next = markDeadEnd(seedState, "sub-2");
    expect(next.substitutions.find((s) => s.id === "sub-2")!.status).toBe("dead-end");
    expect(next.substitutions.find((s) => s.id === "sub-1")!.status).toBe("open");
  });
});

describe("markBroadcast", () => {
  it("переводить лише перелічені заміни в статус 'in-chat'", () => {
    const next = markBroadcast(seedState, ["sub-2"]);
    expect(next.substitutions.find((s) => s.id === "sub-2")!.status).toBe("in-chat");
    expect(next.substitutions.find((s) => s.id === "sub-1")!.status).toBe("open");
  });

  it("з порожнім списком нічого не змінює", () => {
    const next = markBroadcast(seedState, []);
    expect(next.substitutions).toEqual(seedState.substitutions);
  });
});

describe("createSubstitutions", () => {
  it("додає одну нову заміну зі статусом 'open'", () => {
    const next = createSubstitutions(seedState, [
      { date: "2026-09-08", lesson: 1, class: "11", absentTeacherId: "tkachenko-ihor", mode: "urgent" },
    ]);
    expect(next.substitutions).toHaveLength(seedState.substitutions.length + 1);
    const added = next.substitutions.at(-1)!;
    expect(added).toMatchObject({
      date: "2026-09-08",
      lesson: 1,
      class: "11",
      absentTeacherId: "tkachenko-ihor",
      mode: "urgent",
      status: "open",
      officialCalendarUpdated: false,
    });
    expect(added.id).toBeTruthy();
  });

  it("пакетно додає кілька замін одразу ('на весь день')", () => {
    const next = createSubstitutions(seedState, [
      { date: "2026-09-08", lesson: 1, class: "9-А", absentTeacherId: "kravets-maryna", mode: "urgent" },
      { date: "2026-09-08", lesson: 2, class: "8-Б", absentTeacherId: "kravets-maryna", mode: "urgent" },
    ]);
    expect(next.substitutions).toHaveLength(seedState.substitutions.length + 2);
  });

  it("не мутує вихідний стан", () => {
    const before = JSON.stringify(seedState);
    createSubstitutions(seedState, [
      { date: "2026-09-08", lesson: 1, class: "11", absentTeacherId: "tkachenko-ihor", mode: "urgent" },
    ]);
    expect(JSON.stringify(seedState)).toBe(before);
  });
});

describe("updateTeacher", () => {
  it("оновлює прості поля вказаного вчителя, інших не чіпає", () => {
    const next = updateTeacher(seedState, "melnyk-taras", { name: "Мельник Т.", phone: "0501112233" });
    const updated = next.teachers.find((t) => t.id === "melnyk-taras")!;
    expect(updated.name).toBe("Мельник Т.");
    expect(updated.phone).toBe("0501112233");

    const other = next.teachers.find((t) => t.id === "kravets-maryna")!;
    expect(other).toEqual(seedState.teachers.find((t) => t.id === "kravets-maryna"));
  });

  it("дозволяє очистити необов'язкове поле, поставивши undefined", () => {
    const withPhone = updateTeacher(seedState, "melnyk-taras", { phone: "0501112233" });
    const cleared = updateTeacher(withPhone, "melnyk-taras", { phone: undefined });
    expect(cleared.teachers.find((t) => t.id === "melnyk-taras")!.phone).toBeUndefined();
  });

  it("замінює масиви subjects/presence/goldenHours цілком, а не зливає", () => {
    const next = updateTeacher(seedState, "melnyk-taras", {
      subjects: ["математика"],
      presence: [{ weekday: 1, from: "08:00", to: "09:00" }],
      goldenHours: [],
    });
    const updated = next.teachers.find((t) => t.id === "melnyk-taras")!;
    expect(updated.subjects).toEqual(["математика"]);
    expect(updated.presence).toEqual([{ weekday: 1, from: "08:00", to: "09:00" }]);
  });

  it("не мутує вихідний стан", () => {
    const before = JSON.stringify(seedState);
    updateTeacher(seedState, "melnyk-taras", { name: "X" });
    expect(JSON.stringify(seedState)).toBe(before);
  });
});

describe("setTeacherSchedule", () => {
  it("замінює всі записи цільового вчителя, чужих не чіпає", () => {
    const next = setTeacherSchedule(seedState, "tkachenko-ihor", [
      { weekday: 1, lesson: 2, class: "10-А", subject: "інформатика", room: "каб-14" },
    ]);

    const mine = next.schedule.filter((e) => e.teacherId === "tkachenko-ihor");
    expect(mine).toEqual([
      { teacherId: "tkachenko-ihor", weekday: 1, lesson: 2, class: "10-А", subject: "інформатика", room: "каб-14" },
    ]);

    const others = next.schedule.filter((e) => e.teacherId !== "tkachenko-ihor");
    expect(others).toEqual(seedState.schedule.filter((e) => e.teacherId !== "tkachenko-ihor"));
  });

  it("порожній масив прибирає весь розклад вчителя", () => {
    const next = setTeacherSchedule(seedState, "tkachenko-ihor", []);
    expect(next.schedule.some((e) => e.teacherId === "tkachenko-ihor")).toBe(false);
  });

  it("зберігає спарену мітку так, що обидва класи перетинаються", () => {
    const next = setTeacherSchedule(seedState, "tkachenko-ihor", [
      { weekday: 4, lesson: 1, class: "9-А/9-Б", subject: "інформатика", room: "каб-14" },
    ]);
    const entry = next.schedule.find((e) => e.teacherId === "tkachenko-ihor")!;
    expect(classesOverlap(entry.class, "9-А")).toBe(true);
    expect(classesOverlap(entry.class, "9-Б")).toBe(true);
  });

  it("не мутує вихідний стан", () => {
    const before = JSON.stringify(seedState);
    setTeacherSchedule(seedState, "tkachenko-ihor", []);
    expect(JSON.stringify(seedState)).toBe(before);
  });
});

describe("deleteTeacher", () => {
  it("прибирає вчителя й весь його розклад", () => {
    const next = deleteTeacher(seedState, "koval-andrii");
    expect(next.teachers.find((t) => t.id === "koval-andrii")).toBeUndefined();
    expect(next.schedule.some((e) => e.teacherId === "koval-andrii")).toBe(false);
  });

  it("прибирає заміни, де видалений вчитель відсутній, разом з ним", () => {
    const next = deleteTeacher(seedState, "koval-andrii");
    expect(next.substitutions.find((s) => s.id === "sub-h2")).toBeUndefined();
    expect(next.substitutions.find((s) => s.id === "sub-h3")).toBeUndefined();
    expect(next.substitutions.find((s) => s.id === "sub-h4")).toBeUndefined();
  });

  it("прибирає заміни, де видалений вчитель був замісником", () => {
    const next = deleteTeacher(seedState, "savchuk-dmytro");
    expect(next.substitutions.find((s) => s.id === "sub-h2")).toBeUndefined();
    // заміни інших замісників лишаються
    expect(next.substitutions.find((s) => s.id === "sub-h1")).toBeDefined();
  });

  it("не зачіпає інших учителів і їхній розклад/заміни", () => {
    const next = deleteTeacher(seedState, "koval-andrii");
    expect(next.teachers.find((t) => t.id === "melnyk-taras")).toEqual(
      seedState.teachers.find((t) => t.id === "melnyk-taras")
    );
    expect(next.substitutions.find((s) => s.id === "sub-1")).toBeDefined();
  });

  it("не мутує вихідний стан", () => {
    const before = JSON.stringify(seedState);
    deleteTeacher(seedState, "koval-andrii");
    expect(JSON.stringify(seedState)).toBe(before);
  });
});

describe("removeSeedTeachers", () => {
  it("прибирає всіх сідових вчителів разом з їхніми даними, лишаючи імпортованих", () => {
    const withReal = {
      ...seedState,
      teachers: [
        ...seedState.teachers,
        { id: "real-1", name: "Реальна Вчителька", subjects: ["хімія"], presence: [], goldenHours: [] },
      ],
      schedule: [
        ...seedState.schedule,
        { teacherId: "real-1", weekday: 2, lesson: 1, class: "9", subject: "хімія", room: "12" },
      ],
    };

    const next = removeSeedTeachers(withReal);

    expect(next.teachers.map((t) => t.id)).toEqual(["real-1"]);
    expect(next.schedule.every((e) => e.teacherId === "real-1")).toBe(true);
    expect(next.substitutions).toHaveLength(0);
    expect(next.attempts).toHaveLength(0);
  });
});

describe("deleteSubstitution", () => {
  it("прибирає заміну зі спробами, не чіпаючи решту", () => {
    const withAttempt = recordAttempt(seedState, "sub-1", "melnyk-taras", "refused");
    const next = deleteSubstitution(withAttempt, "sub-1");

    expect(next.substitutions.some((s) => s.id === "sub-1")).toBe(false);
    expect(next.substitutions).toHaveLength(seedState.substitutions.length - 1);
    expect(next.attempts.some((a) => a.substitutionId === "sub-1")).toBe(false);
    expect(next.attempts).toHaveLength(seedState.attempts.length);
    expect(next.teachers).toEqual(seedState.teachers);
  });
});
