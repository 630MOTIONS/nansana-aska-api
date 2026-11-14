import { describe, expect, it } from "vitest";
import { SLUG_PATTERN, slugify } from "./slug.js";

describe("slugify", () => {
  it("makes lower-case hyphenated slugs", () => {
    expect(slugify("Nansana ASKA")).toBe("nansana-aska");
  });

  it("drops apostrophes and punctuation", () => {
    expect(slugify("Women’s Cup 2026/27")).toBe("womens-cup-2026-27");
  });

  it("removes accents", () => {
    expect(slugify("Café Müller")).toBe("cafe-muller");
  });

  it("returns an empty string when nothing usable is left", () => {
    expect(slugify("!!!")).toBe("");
  });

  it("produces slugs that match SLUG_PATTERN", () => {
    expect(SLUG_PATTERN.test(slugify("Kabowa Dream Team"))).toBe(true);
    expect(SLUG_PATTERN.test("Bad Slug")).toBe(false);
  });
});
