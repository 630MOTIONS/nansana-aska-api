// Prisma's "unique constraint failed" error code, without depending on the
// error class (so it also works with driver adapters).
export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}
