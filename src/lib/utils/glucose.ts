import {
  GLUCOSE_RANGE_OPTIONS,
  type GlucoseChartPoint,
  type GlucoseEntry,
  type GlucoseRangeKey,
  type GlucoseStats,
  type GlucoseStatus,
  type UserSettings,
} from "@/lib/types/glucose";
import { datetimeLocalToUtcIso } from "@/lib/utils/datetime-local";
import {
  getLogRangeMeasuredAtLowerBound,
  type LogRangeBoundOptions,
} from "@/lib/utils/log-range-bounds";

/** Reject obviously broken values (works for typical mmol/L and mg/dL scales). */
export const GLUCOSE_INPUT_MAX = 600;

export type ParseGlucoseFormValueResult =
  | { ok: true; value: number }
  | { ok: false; message: string };

export type ParseEntryIdResult =
  | { ok: true; entryId: string }
  | { ok: false; message: string };

/** Validates non-empty entry id from FormData (update/delete). */
export function parseGlucoseEntryId(
  raw: FormDataEntryValue | null
): ParseEntryIdResult {
  if (raw === null || typeof raw !== "string") {
    return { ok: false, message: "Не указана запись." };
  }
  const entryId = raw.trim();
  if (!entryId) {
    return { ok: false, message: "Не указана запись." };
  }
  return { ok: true, entryId };
}

/**
 * Validate raw FormData value for glucose (required, numeric, > 0, upper cap).
 * No I/O; safe to call from server actions.
 */
export function parseGlucoseFormValue(
  raw: FormDataEntryValue | null
): ParseGlucoseFormValueResult {
  if (raw === null) {
    return { ok: false, message: "Введите значение глюкозы." };
  }

  if (typeof raw !== "string") {
    return { ok: false, message: "Укажите корректное число." };
  }

  const str = raw.trim();
  if (str === "") {
    return { ok: false, message: "Введите значение глюкозы." };
  }

  const value = Number.parseFloat(str);
  if (!Number.isFinite(value)) {
    return { ok: false, message: "Укажите корректное число." };
  }

  if (value <= 0) {
    return { ok: false, message: "Значение должно быть больше нуля." };
  }

  if (value > GLUCOSE_INPUT_MAX) {
    return {
      ok: false,
      message: `Значение слишком большое (не более ${GLUCOSE_INPUT_MAX}).`,
    };
  }

  return { ok: true, value };
}

export type ParseGlucoseMeasuredAtResult =
  | { ok: true; iso: string }
  | { ok: false; message: string };

/**
 * Required `measured_at` from FormData (`datetime-local`). Returns UTC ISO for DB / Supabase.
 */
export function parseGlucoseMeasuredAt(
  raw: FormDataEntryValue | null
): ParseGlucoseMeasuredAtResult {
  if (raw === null || typeof raw !== "string") {
    return { ok: false, message: "Укажите дату и время замера." };
  }
  if (raw.trim() === "") {
    return { ok: false, message: "Укажите дату и время замера." };
  }
  const iso = datetimeLocalToUtcIso(raw);
  if (iso === null) {
    return {
      ok: false,
      message: "Укажите корректную дату и время замера.",
    };
  }
  return { ok: true, iso };
}

export const GLUCOSE_NOTE_MAX_LENGTH = 2000;
export const GLUCOSE_SOURCE_MAX_LENGTH = 64;

export type ParseGlucoseNoteResult =
  | { ok: true; note: string | null }
  | { ok: false; message: string };

/** Optional note on a glucose reading (server-safe). */
export function parseGlucoseNote(
  raw: FormDataEntryValue | null
): ParseGlucoseNoteResult {
  if (raw === null || typeof raw !== "string") {
    return { ok: true, note: null };
  }
  const t = raw.trim();
  if (t.length === 0) {
    return { ok: true, note: null };
  }
  if (t.length > GLUCOSE_NOTE_MAX_LENGTH) {
    return {
      ok: false,
      message: `Примечание слишком длинное (не более ${GLUCOSE_NOTE_MAX_LENGTH} символов).`,
    };
  }
  return { ok: true, note: t };
}

