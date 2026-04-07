/**
 * Domain types for the glucose feature.
 * When Supabase generates `Database`, map row types here (e.g. Tables<"glucose_entries">).
 */

export type GlucoseStatus = "low" | "in_range" | "high";

/** Row from `public.glucose_entries` (selected columns in app queries). */
export type GlucoseEntry = {
  id: string;
  user_id: string;
  glucose_value: number;
  measured_at: string;
  /** e.g. `manual` for in-app entry; reserved for future device/sync values. */
  source: string;
  note: string | null;
};

/**
 * User preferences from `public.user_settings`.
 * Glucose features use `glucose_target_*`; other fields are optional for future calculations.
 */
export type UserSettings = {
  glucose_target_min: number;
  glucose_target_max: number;
  carb_ratio: number | null;
  insulin_sensitivity: number | null;
  timezone: string | null;
};

/**
 * Summary stats from `getGlucoseStats` (pure, server-computed).
 * When `isEmpty` is true, numeric fields are placeholders; show empty UI only.
 */
export type GlucoseStats =
  | {
      isEmpty: true;
      totalCount: 0;
      average: 0;
      min: 0;
      max: 0;
      inRangePercent: 0;
    }
  | {
      isEmpty: false;
      totalCount: number;
      average: number;
      min: number;
      max: number;
      inRangePercent: number;
    };

/** Serializable point for the glucose trend chart (built from entries on the server). */
export type GlucoseChartPoint = {
  id: string;
  measuredAt: string;
  shortLabel: string;
  value: number;
  status: GlucoseStatus;
};

/** URL `?range=` values for the glucose log filter. */
export const GLUCOSE_RANGE_OPTIONS = [
  "today",
  "7d",
  "14d",
  "30d",
  "all",
] as const;

export type GlucoseRangeKey = (typeof GLUCOSE_RANGE_OPTIONS)[number];
