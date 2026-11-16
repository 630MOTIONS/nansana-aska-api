import { describe, expect, it } from "vitest";
import { detectImageType } from "./image.js";

describe("detectImageType", () => {
  it("recognises a PNG", () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
    expect(detectImageType(png)).toBe("image/png");
  });

  it("recognises a JPEG", () => {
    expect(detectImageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
  });

  it("recognises a WebP", () => {
    const webp = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
    ]);
    expect(detectImageType(webp)).toBe("image/webp");
  });

  it("rejects SVG and other files", () => {
    const svg = new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'></svg>");
    expect(detectImageType(svg)).toBeNull();
    expect(detectImageType(new Uint8Array([1, 2, 3]))).toBeNull();
    expect(detectImageType(new Uint8Array())).toBeNull();
  });
});
