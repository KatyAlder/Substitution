import { describe, expect, it } from "vitest";
import { seedState } from "../data/seed";
import { rankCandidates } from "./rank";

const sub1 = seedState.substitutions.find((s) => s.id === "sub-1")!;
const sub2 = seedState.substitutions.find((s) => s.id === "sub-2")!;

function ids(list: { teacher: { id: string } }[]): string[] {
  return list.map((c) => c.teacher.id);
}

describe("слот 1 — вт, урок 3, 11 клас, інформатика (відсутній Ткаченко Ігор)", () => {
  const result = rankCandidates(seedState, sub1);

  it("розкладає по тирах точно так, як узгоджено", () => {
    expect(ids(result.tiers[2])).toEqual(["honcharuk-iryna"]);
    expect(ids(result.tiers[3])).toEqual(["zakharchenko-viktor"]);
    expect(ids(result.tiers[4])).toEqual(["koval-andrii"]);
    expect(ids(result.tiers[5])).toEqual(["klymenko-oksana", "shevchenko-natalia"]);
    expect(ids(result.tiers[6])).toEqual(["lytvyn-oleh"]);
  });

  it("тир 1: бонуси (золота година / 3 відмови) переважають кількість уроків", () => {
    expect(ids(result.tiers[1])).toEqual([
      "savchuk-dmytro",
      "romaniuk-yulia",
      "bondarenko-svitlana",
      "kravets-maryna",
      "melnyk-taras",
    ]);
  });

  it("погодинниця з фактичною присутністю потрапляє в тир 1, а не в тир 3", () => {
    const bondarenko = result.tiers[1].find((c) => c.teacher.id === "bondarenko-svitlana");
    expect(bondarenko).toBeDefined();
  });

  it("нічия за кількістю уроків (Мельник і Кравець, по 3) розв'язується за іменем", () => {
    const melnyk = result.tiers[1].find((c) => c.teacher.id === "melnyk-taras")!;
    const kravets = result.tiers[1].find((c) => c.teacher.id === "kravets-maryna")!;
    expect(melnyk.lessonsToday).toBe(kravets.lessonsToday);
    expect(ids(result.tiers[1]).indexOf("kravets-maryna")).toBeLessThan(ids(result.tiers[1]).indexOf("melnyk-taras"));
  });

  it("Савчук — у золотій годині, Мельник — ні", () => {
    const savchuk = result.tiers[1].find((c) => c.teacher.id === "savchuk-dmytro")!;
    const melnyk = result.tiers[1].find((c) => c.teacher.id === "melnyk-taras")!;
    expect(savchuk.inGoldenHour).toBe(true);
    expect(melnyk.inGoldenHour).toBe(false);
  });

  it("у Романюк — 3 відмови поспіль, мовчання серед спроб не зіпсувало лічильник", () => {
    const romaniuk = result.tiers[1].find((c) => c.teacher.id === "romaniuk-yulia")!;
    expect(romaniuk.consecutiveRefusals).toBe(3);
    expect(romaniuk.bonusCount).toBe(1);
  });

  it("відсутній вчитель і той, хто сам зайнятий цієї миті, у списку не з'являються", () => {
    const allIds = [1, 2, 3, 4, 5, 6].flatMap((t) => ids(result.tiers[t as 1 | 2 | 3 | 4 | 5 | 6]));
    expect(allIds).not.toContain("tkachenko-ihor");
    expect(allIds).not.toContain("diachenko-petro");
  });

  it("лабораторія технічного предмета зайнята — позначка про це, а не виключення кандидатів", () => {
    expect(result.labApplicable).toBe(true);
    expect(result.labAvailable).toBe(false);
  });

  it("кожен кандидат зустрічається у списку рівно один раз", () => {
    const allIds = [1, 2, 3, 4, 5, 6].flatMap((t) => ids(result.tiers[t as 1 | 2 | 3 | 4 | 5 | 6]));
    expect(new Set(allIds).size).toBe(allIds.length);
  });
});

describe("слот 2 — ср, урок 2, 7-А, біологія (відсутня Клименко Оксана)", () => {
  const result = rankCandidates(seedState, sub2);

  it("розкладає по тирах для іншого дня й класу", () => {
    expect(ids(result.tiers[1])).toEqual(["melnyk-taras"]);
    expect(ids(result.tiers[3])).toEqual(["kravets-maryna"]);
    expect(ids(result.tiers[4])).toEqual(["koval-andrii"]);
    expect(ids(result.tiers[5])).toEqual(["honcharuk-iryna", "shevchenko-natalia"]);
  });

  it("звичайний (не погодинний) учитель без присутності теж падає в тир 3", () => {
    expect(result.tiers[3][0].teacher.id).toBe("kravets-maryna");
    expect(seedState.teachers.find((t) => t.id === "kravets-maryna")?.isHourly).toBeUndefined();
  });

  it("нетехнічний предмет не потребує позначки про авдиторію", () => {
    expect(result.labApplicable).toBe(false);
    expect(result.labAvailable).toBe(true);
  });
});

describe("спарені класи", () => {
  const paired = {
    ...seedState,
    schedule: [
      ...seedState.schedule,
      // Спарений урок: 5 і 6 класи разом в одного вчителя.
      { teacherId: "lytvyn-oleh", weekday: 2, lesson: 3, class: "5-6", subject: "фізика", room: "каб-7" },
    ],
  };

  function rankFor(className: string) {
    return rankCandidates(paired, { ...sub1, class: className, absentTeacherId: "koval-andrii", lesson: 4 });
  }

  it("вчитель спареного уроку вважається таким, що викладає в кожному з класів", () => {
    for (const className of ["5", "6", "5-6"]) {
      const teaching = [...rankFor(className).tiers[1], ...rankFor(className).tiers[3]];
      expect(ids(teaching)).toContain("lytvyn-oleh");
    }
  });

  it("сусідній клас поза спареним уроком не зараховується", () => {
    const result = rankFor("7");
    const teaching = [...result.tiers[1], ...result.tiers[2], ...result.tiers[3]];
    expect(ids(teaching)).not.toContain("lytvyn-oleh");
  });
});
