/**
 * `public.user_settings` — expects `user_id` (PK or unique), plus:
 * `glucose_target_min`, `glucose_target_max`, optional `carb_ratio`, `insulin_sensitivity`, `timezone`.
 * Upsert uses `onConflict: "user_id"`.
 *
 * **RLS:** one row per user; select/upsert only where `user_id = auth.uid()`.
 */
import type { UserSettings } from "@/lib/types/glucose";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_GLUCOSE_MIN = 5.0;
const DEFAULT_GLUCOSE_MAX = 7.0;

function normalizeRow(data: Record<string, unknown> | null): UserSettings {
  if (!data) {
    return {
      glucose_target_min: DEFAULT_GLUCOSE_MIN,
      glucose_target_max: DEFAULT_GLUCOSE_MAX,
      carb_ratio: null,
      insulin_sensitivity: null,
      timezone: null,
    };
  }

  const minRaw = data.glucose_target_min;
  const maxRaw = data.glucose_target_max;
  const carbRaw = data.carb_ratio;
  const isensRaw = data.insulin_sensitivity;
  const tzRaw = data.timezone;

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
  const timezone =
    typeof tzRaw === "string" && tzRaw.trim().length > 0 ? tzRaw.trim() : null;

  return {
    glucose_target_min,
    glucose_target_max,
    carb_ratio,
    insulin_sensitivity,
    timezone,
  };
}

export async function getUserSettings(userId: string): Promise<UserSettings> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_settings")
    .select(
      "glucose_target_min, glucose_target_max, carb_ratio, insulin_sensitivity, timezone"
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return normalizeRow(data as Record<string, unknown> | null);
}

export type UserSettingsUpdatePayload = {
  glucose_target_min: number;
  glucose_target_max: number;
  carb_ratio: number | null;
  insulin_sensitivity: number | null;
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
    carb_ratio: patch.carb_ratio,
    insulin_sensitivity: patch.insulin_sensitivity,
    timezone: patch.timezone,
  };

  const { data, error } = await supabase
    .from("user_settings")
    .upsert(row, { onConflict: "user_id" })
    .select(
      "glucose_target_min, glucose_target_max, carb_ratio, insulin_sensitivity, timezone"
    )
    .maybeSingle();

  if (error) {
    return { ok: false, errorMessage: error.message };
  }

  if (!data) {
    return {
      ok: false,
      errorMessage:
        "Не удалось сохранить настройки. Проверьте права доступа к таблице.",
    };
  }

  return { ok: true, settings: normalizeRow(data as Record<string, unknown>) };
}
