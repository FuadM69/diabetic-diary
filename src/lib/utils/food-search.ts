const MAX_QUERY_LEN = 80;

/** Read `q` from URL; safe trimmed string for UI + DB ilike (pattern chars stripped). */
export function parseFoodSearchParam(
  raw: string | string[] | undefined
): string {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (typeof v !== "string") {
    return "";
  }
  return sanitizeFoodSearchIlikePattern(v).slice(0, MAX_QUERY_LEN);
}

/**
 * Remove `%`, `_`, `\` from user input so ilike cannot be abused as a pattern.
 */
export function sanitizeFoodSearchIlikePattern(raw: string): string {
  return raw
    .trim()
    .replace(/[%_\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
