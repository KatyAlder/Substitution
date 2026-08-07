import { describe, expect, it } from "vitest";
import { seedState } from "./data/seed";
import { buildBroadcastMessage } from "./whatsapp";

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
