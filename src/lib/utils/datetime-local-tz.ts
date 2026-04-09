/**
 * Interpret HTML `datetime-local` strings as wall time in the user’s configured IANA zone,
 * then convert to UTC ISO for storage (not `new Date(string)` on the server).
 */
import {
  explainLogRangeTimeZone,
  isDiaryLogRangeDebugEnabled,
  isLikelyValidIanaTimeZone,
  readZonedWallClockParts,
} from "@/lib/utils/log-range-bounds";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Format a UTC instant as `YYYY-MM-DDTHH:mm` wall time in `ianaTimeZone`
 * (matches what {@link datetimeLocalInUserTimezoneToUtcIso} expects on submit).
 */
export function utcInstantToDatetimeLocalInTimezone(
  utcDate: Date,
  ianaTimeZone: string
): string | null {
  if (!isLikelyValidIanaTimeZone(ianaTimeZone)) {
    return null;
  }
  const p = readZonedWallClockParts(utcDate, ianaTimeZone);
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)}T${pad2(p.hour)}:${pad2(p.minute)}`;
}

export type DatetimeLocalForUserSettingsResult =
  | { ok: true; value: string }
  | { ok: false; message: string };

/**
 * Current time as `datetime-local` string in the user’s saved timezone (for form defaults).
 */
export function defaultDatetimeLocalForUserSettings(
  savedTimezone: string | null | undefined,
  now: Date = new Date()
): DatetimeLocalForUserSettingsResult {
  const tzRes = resolveTimezoneForFormDatetime(savedTimezone);
  if (!tzRes.ok) {
    const fallback =
      tzRes.reason === "missing"
        ? "Укажите часовой пояс в настройках профиля — без него время в форме нельзя согласовать с сервером."
        : "Часовой пояс в настройках не распознан. Используйте IANA (например, Europe/Moscow) или формат UTC+3.";
    return { ok: false, message: fallback };
  }
  const local = utcInstantToDatetimeLocalInTimezone(now, tzRes.iana);
  if (local == null) {
    return {
      ok: false,
      message:
        "Не удалось вычислить местное время для вашего часового пояса. Проверьте настройки.",
    };
  }
  return { ok: true, value: local };
}

/** Stored UTC ISO → `datetime-local` digits in the user’s saved timezone (editing). */
export function utcIsoToDatetimeLocalInUserTimezone(
  iso: string,
  savedTimezone: string | null | undefined
): DatetimeLocalForUserSettingsResult {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return { ok: false, message: "Некорректная дата записи." };
  }
  const tzRes = resolveTimezoneForFormDatetime(savedTimezone);
  if (!tzRes.ok) {
    const fallback =
      tzRes.reason === "missing"
        ? "Укажите часовой пояс в настройках профиля."
        : "Часовой пояс в настройках не распознан.";
    return { ok: false, message: fallback };
  }
  const local = utcInstantToDatetimeLocalInTimezone(d, tzRes.iana);
  if (local == null) {
    return {
      ok: false,
      message: "Не удалось отобразить время для вашего часового пояса.",
    };
  }
  return { ok: true, value: local };
}

/** Matches diary list cards; explicit 24h for visible UI. */
const USER_DISPLAY_DATETIME_DEFAULTS = {
  dateStyle: "medium" as const,
  timeStyle: "short" as const,
  hour12: false as const,
};

const DATE_TIME_FORMAT_OPTION_KEYS = new Set<keyof Intl.DateTimeFormatOptions>([
  "localeMatcher",
  "calendar",
  "numberingSystem",
  "hour12",
  "hourCycle",
  "timeZone",
  "weekday",
  "era",
  "year",
  "month",
  "day",
  "dayPeriod",
  "hour",
  "minute",
  "second",
  "fractionalSecondDigits",
  "timeZoneName",
  "formatMatcher",
  "dateStyle",
  "timeStyle",
]);

function sanitizeDateTimeFormatOptions(
  options: Intl.DateTimeFormatOptions
): Intl.DateTimeFormatOptions {
  const safe: Intl.DateTimeFormatOptions = {};
  for (const [key, value] of Object.entries(options)) {
    if (DATE_TIME_FORMAT_OPTION_KEYS.has(key as keyof Intl.DateTimeFormatOptions)) {
      (safe as Record<string, unknown>)[key] = value;
    }
  }
  return safe;
}

/**
 * Human-readable date/time for diary UI (cards, lists, exports) using the user’s
 * **saved** timezone when it resolves; otherwise same fallback as legacy
 * `formatGlucoseDate` (runtime locale, no fixed IANA).
 */
export function formatUtcIsoForUserDisplay(
  iso: string,
  savedTimezone: string | null | undefined,
  options: Intl.DateTimeFormatOptions = USER_DISPLAY_DATETIME_DEFAULTS
): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso;
  }
  const safeOptions = sanitizeDateTimeFormatOptions(options);
  const tzRes = resolveTimezoneForFormDatetime(savedTimezone);
  try {
    if (!tzRes.ok) {
      return new Intl.DateTimeFormat(undefined, safeOptions).format(d);
    }
    return new Intl.DateTimeFormat(undefined, {
      ...safeOptions,
      timeZone: tzRes.iana,
    }).format(d);
  } catch {
    if (!tzRes.ok) {
      return new Intl.DateTimeFormat(undefined, USER_DISPLAY_DATETIME_DEFAULTS).format(d);
    }
    return new Intl.DateTimeFormat(undefined, {
      ...USER_DISPLAY_DATETIME_DEFAULTS,
      timeZone: tzRes.iana,
    }).format(d);
  }
}

type WallParts = ReturnType<typeof readZonedWallClockParts>;

function compareWallParts(a: WallParts, b: WallParts): number {
  const keys: (keyof WallParts)[] = [
    "year",
    "month",
    "day",
    "hour",
    "minute",
    "second",
  ];
  for (const key of keys) {
    if (a[key] !== b[key]) return a[key] - b[key];
  }
  return 0;
}

const DATETIME_LOCAL_RE =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?$/;

function parseDatetimeLocalToWallParts(
  trimmed: string
): { ok: true; parts: WallParts } | { ok: false } {
  const m = trimmed.match(DATETIME_LOCAL_RE);
  if (!m) {
    return { ok: false };
  }
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const hour = Number(m[4]);
  const minute = Number(m[5]);
  const second = m[6] != null ? Number(m[6]) : 0;
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hour) ||
    !Number.isFinite(minute) ||
    !Number.isFinite(second)
  ) {
    return { ok: false };
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return { ok: false };
  }
  if (hour > 23 || minute > 59 || second > 59) {
    return { ok: false };
  }
  return {
    ok: true,
    parts: { year, month, day, hour, minute, second },
  };
}

/**
 * UTC instant for the given wall time in `timeZone` (earlier instant if DST is ambiguous).
 */
function wallTimeInZoneToUtc(
  target: WallParts,
  timeZone: string
): { ok: true; utc: Date } | { ok: false; code: "invalid_zone" | "nonexistent" } {
  if (!isLikelyValidIanaTimeZone(timeZone)) {
    return { ok: false, code: "invalid_zone" };
  }

  const cmpAt = (utcMs: number): number => {
    const p = readZonedWallClockParts(new Date(utcMs), timeZone);
    return compareWallParts(p, target);
  };

  const guess = Date.UTC(
    target.year,
    target.month - 1,
    target.day,
    target.hour,
    target.minute,
    target.second
  );

  let lo = guess - 72 * 3600000;
  let hi = guess + 72 * 3600000;

  while (cmpAt(lo) >= 0) lo -= 3600000;
  while (cmpAt(hi) < 0) hi += 3600000;

  while (lo + 1 < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (cmpAt(mid) >= 0) hi = mid;
    else lo = mid;
  }

  if (cmpAt(hi) !== 0) {
    return { ok: false, code: "nonexistent" };
  }

  let lo2 = lo;
  let hi2 = hi;
  while (lo2 + 1 < hi2) {
    const mid = Math.floor((lo2 + hi2) / 2);
    if (cmpAt(mid) === 0) hi2 = mid;
    else lo2 = mid;
  }
  const earliestMs = cmpAt(lo2) === 0 ? lo2 : hi2;
  return { ok: true, utc: new Date(earliestMs) };
}

export function resolveTimezoneForFormDatetime(
  savedTimezone: string | null | undefined
):
  | { ok: true; iana: string }
  | { ok: false; reason: "missing" | "invalid"; message: string } {
  const info = explainLogRangeTimeZone(savedTimezone);
  if (!info.savedTrimmed) {
    return { ok: true, iana: info.resolvedTimeZone };
  }
  if (info.resolution === "host_fallback") {
    return {
      ok: false,
      reason: "invalid",
      message:
        "Часовой пояс в настройках не распознан. Используйте IANA (например, Europe/Moscow) или формат UTC+3.",
    };
  }
  return { ok: true, iana: info.resolvedTimeZone };
}

export type DatetimeLocalTzMessages = {
  empty?: string;
  invalidFormat?: string;
  timezoneMissing?: string;
  timezoneInvalid?: string;
  nonexistentLocal?: string;
};

const DEFAULT_MSG: Required<DatetimeLocalTzMessages> = {
  empty: "Укажите дату и время.",
  invalidFormat: "Укажите корректную дату и время.",
  timezoneMissing:
    "Укажите часовой пояс в настройках профиля — без него время из формы нельзя перевести в UTC.",
  timezoneInvalid:
    "Часовой пояс в настройках не распознан. Используйте IANA (например, Europe/Moscow) или формат UTC+3.",
  nonexistentLocal:
    "Это местное время не существует в вашем часовом поясе (перевод часов). Выберите другое время.",
};

/**
 * Converts a `datetime-local` value to UTC ISO using `user_settings.timezone` (IANA or mapped UTC±N).
 */
export function datetimeLocalInUserTimezoneToUtcIso(
  raw: FormDataEntryValue | null,
  savedTimezone: string | null | undefined,
  messages?: DatetimeLocalTzMessages
): { ok: true; iso: string } | { ok: false; message: string } {
  const msg = { ...DEFAULT_MSG, ...messages };

  if (raw === null || typeof raw !== "string") {
    return { ok: false, message: msg.empty };
  }
  const trimmed = raw.trim();
  if (trimmed === "") {
    return { ok: false, message: msg.empty };
  }

  const tzRes = resolveTimezoneForFormDatetime(savedTimezone);
  if (!tzRes.ok) {
    const fallback =
      tzRes.reason === "missing" ? msg.timezoneMissing : msg.timezoneInvalid;
    return { ok: false, message: fallback };
  }

  const parsed = parseDatetimeLocalToWallParts(trimmed);
  if (!parsed.ok) {
    return { ok: false, message: msg.invalidFormat };
  }

  const utc = wallTimeInZoneToUtc(parsed.parts, tzRes.iana);
  if (!utc.ok) {
    if (utc.code === "invalid_zone") {
      return { ok: false, message: msg.timezoneInvalid };
    }
    return { ok: false, message: msg.nonexistentLocal };
  }

  const iso = utc.utc.toISOString();

  if (isDiaryLogRangeDebugEnabled()) {
    console.log(
      "[datetime-local-tz]",
      JSON.stringify({
        datetimeLocal: trimmed,
        timezoneUsed: tzRes.iana,
        storedUtcIso: iso,
      })
    );
  }

  return { ok: true, iso };
}
