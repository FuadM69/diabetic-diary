/**
 * Lower bounds for log/export date filters (glucose `measured_at`, insulin `taken_at`, meals `eaten_at`).
 *
 * **"today"** uses the user’s calendar day in `user_settings.timezone` when valid; otherwise the
 * runtime default IANA zone from `Intl` (often UTC on serverless — users should set timezone in settings).
 *
 * **Saved values like `UTC+3` / `GMT+3` are not valid IANA IDs for `Intl`** on Node/V8; we map them
 * to fixed-offset `Etc/GMT±N` (see `tryMapUtcOffsetLabelToIana`).
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

/** Dev or `DIARY_LOG_RANGE_DEBUG=1` on the server (no `NEXT_PUBLIC_` — not exposed to client bundles by default). */
export function isDiaryLogRangeDebugEnabled(): boolean {
  return (
    process.env.DIARY_LOG_RANGE_DEBUG === "1" ||
    process.env.NODE_ENV === "development"
  );
}

/** Wall-clock calendar parts for an instant in an IANA time zone (used by log ranges and datetime-local → UTC). */
export function readZonedWallClockParts(date: Date, timeZone: string) {
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
  const p = readZonedWallClockParts(date, timeZone);
  return (
    calendarSortKey(p.year, p.month, p.day) -
    calendarSortKey(targetY, targetM, targetD)
  );
}

/**
 * UTC instant when the calendar date in `timeZone` first becomes the same local calendar day as `now`
 * (local midnight / start of that day in that zone).
 *
 * Brackets around UTC noon on the same **Gregorian** Y-M-D as the zoned “today” (±36h), then binary search.
 * Example: `Europe/Moscow`, local date 2026-04-08 → lower bound `2026-04-07T21:00:00.000Z` (MSK = UTC+3).
 */
