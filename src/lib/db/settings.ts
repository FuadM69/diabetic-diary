/**
 * `public.user_settings` — expects `user_id` (PK or unique), plus:
 * `glucose_target_min`, `glucose_target_max`, optional `carb_ratio`, `insulin_sensitivity`, `timezone`.
 * Upsert uses `onConflict: "user_id"`.
 *
 * **RLS:** one row per user; select/upsert only where `user_id = auth.uid()`.
 */
import type { UserSettings } from "@/lib/types/glucose";
import { createClient } from "@/lib/supabase/server";
import type { InsulinDoseStep } from "@/lib/utils/insulin-dose-step";
import {
  DEFAULT_INSULIN_DOSE_STEP,
  normalizeInsulinDoseStepFromDb,
} from "@/lib/utils/insulin-dose-step";

const DEFAULT_GLUCOSE_MIN = 5.0;
const DEFAULT_GLUCOSE_MAX = 7.0;
const SETTINGS_SELECT_LEGACY =
  "glucose_target_min, glucose_target_max, carb_ratio, insulin_sensitivity, timezone";
const SETTINGS_SELECT_FULL =
  "glucose_target_min, glucose_target_max, insulin_dose_step, carb_ratio, insulin_sensitivity, carb_ratio_morning, carb_ratio_day, carb_ratio_evening, carb_ratio_night, insulin_sensitivity_morning, insulin_sensitivity_day, insulin_sensitivity_evening, insulin_sensitivity_night, timezone";

function isMissingTimeOfDaySettingsColumnsError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const code =
    "code" in error && typeof error.code === "string" ? error.code : null;
  const message =
    "message" in error && typeof error.message === "string"
      ? error.message.toLowerCase()
      : "";
  if (code === "42703") {
    return true;
  }
  if (!message.includes("column")) {
    return false;
  }
  return (
    message.includes("carb_ratio_morning") ||
    message.includes("carb_ratio_day") ||
    message.includes("carb_ratio_evening") ||
    message.includes("carb_ratio_night") ||
    message.includes("insulin_sensitivity_morning") ||
    message.includes("insulin_sensitivity_day") ||
    message.includes("insulin_sensitivity_evening") ||
    message.includes("insulin_sensitivity_night") ||
    message.includes("insulin_dose_step")
  );
}

function normalizeRow(data: Record<string, unknown> | null): UserSettings {
  if (!data) {
    return {
      glucose_target_min: DEFAULT_GLUCOSE_MIN,
      glucose_target_max: DEFAULT_GLUCOSE_MAX,
      carb_ratio: null,
      insulin_sensitivity: null,
      carb_ratio_morning: null,
      carb_ratio_day: null,
      carb_ratio_evening: null,
      carb_ratio_night: null,
      insulin_sensitivity_morning: null,
      insulin_sensitivity_day: null,
      insulin_sensitivity_evening: null,
      insulin_sensitivity_night: null,
      timezone: null,
      insulin_dose_step: DEFAULT_INSULIN_DOSE_STEP,
    };
  }

  const minRaw = data.glucose_target_min;
  const maxRaw = data.glucose_target_max;
  const carbRaw = data.carb_ratio;
  const isensRaw = data.insulin_sensitivity;
  const carbMorningRaw = data.carb_ratio_morning;
  const carbDayRaw = data.carb_ratio_day;
  const carbEveningRaw = data.carb_ratio_evening;
  const carbNightRaw = data.carb_ratio_night;
  const isensMorningRaw = data.insulin_sensitivity_morning;
  const isensDayRaw = data.insulin_sensitivity_day;
  const isensEveningRaw = data.insulin_sensitivity_evening;
  const isensNightRaw = data.insulin_sensitivity_night;
  const tzRaw = data.timezone;
  const doseStepRaw = data.insulin_dose_step;

  const glucose_target_min =
    typeof minRaw === "number" && Number.isFinite(minRaw)
      ? minRaw
      : DEFAULT_GLUCOSE_MIN;
  const glucose_target_max =
    typeof maxRaw === "number" && Number.isFinite(maxRaw)
      ? maxRaw
      : DEFAULT_GLUCOSE_MAX;

  const carb_ratio =
    typeof carbRaw === "number" && Number.isFinite(carbRaw) ? carbRaw : null;
  const insulin_sensitivity =
    typeof isensRaw === "number" && Number.isFinite(isensRaw) ? isensRaw : null;
  const carb_ratio_morning =
    typeof carbMorningRaw === "number" && Number.isFinite(carbMorningRaw)
      ? carbMorningRaw
      : null;
  const carb_ratio_day =
    typeof carbDayRaw === "number" && Number.isFinite(carbDayRaw)
      ? carbDayRaw
      : null;
  const carb_ratio_evening =
    typeof carbEveningRaw === "number" && Number.isFinite(carbEveningRaw)
      ? carbEveningRaw
      : null;
  const carb_ratio_night =
    typeof carbNightRaw === "number" && Number.isFinite(carbNightRaw)
      ? carbNightRaw
      : null;
  const insulin_sensitivity_morning =
    typeof isensMorningRaw === "number" && Number.isFinite(isensMorningRaw)
      ? isensMorningRaw
      : null;
  const insulin_sensitivity_day =
    typeof isensDayRaw === "number" && Number.isFinite(isensDayRaw)
      ? isensDayRaw
      : null;
  const insulin_sensitivity_evening =
    typeof isensEveningRaw === "number" && Number.isFinite(isensEveningRaw)
      ? isensEveningRaw
      : null;
  const insulin_sensitivity_night =
    typeof isensNightRaw === "number" && Number.isFinite(isensNightRaw)
      ? isensNightRaw
      : null;
  const timezone =
    typeof tzRaw === "string" && tzRaw.trim().length > 0 ? tzRaw.trim() : null;
  const insulin_dose_step = normalizeInsulinDoseStepFromDb(doseStepRaw);

  return {
    glucose_target_min,
    glucose_target_max,
    insulin_dose_step,
    carb_ratio,
    insulin_sensitivity,
    carb_ratio_morning,
    carb_ratio_day,
    carb_ratio_evening,
    carb_ratio_night,
    insulin_sensitivity_morning,
    insulin_sensitivity_day,
    insulin_sensitivity_evening,
    insulin_sensitivity_night,
    timezone,
  };
}

