/**
 * Helpers for HTML `datetime-local` inputs (local wall time ↔ UTC ISO for the server).
 */

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Converts a UTC ISO timestamp (e.g. from DB) to `YYYY-MM-DDTHH:mm` in the user's local timezone
 * for `<input type="datetime-local" />`.
 */
export function utcIsoToDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "";
  }
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  const h = pad2(d.getHours());
  const min = pad2(d.getMinutes());
  return `${y}-${m}-${day}T${h}:${min}`;
}

/**
 * Parses a `datetime-local` value using the **runtime default timezone** (e.g. server = often UTC).
 * Do **not** use for persisting user-entered diary times — use `datetime-local-tz.ts` instead.
 * Returns `null` if empty or not a valid date.
 */
export function datetimeLocalToUtcIso(local: string): string | null {
  const t = local.trim();
  if (t.length === 0) {
    return null;
  }
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  return d.toISOString();
}

/** Default value for `<input type="datetime-local" />` from a `Date` (e.g. “now”). */
export function formatDatetimeLocalValue(date: Date): string {
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return utcIsoToDatetimeLocalValue(date.toISOString());
}

/** Prefill `datetime-local` from a stored UTC ISO string (e.g. DB row). */
export function formatDatetimeLocalFromIso(iso: string): string {
  return utcIsoToDatetimeLocalValue(iso);
}
