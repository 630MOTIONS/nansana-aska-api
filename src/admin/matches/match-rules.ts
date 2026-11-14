// A date-time that MUST carry a time zone, for example
// 2026-11-07T19:30:00+03:00. Without a zone the server would guess its own.
export const KICKOFF_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/;

export function parseKickoff(value: string): Date | null {
  if (!KICKOFF_PATTERN.test(value)) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

// The calendar date in Uganda (UTC+3, no daylight saving), as YYYY-MM-DD.
// Used to build readable match slugs.
export function kampalaDate(date: Date): string {
  return new Date(date.getTime() + 3 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}