export async function getUserSettings(userId: string): Promise<UserSettings> {
  const supabase = await createClient();

  const full = await supabase
    .from("user_settings")
    .select(SETTINGS_SELECT_FULL)
    .eq("user_id", userId)
    .maybeSingle();

  if (!full.error) {
    return normalizeRow(full.data as Record<string, unknown> | null);
  }

  if (!isMissingTimeOfDaySettingsColumnsError(full.error)) {
    throw full.error;
  }

  const legacy = await supabase
    .from("user_settings")
    .select(SETTINGS_SELECT_LEGACY)
    .eq("user_id", userId)
    .maybeSingle();

  if (legacy.error) {
    throw legacy.error;
  }

  return normalizeRow(legacy.data as Record<string, unknown> | null);
}

export type UserSettingsUpdatePayload = {
  glucose_target_min: number;
  glucose_target_max: number;
  insulin_dose_step: InsulinDoseStep;
  carb_ratio: number | null;
  insulin_sensitivity: number | null;
  carb_ratio_morning: number | null;
  carb_ratio_day: number | null;
  carb_ratio_evening: number | null;
  carb_ratio_night: number | null;
  insulin_sensitivity_morning: number | null;
  insulin_sensitivity_day: number | null;
  insulin_sensitivity_evening: number | null;
  insulin_sensitivity_night: number | null;
  timezone: string | null;
};

export type UpdateUserSettingsResult =
  | { ok: true; settings: UserSettings }
  | { ok: false; errorMessage: string };

export async function updateUserSettings(
  userId: string,
  patch: UserSettingsUpdatePayload
): Promise<UpdateUserSettingsResult> {
  const supabase = await createClient();

  const row = {
    user_id: userId,
    glucose_target_min: patch.glucose_target_min,
    glucose_target_max: patch.glucose_target_max,
    insulin_dose_step: patch.insulin_dose_step,
    carb_ratio: patch.carb_ratio,
    insulin_sensitivity: patch.insulin_sensitivity,
    carb_ratio_morning: patch.carb_ratio_morning,
    carb_ratio_day: patch.carb_ratio_day,
    carb_ratio_evening: patch.carb_ratio_evening,
    carb_ratio_night: patch.carb_ratio_night,
    insulin_sensitivity_morning: patch.insulin_sensitivity_morning,
    insulin_sensitivity_day: patch.insulin_sensitivity_day,
    insulin_sensitivity_evening: patch.insulin_sensitivity_evening,
    insulin_sensitivity_night: patch.insulin_sensitivity_night,
    timezone: patch.timezone,
  };

  const full = await supabase
    .from("user_settings")
    .upsert(row, { onConflict: "user_id" })
    .select(SETTINGS_SELECT_FULL)
    .maybeSingle();

  if (!full.error && full.data) {
    return {
      ok: true,
      settings: normalizeRow(full.data as Record<string, unknown>),
    };
  }

  if (
    full.error &&
    !isMissingTimeOfDaySettingsColumnsError(full.error)
  ) {
    return { ok: false, errorMessage: full.error.message };
  }

  const legacyRow = {
    user_id: userId,
    glucose_target_min: patch.glucose_target_min,
    glucose_target_max: patch.glucose_target_max,
    carb_ratio: patch.carb_ratio,
    insulin_sensitivity: patch.insulin_sensitivity,
    timezone: patch.timezone,
  };
  const legacy = await supabase
    .from("user_settings")
    .upsert(legacyRow, { onConflict: "user_id" })
    .select(SETTINGS_SELECT_LEGACY)
    .maybeSingle();

  if (legacy.error) {
    return { ok: false, errorMessage: legacy.error.message };
  }

  if (!legacy.data) {
    return {
      ok: false,
      errorMessage:
        "Не удалось сохранить настройки. Проверьте права доступа к таблице.",
    };
  }

  return {
    ok: true,
    settings: normalizeRow(legacy.data as Record<string, unknown>),
  };
}
