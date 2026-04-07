/**
 * Lower bounds for log/export date filters (glucose `measured_at`, insulin `taken_at`, meals `eaten_at`).
 *
 * **"today"** uses the user’s calendar day in `user_settings.timezone` when valid; otherwise the
 * runtime default IANA zone from `Intl` (often UTC on serverless — users should set timezone in settings).
 *
 * Rolling windows **7d / 14d / 30d** stay as UTC ms offsets from `now` (unchanged).
 */
import type { GlucoseRangeKey } from "@/lib/types/glucose";

export type LogRangeBoundOptions = {
  /** IANA zone from `user_settings.timezone` (e.g. `Europe/Moscow`). */
  timezone?: string | null;
  /** Clock for tests; defaults to `new Date()`. */
  now?: Date;
};

function readZonedCalendarParts(date: Date, timeZone: string) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(date);
  const o: Record<string, number> = {};
  for (const p of parts) {
    if (p.type !== "literal") {
      o[p.type] = Number(p.value);
    }
  }
  return {
    year: o.year,
    month: o.month,
    day: o.day,
    hour: o.hour,
    minute: o.minute,
    second: o.second,
  };
}

function calendarSortKey(y: number, m: number, d: number): number {
  return y * 10000 + m * 100 + d;
}

/**
 * Negative if `date` falls on a calendar day before `targetY/M/D` in `timeZone`, zero if same day,
 * positive if after.
 */
function compareZonedDayToTarget(
  date: Date,
  timeZone: string,
  targetY: number,
  targetM: number,
  targetD: number
): number {
  const p = readZonedCalendarParts(date, timeZone);
  return (
    calendarSortKey(p.year, p.month, p.day) -
    calendarSortKey(targetY, targetM, targetD)
  );
}

/**
 * UTC instant when the calendar date in `timeZone` first becomes the same local calendar day as `now`
 * (local midnight / start of that day in that zone).
 */
export function startOfZonedCalendarDayUtc(now: Date, timeZone: string): Date {
  const p = readZonedCalendarParts(now, timeZone);
  const Y = p.year;
  const M = p.month;
  const D = p.day;

  let lo = now.getTime() - 3 * 86_400_000;
  let hi = now.getTime() + 3 * 86_400_000;

  while (compareZonedDayToTarget(new Date(lo), timeZone, Y, M, D) >= 0) {
    lo -= 86_400_000;
  }
  while (compareZonedDayToTarget(new Date(hi), timeZone, Y, M, D) < 0) {
    hi += 86_400_000;
  }

  while (lo + 1 < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (compareZonedDayToTarget(new Date(mid), timeZone, Y, M, D) >= 0) {
      hi = mid;
    } else {
      lo = mid;
    }
  }

  return new Date(hi);
}

export function isLikelyValidIanaTimeZone(timeZone: string): boolean {
  const t = timeZone.trim();
  if (t.length === 0) {
    return false;
  }
  try {
    Intl.DateTimeFormat(undefined, { timeZone: t }).format(new Date(0));
    return true;
  } catch {
    return false;
  }
}

/**
 * Prefer saved IANA zone; otherwise host/runtime default from `Intl` (documented fallback for SSR).
 */
export function resolveLogRangeTimeZone(
  savedTimezone: string | null | undefined
): string {
  if (savedTimezone && isLikelyValidIanaTimeZone(savedTimezone)) {
    return savedTimezone.trim();
  }
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Inclusive lower bound for timestamp columns (ISO UTC), or `null` for `"all"`.
 */
export function getLogRangeMeasuredAtLowerBound(
  range: GlucoseRangeKey,
  options?: LogRangeBoundOptions
): string | null {
  const now = options?.now ?? new Date();

  if (range === "all") {
    return null;
  }

  if (range === "today") {
    const tz = resolveLogRangeTimeZone(options?.timezone ?? null);
    return startOfZonedCalendarDayUtc(now, tz).toISOString();
  }

  const days = range === "7d" ? 7 : range === "14d" ? 14 : 30;
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return cutoff.toISOString();
}
