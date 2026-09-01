import { describe, expect, it } from "vitest";
import { seedState } from "./data/seed";
import type { Substitution } from "./types/substitution";
import { buildBroadcastMessage, buildWholeDayMessage } from "./whatsapp";

describe("buildBroadcastMessage", () => {
  const bells = seedState.bells;
  const sub = (over: Partial<Substitution>): Substitution => ({
    id: "x",
    date: "2026-09-02",
    lesson: 2,
    class: "2",
    absentTeacherId: "t",
    mode: "planned",
    status: "open",
    officialCalendarUpdated: false,
    ...over,
  });

  it("одна дата — спільний заголовок + рядки за номером уроку", () => {
    const message = buildBroadcastMessage(
      [sub({ id: "a", lesson: 4, class: "2" }), sub({ id: "b", lesson: 2, class: "3-4" })],
      bells
    );

    expect(message).toBe(
      "Заміни на середу, 2 вересня\n3-4 клас - 09:55-10:40\n2 клас - 11:55-12:40"
    );
  });

  it("різні дати — окремий блок на кожну, розділені порожнім рядком", () => {
    const message = buildBroadcastMessage(
      [
        sub({ id: "a", date: "2026-09-09", lesson: 2, class: "7-А" }),
        sub({ id: "b", date: "2026-09-08", lesson: 3, class: "11" }),
      ],
      bells
    );

    expect(message).toBe(
      "Заміни на вівторок, 8 вересня\n11 клас - 10:50-11:35\n\nЗаміни на середу, 9 вересня\n7-А клас - 09:55-10:40"
    );
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
