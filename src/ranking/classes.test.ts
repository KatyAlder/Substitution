import { describe, expect, it } from "vitest";
import { classesOverlap, splitClassLabel } from "./classes";

describe("splitClassLabel", () => {
  it("лишає звичайний клас із літерою одним елементом", () => {
    expect(splitClassLabel("9-А")).toEqual(["9-А"]);
    expect(splitClassLabel("11")).toEqual(["11"]);
  });

  it("розбиває числовий діапазон через дефіс", () => {
    expect(splitClassLabel("5-6")).toEqual(["5", "6"]);
    expect(splitClassLabel("5-6-7")).toEqual(["5", "6", "7"]);
  });

  it("розбиває через слеш, зокрема класи з літерами", () => {
    expect(splitClassLabel("9-А/9-Б")).toEqual(["9-А", "9-Б"]);
    expect(splitClassLabel("5 / 6")).toEqual(["5", "6"]);
  });

  it("прибирає дублікати й порожні частини", () => {
    expect(splitClassLabel("5//5")).toEqual(["5"]);
  });

  it("не ламається на порожній мітці", () => {
    expect(splitClassLabel("")).toEqual([""]);
  });
});

describe("classesOverlap", () => {
  it("бачить спільний клас у спареній мітці", () => {
    expect(classesOverlap("5-6", "6")).toBe(true);
    expect(classesOverlap("6", "5-6")).toBe(true);
    expect(classesOverlap("9-А/9-Б", "9-Б")).toBe(true);
  });

  it("не плутає різні класи", () => {
    expect(classesOverlap("5-6", "7")).toBe(false);
    expect(classesOverlap("9-А", "9-Б")).toBe(false);
  });

  it("дефіс у звичайній мітці не робить її спареною", () => {
    expect(classesOverlap("9-А", "9")).toBe(false);
    expect(classesOverlap("9-А", "А")).toBe(false);
  });
});
