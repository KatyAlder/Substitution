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
    // Сідові дані вигадані ("інформатика" / "каб-14"), а TECHNICAL_SUBJECT_ROOMS
    // від сесії 12 містить реальні предмети й авдиторії школи — тож для цієї
    // перевірки підміняємо предмет і кабінет слоту на справжню пару.
    const technical = {
      ...seedState,
      schedule: seedState.schedule.map((e) =>
        e.subject === "інформатика" || e.room === "каб-14"
          ? { ...e, subject: e.subject === "інформатика" ? "Scratch" : e.subject, room: "HardLab" }
          : e
      ),
    };
    const technicalResult = rankCandidates(technical, sub1);

    expect(technicalResult.labApplicable).toBe(true);
    expect(technicalResult.labAvailable).toBe(false);
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

describe("явне поле teaches (клас без запису в розкладі)", () => {
  const withMolodsha = {
    ...seedState,
    teachers: [
      ...seedState.teachers,
      {
        id: "ivanenko-molodsha",
        name: "Іваненко Молодша",
        subjects: ["я досліджую світ"],
        teaches: [{ subject: "я досліджую світ", classes: ["3-А"] }],
        presence: [{ weekday: 2, from: "08:00", to: "14:00" }],
        goldenHours: [],
      },
    ],
  };

  it("вчитель потрапляє в тир 1 за класом зі свого teaches, хоча уроків у розкладі немає", () => {
    const result = rankCandidates(withMolodsha, { ...sub1, class: "3-А", absentTeacherId: "koval-andrii" });
    expect(ids(result.tiers[1])).toContain("ivanenko-molodsha");
  });

  it("предмет відсутнього для позначки лабораторії береться з teaches, коли розкладу на цей слот немає", () => {
    const infKoval = {
      ...withMolodsha,
      teachers: withMolodsha.teachers.map((t) =>
        t.id === "koval-andrii" ? { ...t, teaches: [{ subject: "Scratch", classes: ["3-А"] }] } : t
      ),
    };
    // вт, урок 3, клас "3-А" — жодного запису koval-andrii у розкладі на цей слот немає
    const result = rankCandidates(infKoval, { ...sub1, class: "3-А", absentTeacherId: "koval-andrii" });
    expect(result.subject).toBe("Scratch");
    expect(result.labApplicable).toBe(true);
  });
});

describe("спарені класи", () => {
  const paired = {
    ...seedState,
    schedule: [
      ...seedState.schedule,
      // Спарений урок: 5 і 6 класи разом в одного вчителя.
      { teacherId: "lytvyn-oleh", weekday: 2, start: "10:50", end: "11:35", lesson: 3, class: "5-6", subject: "фізика", room: "каб-7" },
    ],
  };

  function rankFor(className: string) {
    return rankCandidates(paired, { ...sub1, class: className, absentTeacherId: "koval-andrii", start: "11:55", end: "12:40", lesson: 4 });
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

describe("різні ланки школи — власний урок кандидата рахується за ЧАСОМ, не за номером", () => {
  // Реальні дзвінки: у початковій урок 2 = 10:50-11:35, у старшій урок 2 =
  // 11:05-11:50. Номери однакові, час різний — і навпаки: урок 3 початкової
  // (11:45-12:30) накладається на урок 2 старшої при різних номерах.
  const teachers = [
    {
      id: "absent-primary",
      name: "Відсутня Початкова",
      subjects: ["читання"],
      teaches: [{ subject: "читання", classes: ["3"] }],
      presence: [{ weekday: 2, from: "10:00", to: "16:00" }],
      goldenHours: [],
    },
    {
      // веде урок 2 у 9-А (11:05-11:50) — фізично зайнятий об 11:45
      id: "busy-senior",
      name: "Зайнятий Старша",
      subjects: ["фізика"],
      presence: [{ weekday: 2, from: "10:00", to: "16:00" }],
      goldenHours: [],
    },
    {
      id: "free-teacher",
      name: "Вільний Хтось",
      subjects: ["музика"],
      presence: [{ weekday: 2, from: "10:00", to: "16:00" }],
      goldenHours: [],
    },
  ];

  const state = {
    ...seedState,
    teachers,
    schedule: [
      { teacherId: "absent-primary", weekday: 2, start: "11:45", end: "12:30", lesson: 3, class: "3", subject: "читання", room: "каб-1" },
      { teacherId: "busy-senior", weekday: 2, start: "11:05", end: "11:50", lesson: 2, class: "9-А", subject: "фізика", room: "каб-9" },
    ],
    substitutions: [],
    attempts: [],
  };

  // вт, урок 3 у 3 класі = 11:45-12:30
  const slot = {
    id: "s",
    date: "2026-09-08",
    start: "11:45",
    end: "12:30",
    lesson: 3,
    class: "3",
    absentTeacherId: "absent-primary",
    mode: "urgent" as const,
    status: "open" as const,
    officialCalendarUpdated: false,
  };

  function allCandidates(sub: typeof slot) {
    const result = rankCandidates(state, sub);
    return [1, 2, 3, 4, 5, 6].flatMap((t) => ids(result.tiers[t as 1]));
  }

  it("вчитель із власним уроком у ЦЕЙ ЧАС не потрапляє в кандидати, попри інший номер уроку", () => {
    // 11:45-12:30 проти 11:05-11:50 — спільні лише 5 хвилин, але це конфлікт
    const all = allCandidates(slot);
    expect(all).not.toContain("busy-senior");
    expect(all).toContain("free-teacher");
  });

  it("на урок, що НЕ перетинається в часі, той самий вчитель доступний", () => {
    const all = allCandidates({ ...slot, start: "10:00", end: "10:45", lesson: 1 });
    expect(all).toContain("busy-senior");
  });

  it("присутність звіряється з реальним часом слоту", () => {
    const late = {
      ...state,
      teachers: teachers.map((t) =>
        t.id === "free-teacher" ? { ...t, presence: [{ weekday: 2, from: "12:00", to: "16:00" }] } : t
      ),
    };
    // 11:45-12:30 не вкладається в 12:00-16:00 -> не присутній (тир 4 -> 6)
    expect(ids(rankCandidates(late, slot).tiers[6])).toContain("free-teacher");
  });
});
