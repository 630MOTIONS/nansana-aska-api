import { describe, expect, it } from "vitest";
import { parseVideoUrl } from "./video-url.js";

const canonical = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

describe("parseVideoUrl", () => {
  it("recognises the usual YouTube spellings and cleans them up", () => {
    for (const link of [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=43s",
      "https://youtu.be/dQw4w9WgXcQ?si=abc",
      "https://m.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://www.youtube.com/shorts/dQw4w9WgXcQ",
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
      "https://www.youtube.com/live/dQw4w9WgXcQ?feature=share",
    ]) {
      expect(parseVideoUrl(link)).toEqual({
        url: canonical,
        youtubeId: "dQw4w9WgXcQ",
      });
    }
  });

  it("keeps other sites as they are, without a YouTube id", () => {
    const result = parseVideoUrl("https://www.facebook.com/watch/?v=123456");
    expect(result?.youtubeId).toBeNull();
    expect(result?.url).toContain("facebook.com");
  });

  it("rejects links that are not https web addresses", () => {
    expect(parseVideoUrl("http://example.com/video")).toBeNull();
    expect(parseVideoUrl("javascript:alert(1)")).toBeNull();
    expect(parseVideoUrl("not a link")).toBeNull();
    expect(parseVideoUrl("https://localhost/x")).toBeNull();
  });

  it("does not treat a malformed YouTube id as one", () => {
    expect(parseVideoUrl("https://www.youtube.com/watch?v=short")?.youtubeId).toBeNull();
  });
});