export type ParseGlucoseSourceResult =
  | { ok: true; source: string }
  | { ok: false; message: string };

/** Source label (e.g. `manual`); defaults when empty. */
export function parseGlucoseSource(
  raw: FormDataEntryValue | null
): ParseGlucoseSourceResult {
  if (raw === null || typeof raw !== "string") {
    return { ok: true, source: "manual" };
  }
  const t = raw.trim();
  if (t.length === 0) {
    return { ok: true, source: "manual" };
  }
  if (t.length > GLUCOSE_SOURCE_MAX_LENGTH) {
    return {
      ok: false,
      message: `Источник слишком длинный (не более ${GLUCOSE_SOURCE_MAX_LENGTH} символов).`,
    };
  }
  return { ok: true, source: t };
}

export function getGlucoseStatus(
  glucoseValue: number,
  targetMin: number,
  targetMax: number
): GlucoseStatus {
  let min = targetMin;
  let max = targetMax;
  if (min > max) {
    [min, max] = [max, min];
  }

  if (glucoseValue < min) {
    return "low";
  }
  if (glucoseValue > max) {
    return "high";
  }
  return "in_range";
}

export function formatGlucoseValue(value: number): string {
  if (!Number.isFinite(value)) {
    return "—";
  }
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  }).format(value);
}

const defaultDateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatGlucoseDate(isoDateString: string): string {
  const d = new Date(isoDateString);
  if (Number.isNaN(d.getTime())) {
    return isoDateString;
  }
  return defaultDateFormatter.format(d);
}

function roundOneDecimal(n: number): number {
  return Math.round(n * 10) / 10;
}

const EMPTY_STATS: GlucoseStats = {
  isEmpty: true,
  totalCount: 0,
  average: 0,
  min: 0,
  max: 0,
  inRangePercent: 0,
};

/**
 * Pure stats from already-loaded entries and targets. No I/O.
 * Always returns a safe value; use `isEmpty` for UI. Pre-filter `entries` for date ranges, etc.
 */
export function getGlucoseStats(
  entries: GlucoseEntry[],
  userSettings: UserSettings
): GlucoseStats {
  const values = entries
    .map((e) => e.glucose_value)
    .filter((v) => typeof v === "number" && Number.isFinite(v));

  if (values.length === 0) {
    return EMPTY_STATS;
  }

  let minTarget = userSettings.glucose_target_min;
  let maxTarget = userSettings.glucose_target_max;
  if (minTarget > maxTarget) {
    [minTarget, maxTarget] = [maxTarget, minTarget];
  }

  const sum = values.reduce((acc, v) => acc + v, 0);
  const average = roundOneDecimal(sum / values.length);
  const min = roundOneDecimal(Math.min(...values));
  const max = roundOneDecimal(Math.max(...values));

  const inRangeCount = values.filter(
    (v) => v >= minTarget && v <= maxTarget
  ).length;
  const inRangePercent = Math.round((inRangeCount / values.length) * 100);

  return {
    isEmpty: false,
    totalCount: values.length,
    average,
    min,
    max,
    inRangePercent,
  };
}

