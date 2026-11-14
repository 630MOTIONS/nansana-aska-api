export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// "Women’s Cup 2026/27" -> "womens-cup-2026-27"
export function slugify(input: string, maxLength = 60): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’`]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/g, "");
}
