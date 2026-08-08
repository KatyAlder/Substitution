import { describe, expect, it } from "vitest";
import { seedState } from "./data/seed";
import { buildBroadcastMessage, buildWholeDayMessage } from "./whatsapp";

describe("buildBroadcastMessage", () => {
  it("формує список одним повідомленням для кількох завчасних замін (розділ 1, 5, 6 ТЗ)", () => {
    const sub2 = seedState.substitutions.find((s) => s.id === "sub-2")!;
    const message = buildBroadcastMessage([sub2], seedState.bells);

    expect(message).toBe("Потрібен доброволець:\n- середа, 2026-09-09, 7-А клас, урок 2 (09:55–10:40)");
  });

  it("кілька замін — кожна своїм рядком", () => {
    const sub1 = seedState.substitutions.find((s) => s.id === "sub-1")!;
    const sub2 = seedState.substitutions.find((s) => s.id === "sub-2")!;
    const message = buildBroadcastMessage([sub1, sub2], seedState.bells);

    expect(message.split("\n")).toHaveLength(3); // заголовок + 2 рядки
  });
});

describe("buildWholeDayMessage", () => {
  it("формує текст за прикладом розділу 6 ТЗ — дата в родовому відмінку, рядки за уроками", () => {
    const message = buildWholeDayMessage(seedState.substitutions[0].date, 2, [
      { class: "11", lesson: 3, start: "10:50", end: "11:35" },
      { class: "11", lesson: 1, start: "09:00", end: "09:45" },
    ]);
    expect(message).toBe(
      "Заміни на вівторок, 8 вересня\n11 клас — 09:00–09:45\n11 клас — 10:50–11:35"
    );
  });

  it("порожній список уроків — лише заголовок", () => {
    expect(buildWholeDayMessage("2026-09-08", 2, [])).toBe("Заміни на вівторок, 8 вересня");
  });
});