export function startOfZonedCalendarDayUtc(now: Date, timeZone: string): Date {
  const p = readZonedWallClockParts(now, timeZone);
  const Y = p.year;
  const M = p.month;
  const D = p.day;

  const utcNoonOnGregorianDate = Date.UTC(Y, M - 1, D, 12, 0, 0, 0);
  let lo = utcNoonOnGregorianDate - 36 * 3600000;
  let hi = utcNoonOnGregorianDate + 36 * 3600000;

  while (compareZonedDayToTarget(new Date(lo), timeZone, Y, M, D) >= 0) {
    lo -= 3600000;
  }
  while (compareZonedDayToTarget(new Date(hi), timeZone, Y, M, D) < 0) {
    hi += 3600000;
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
 * `UTC+3` / `GMT-5` style labels are not valid `timeZone` values in V8; map to fixed-hour `Etc/GMT±N`.
 * IANA `Etc/GMT` signs are inverted vs “UTC±”: `UTC+3` → `Etc/GMT-3`.
 */
export function tryMapUtcOffsetLabelToIana(input: string): string | null {
  const compact = input.trim().replace(/\s+/g, " ");
  const m = compact.match(/^(?:UTC|GMT)\s*([+-])\s*(\d{1,2})(?::(\d{2}))?$/i);
  if (!m) {
    return null;
  }
  const hours = Number.parseInt(m[2], 10);
  const mins = m[3] != null ? Number.parseInt(m[3], 10) : 0;
  if (
    !Number.isFinite(hours) ||
    hours < 0 ||
    hours > 14 ||
    !Number.isFinite(mins) ||
    mins < 0 ||
    mins > 59
  ) {
    return null;
  }
  if (mins !== 0) {
    return null;
  }
  const sign = m[1];
  const ianaSign = sign === "+" ? "-" : "+";
  return `Etc/GMT${ianaSign}${hours}`;
}

export type LogRangeTimezoneResolution =
  | "saved_iana"
  | "mapped_utc_offset"
  | "host_fallback";

export type LogRangeTimezoneInfo = {
  savedRaw: string | null;
  savedTrimmed: string | null;
  savedAcceptedByIntl: boolean;
  mappedFromOffsetLabel: string | null;
  resolvedTimeZone: string;
  resolution: LogRangeTimezoneResolution;
  hostDefaultTimeZone: string;
};

export function explainLogRangeTimeZone(
  savedTimezone: string | null | undefined
): LogRangeTimezoneInfo {
  const hostDefaultTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const savedRaw =
    savedTimezone === undefined || savedTimezone === null
      ? null
      : savedTimezone;
  const savedTrimmed =
    typeof savedTimezone === "string" ? savedTimezone.trim() : null;
  if (!savedTrimmed) {
    return {
      savedRaw,
      savedTrimmed: null,
      savedAcceptedByIntl: false,
      mappedFromOffsetLabel: null,
      resolvedTimeZone: hostDefaultTimeZone,
      resolution: "host_fallback",
      hostDefaultTimeZone,
    };
  }
  if (isLikelyValidIanaTimeZone(savedTrimmed)) {
    return {
      savedRaw,
      savedTrimmed,
      savedAcceptedByIntl: true,
      mappedFromOffsetLabel: null,
      resolvedTimeZone: savedTrimmed,
      resolution: "saved_iana",
      hostDefaultTimeZone,
    };
  }
  const mapped = tryMapUtcOffsetLabelToIana(savedTrimmed);
  if (mapped && isLikelyValidIanaTimeZone(mapped)) {
    return {
      savedRaw,
      savedTrimmed,
      savedAcceptedByIntl: false,
      mappedFromOffsetLabel: mapped,
      resolvedTimeZone: mapped,
      resolution: "mapped_utc_offset",
      hostDefaultTimeZone,
    };
  }
  return {
    savedRaw,
    savedTrimmed,
    savedAcceptedByIntl: false,
    mappedFromOffsetLabel: mapped,
    resolvedTimeZone: hostDefaultTimeZone,
    resolution: "host_fallback",
    hostDefaultTimeZone,
  };
}

/**
 * Prefer saved IANA zone, or mapped `UTC±N` / `GMT±N`, else host/runtime default from `Intl`.
 */
export function resolveLogRangeTimeZone(
  savedTimezone: string | null | undefined
): string {
  return explainLogRangeTimeZone(savedTimezone).resolvedTimeZone;
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

export type LogRangeDebugPayload = {
  range: GlucoseRangeKey;
  serverNowIso: string;
  zonedNowInResolvedZone: ReturnType<typeof readZonedWallClockParts>;
  timezone: LogRangeTimezoneInfo;
  /** Lower bound for the **active** URL range. */
  activeRangeLowerBoundIso: string | null;
  /** Always the “today” bound for the same clock + timezone options (handy when range ≠ today). */
  todayLowerBoundIso: string | null;
  /** Value passed to `getGlucoseEntries` / `.gte("measured_at", …)`. */
  queryMeasuredAtGte: string | null;
  loadedMeasuredAtValues: string[];
  hints: string[];
};

export function buildLogRangeDebugPayload(
  range: GlucoseRangeKey,
  options: LogRangeBoundOptions | undefined,
  queryMeasuredAtGte: string | null,
  loadedMeasuredAtValues: string[]
): LogRangeDebugPayload {
  const now = options?.now ?? new Date();
  const tzInfo = explainLogRangeTimeZone(options?.timezone ?? null);
  const activeRangeLowerBoundIso = getLogRangeMeasuredAtLowerBound(range, options);
  const todayLowerBoundIso = getLogRangeMeasuredAtLowerBound("today", options);
  const zonedNowInResolvedZone = readZonedWallClockParts(
    now,
    tzInfo.resolvedTimeZone
  );

  const hints: string[] = [
    "mapped_utc_offset: labels like UTC+3/GMT+3 are mapped to IANA Etc/GMT-* (Intl does not accept UTC+3 as a timeZone id).",
    "host_fallback: saved timezone is not a valid IANA id and was not mapped; using the server host zone (often UTC on Netlify).",
    "If entries still look wrong, check measured_at: datetime-local is parsed on the server in the server default zone unless the app uses the user zone when saving.",
  ];

  return {
    range,
    serverNowIso: now.toISOString(),
    zonedNowInResolvedZone,
    timezone: tzInfo,
    activeRangeLowerBoundIso,
    todayLowerBoundIso,
    queryMeasuredAtGte,
    loadedMeasuredAtValues,
    hints,
  };
}

export function logLogRangeDebugToConsole(
  scope: string,
  payload: LogRangeDebugPayload
): void {
  if (!isDiaryLogRangeDebugEnabled()) {
    return;
  }
  console.log(`[diary:log-range:${scope}]`, JSON.stringify(payload, null, 2));
}