/** Short tick label for chart X-axis (time-only if same day as previous point). */
export function formatGlucoseChartShortLabel(
  iso: string,
  previousIso?: string
): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "—";
  }

  if (previousIso) {
    const prev = new Date(previousIso);
    if (
      !Number.isNaN(prev.getTime()) &&
      d.toDateString() === prev.toDateString()
    ) {
      return d.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  }

  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Map loaded entries to chart points: chronological (oldest → newest), one point per reading.
 */
export function mapGlucoseEntriesToChartPoints(
  entries: GlucoseEntry[],
  settings: UserSettings
): GlucoseChartPoint[] {
  const valid = entries.filter(
    (e) =>
      typeof e.glucose_value === "number" && Number.isFinite(e.glucose_value)
  );

  const sorted = [...valid].sort(
    (a, b) =>
      new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime()
  );

  return sorted.map((e, i) => {
    const prevIso = i > 0 ? sorted[i - 1].measured_at : undefined;
    return {
      id: e.id,
      measuredAt: e.measured_at,
      shortLabel: formatGlucoseChartShortLabel(e.measured_at, prevIso),
      value: e.glucose_value,
      status: getGlucoseStatus(
        e.glucose_value,
        settings.glucose_target_min,
        settings.glucose_target_max
      ),
    };
  });
}

/** Y-axis bounds so the line, dots, and target band all fit with light padding. */
export function getGlucoseChartYDomain(
  points: GlucoseChartPoint[],
  targetMin: number,
  targetMax: number
): [number, number] {
  let lo = Math.min(targetMin, targetMax);
  let hi = Math.max(targetMin, targetMax);

  for (const p of points) {
    lo = Math.min(lo, p.value);
    hi = Math.max(hi, p.value);
  }

  if (lo === hi) {
    lo -= 0.5;
    hi += 0.5;
  }

  const span = hi - lo;
  const pad = Math.max(0.3, span * 0.12);
  return [roundOneDecimal(lo - pad), roundOneDecimal(hi + pad)];
}

export const GLUCOSE_CHART_STATUS_LABEL: Record<GlucoseStatus, string> = {
  low: "Low",
  in_range: "In range",
  high: "High",
};

export const DEFAULT_GLUCOSE_RANGE: GlucoseRangeKey = "7d";

const RANGE_SET = new Set<string>(GLUCOSE_RANGE_OPTIONS);

/** Read `range` from URL; invalid or missing → default 7d. */
export function parseGlucoseRangeParam(
  raw: string | string[] | undefined
): GlucoseRangeKey {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (typeof v !== "string") {
    return DEFAULT_GLUCOSE_RANGE;
  }
  const key = v.trim();
  if (RANGE_SET.has(key)) {
    return key as GlucoseRangeKey;
  }
  return DEFAULT_GLUCOSE_RANGE;
}

export type { LogRangeBoundOptions };

/**
 * Inclusive lower bound for `measured_at` / `taken_at` / `eaten_at` (ISO UTC), or `null` for `"all"`.
 * **"today"** uses the user’s timezone via `options.timezone` (see `log-range-bounds.ts`).
 */
export function getGlucoseRangeMeasuredAtLowerBound(
  range: GlucoseRangeKey,
  options?: LogRangeBoundOptions
): string | null {
  return getLogRangeMeasuredAtLowerBound(range, options);
}

export const GLUCOSE_RANGE_LABEL: Record<GlucoseRangeKey, string> = {
  today: "Сегодня",
  "7d": "7 дн.",
  "14d": "14 дн.",
  "30d": "30 дн.",
  all: "Всё",
};

/** Empty list copy: global vs period-specific. */
export function getGlucoseListEmptyMessage(range: GlucoseRangeKey): {
  title: string;
  description?: string;
} {
  if (range === "all") {
    return {
      title: "Пока нет замеров глюкозы.",
      description:
        "Добавьте первое значение в форме на этой странице — тогда появятся список, сводка и график.",
    };
  }
  return {
    title: "Нет записей за выбранный период.",
    description:
      "Смените период выше, откройте «всё время» или добавьте новый замер.",
  };
}

export function getGlucoseStatsEmptyLabel(range: GlucoseRangeKey): string {
  return range === "all"
    ? "Пока нет данных"
    : "Нет данных за этот период";
}

export function getGlucoseChartEmptyLabel(range: GlucoseRangeKey): string {
  return range === "all"
    ? "Нет данных для графика"
    : "Нет данных за этот период";
}

/** Filter pre-fetched entries by inclusive `measured_at` lower bound (ISO strings compare lexicographically). */
export function filterGlucoseEntriesMeasuredAtGte(
  entries: GlucoseEntry[],
  measuredAtGteIso: string
): GlucoseEntry[] {
  if (!measuredAtGteIso) {
    return entries;
  }
  return entries.filter((e) => e.measured_at >= measuredAtGteIso);
}
