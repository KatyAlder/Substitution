import { describe, expect, it } from "vitest";
import { seedState } from "../data/seed";
import { findDate, findLessonNumber, findTeacherMatches, findTime, findWholeDay, parseMessage } from "./parseRequest";

const teachers = seedState.teachers;
const REF = "2026-09-07"; // понеділок

function ids(list: { id: string }[]): string[] {
  return list.map((t) => t.id);
}

describe("findTeacherMatches", () => {
  it("однозначне прізвище знаходить одного вчителя, зайвий текст не заважає", () => {
    expect(ids(findTeacherMatches("Заміни Ткаченко Ігорю на вівторок на 10:50", teachers))).toEqual([
      "tkachenko-ihor",
    ]);
  });

  it("відмінкове закінчення зверху (токен довший за словникову форму) усе одно збігається", () => {
    expect(ids(findTeacherMatches("Заміни Мельник Тарасу на вівторок на 9:00", teachers))).toEqual([
      "melnyk-taras",
    ]);
  });

  it("кілька прізвищ у тексті — кілька збігів", () => {
    expect(ids(findTeacherMatches("Заміни Мельник і Кравець на вівторок на 9:00", teachers)).sort()).toEqual(
      ["kravets-maryna", "melnyk-taras"].sort()
    );
  });

  it("невідоме прізвище — жодного збігу", () => {
    expect(findTeacherMatches("Заміни Іванову на вівторок на 8:00", teachers)).toEqual([]);
  });

  it("короткі прийменники не дають хибних збігів (менші за MIN_NAME_TOKEN_LENGTH)", () => {
    expect(findTeacherMatches("Потрібна заміна на завтра на 15:00", teachers)).toEqual([]);
  });
});

describe("findDate", () => {
  it("'сьогодні' -> referenceDate", () => {
    expect(findDate("заміна сьогодні", REF)).toBe(REF);
  });

  it("'завтра' -> referenceDate + 1", () => {
    expect(findDate("заміна завтра", REF)).toBe("2026-09-08");
  });

  it("день тижня -> найближча дата, рахуючи сьогодні як можливий найближчий", () => {
    expect(findDate("на вівторок", REF)).toBe("2026-09-08");
    expect(findDate("на понеділок", REF)).toBe(REF); // сьогодні й так понеділок
    expect(findDate("на середу", REF)).toBe("2026-09-09");
  });

  it("'число місяць' у родовому відмінку", () => {
    expect(findDate("на 2 вересня", REF)).toBe("2026-09-02");
  });

  it("пріоритет: сьогодні > завтра > день тижня > число+місяць", () => {
    expect(findDate("сьогодні чи завтра, чи у вівторок", REF)).toBe(REF);
    expect(findDate("завтра чи у вівторок", REF)).toBe("2026-09-08");
  });

  it("нічого не знайдено — undefined", () => {
    expect(findDate("просто текст без дати", REF)).toBeUndefined();
  });
});

describe("findWholeDay / findTime / findLessonNumber", () => {
  it("'на весь день' незалежно від регістру", () => {
    expect(findWholeDay("Заміни Кравець на вівторок на весь день")).toBe(true);
    expect(findWholeDay("НА ВЕСЬ ДЕНЬ")).toBe(true);
    expect(findWholeDay("на вівторок на 9:00")).toBe(false);
  });

  it("час у форматі ЧЧ:ММ, з доповненням нуля", () => {
    expect(findTime("на 10:50")).toBe("10:50");
    expect(findTime("на 9:00")).toBe("09:00");
    expect(findTime("без часу")).toBeUndefined();
  });

  it("номер уроку в обидва боки", () => {
    expect(findLessonNumber("урок 3")).toBe(3);
    expect(findLessonNumber("на уроку 3")).toBe(3);
    expect(findLessonNumber("3 урок")).toBe(3);
    expect(findLessonNumber("3-й урок")).toBe(3);
    expect(findLessonNumber("без уроку")).toBeUndefined();
  });
});

describe("parseMessage", () => {
  it("збирає всі складові разом на прикладі з ТЗ-подібного повідомлення", () => {
    const result = parseMessage("Заміни Мельник Тарасу на вівторок на 9:00", teachers, REF);
    expect(result).toEqual({
      teacherMatches: [teachers.find((t) => t.id === "melnyk-taras")],
      date: "2026-09-08",
      wholeDay: false,
      lesson: undefined,
      time: "09:00",
    });
  });

  it("'на весь день' без часу/уроку", () => {
    const result = parseMessage("Заміни Кравець на вівторок на весь день", teachers, REF);
    expect(result.wholeDay).toBe(true);
    expect(result.time).toBeUndefined();
    expect(result.lesson).toBeUndefined();
    expect(ids(result.teacherMatches)).toEqual(["kravets-maryna"]);
  });
});
