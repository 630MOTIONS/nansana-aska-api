export const trim = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

// For optional text that an editor can clear: "" becomes null.
export const trimOrNull = ({ value }: { value: unknown }) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};
