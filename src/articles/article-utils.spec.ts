import { describe, expect, it } from "vitest";
import {
  extractMediaIds,
  missingForPublish,
  normalizeBody,
  readMinutes,
} from "./article-utils.js";

describe("readMinutes", () => {
  it("is at least one minute", () => {
    expect(readMinutes("")).toBe(1);
    expect(readMinutes("a few words")).toBe(1);
  });

  it("counts about 200 words a minute", () => {
    expect(readMinutes(Array(1000).fill("word").join(" "))).toBe(5);
  });
});

describe("normalizeBody", () => {
  it("makes line endings consistent and trims the end", () => {
    expect(normalizeBody("one\r\ntwo\r\n\r\n")).toBe("one\ntwo");
  });
});

describe("missingForPublish", () => {
  const ready = {
    title: "A good title",
    excerpt: "A short summary.",
    body: "This is the article text, long enough.",
  };

  it("accepts a complete article", () => {
    expect(missingForPublish(ready)).toBeNull();
  });

  it("asks for a summary and for text", () => {
    expect(missingForPublish({ ...ready, excerpt: "short" })).toMatch(/summary/);
    expect(missingForPublish({ ...ready, body: "tiny" })).toMatch(/article text/);
  });
});

describe("extractMediaIds", () => {
  it("finds each photo once", () => {
    const body =
      "![a](/media/abc123) text ![b](/media/def456) ![again](/media/abc123)";
    expect(extractMediaIds(body).sort()).toEqual(["abc123", "def456"]);
  });

  it("finds none in plain text", () => {
    expect(extractMediaIds("no images here")).toEqual([]);
  });
});
