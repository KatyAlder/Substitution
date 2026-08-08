import { describe, expect, it } from "vitest";
import type { AppState } from "../types/state";
import { pickNewer } from "./pickNewer";

function makeState(updatedAt: number | undefined): AppState {
  return {
    version: 1,
    updatedAt: "2026-09-05",
    bells: [],
    teachers: [],
    schedule: [],
    substitutions: [],
    attempts: [],
    meta: updatedAt === undefined ? undefined : { updatedAt },
  };
}

describe("pickNewer", () => {
  it("обирає віддалений стан, якщо він новіший", () => {
    const local = makeState(100);
    const remote = makeState(200);
    expect(pickNewer(local, remote)).toBe(remote);
  });

  it("лишає локальний стан, якщо він новіший", () => {
    const local = makeState(300);
    const remote = makeState(200);
    expect(pickNewer(local, remote)).toBe(local);
  });

  it("трактує відсутню мітку часу як 0", () => {
    const local = makeState(undefined);
    const remote = makeState(1);
    expect(pickNewer(local, remote)).toBe(remote);
  });

  it("за однакових міток лишається на локальному", () => {
    const local = makeState(100);
    const remote = makeState(100);
    expect(pickNewer(local, remote)).toBe(local);
  });
});
