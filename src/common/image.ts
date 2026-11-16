// Logos are small: 500 KB is plenty for a crest and keeps the database lean.
export const MAX_LOGO_BYTES = 512 * 1024;

export type LogoType = "image/png" | "image/jpeg" | "image/webp";

// Decides the type from the file's first bytes, never from its name or from
// what the browser says. SVG is deliberately not allowed: it can contain
// scripts.
export function detectImageType(bytes: Uint8Array): LogoType | null {
  const startsWith = (signature: number[], offset = 0) =>
    signature.every((byte, index) => bytes[offset + index] === byte);

  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return "image/png";
  }
  if (startsWith([0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith([0x52, 0x49, 0x46, 0x46]) && startsWith([0x57, 0x45, 0x42, 0x50], 8)) {
    return "image/webp";
  }
  return null;
}
