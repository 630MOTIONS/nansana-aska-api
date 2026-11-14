import { describe, expect, it } from "vitest";
import { kampalaDate, parseKickoff } from "./match-rules.js";

describe("parseKickoff", () => {
  it("reads a time with an offset as the right moment", () => {
    expect(parseKickoff("2026-11-07T19:30:00+03:00")?.toISOString()).toBe(
      "2026-11-07T16:30:00.000Z",
    );
  });

  it("accepts Z and times without seconds", () => {
    expect(parseKickoff("2026-11-07T16:30Z")?.toISOString()).toBe(
      "2026-11-07T16:30:00.000Z",
    );
  });

  it("rejects a time without a time zone", () => {
    expect(parseKickoff("2026-11-07T19:30:00")).toBeNull();
  });

  it("rejects text that is not a date", () => {
    expect(parseKickoff("tomorrow evening")).toBeNull();
  });
});

describe("kampalaDate", () => {
  it("uses the Uganda calendar day, not the UTC one", () => {
    expect(kampalaDate(new Date("2026-11-07T22:30:00Z"))).toBe("2026-11-08");
    expect(kampalaDate(new Date("2026-11-07T16:30:00Z"))).toBe("2026-11-07");
  });
});
