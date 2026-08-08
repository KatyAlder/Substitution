import { describe, expect, it } from "vitest";
import { seedState } from "./seed";
import { createSubstitutions, markBroadcast, markDeadEnd, recordAttempt } from "./actions";

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
