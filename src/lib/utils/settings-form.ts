import type { UserSettingsUpdatePayload } from "@/lib/db/settings";
import { isInsulinDoseStep } from "@/lib/utils/insulin-dose-step";

export type ParseSettingsFormResult =
  | { ok: true; data: UserSettingsUpdatePayload }
  | { ok: false; message: string };

const GLUCOSE_TARGET_MAX_BOUND = 100;
const GLUCOSE_TARGET_MIN_BOUND = 0;
const RATIO_UPPER = 200;
const RATIO_LOWER = 0.1;
const TIMEZONE_MAX_LEN = 64;

function parseRequiredPositiveFloat(
  raw: FormDataEntryValue | null,
  fieldLabel: string,
  upper: number
): { ok: true; value: number } | { ok: false; message: string } {
  if (raw === null || typeof raw !== "string") {
    return { ok: false, message: `Заполните поле «${fieldLabel}».` };
  }
  const s = raw.trim();
  if (s === "") {
    return { ok: false, message: `Заполните поле «${fieldLabel}».` };
  }
  const n = Number.parseFloat(s);
  if (!Number.isFinite(n)) {
    return { ok: false, message: `«${fieldLabel}» должно быть числом.` };
  }
  if (n <= GLUCOSE_TARGET_MIN_BOUND) {
    return {
      ok: false,
      message: `«${fieldLabel}» должно быть больше нуля.`,
    };
  }
  if (n > upper) {
    return {
      ok: false,
      message: `«${fieldLabel}» слишком большое (не более ${upper}).`,
    };
  }
  return { ok: true, value: n };
}

function parseOptionalPositiveFloat(
  raw: FormDataEntryValue | null,
  fieldLabel: string
): { ok: true; value: number | null } | { ok: false; message: string } {
  if (raw === null || typeof raw !== "string") {
    return { ok: true, value: null };
  }
  const s = raw.trim();
  if (s === "") {
    return { ok: true, value: null };
  }
  const n = Number.parseFloat(s);
  if (!Number.isFinite(n)) {
    return { ok: false, message: `«${fieldLabel}» должно быть числом или пустым.` };
  }
  if (n < RATIO_LOWER) {
    return {
      ok: false,
      message: `«${fieldLabel}» не меньше ${RATIO_LOWER}.`,
    };
  }
  if (n > RATIO_UPPER) {
    return {
      ok: false,
      message: `«${fieldLabel}» не больше ${RATIO_UPPER}.`,
    };
  }
  return { ok: true, value: n };
}

/**
 * Single validation path for settings form → DB payload (no I/O).
 */
export function parseUserSettingsForm(formData: FormData): ParseSettingsFormResult {
  const minP = parseRequiredPositiveFloat(
    formData.get("glucose_target_min"),
    "Глюкоза: минимум цели",
    GLUCOSE_TARGET_MAX_BOUND
  );
  if (!minP.ok) {
    return { ok: false, message: minP.message };
  }

  const maxP = parseRequiredPositiveFloat(
    formData.get("glucose_target_max"),
    "Глюкоза: максимум цели",
    GLUCOSE_TARGET_MAX_BOUND
  );
  if (!maxP.ok) {
    return { ok: false, message: maxP.message };
  }

  if (minP.value >= maxP.value) {
    return {
      ok: false,
      message:
        "Минимум целевой глюкозы должен быть меньше максимума.",
    };
  }

  const doseStepRaw = formData.get("insulin_dose_step");
  if (doseStepRaw === null || typeof doseStepRaw !== "string") {
    return { ok: false, message: "Выберите шаг дозы инсулина." };
  }
  const doseStepParsed = Number.parseFloat(doseStepRaw.trim().replace(",", "."));
  if (!isInsulinDoseStep(doseStepParsed)) {
    return { ok: false, message: "Недопустимый шаг дозы инсулина." };
  }

  const carbP = parseOptionalPositiveFloat(
    formData.get("carb_ratio"),
    "Г углеводов на 1 ед. (основное)"
  );
  if (!carbP.ok) {
    return { ok: false, message: carbP.message };
  }

  const isensP = parseOptionalPositiveFloat(
    formData.get("insulin_sensitivity"),
    "Падение сахара на 1 ед. (основное)"
  );
  if (!isensP.ok) {
    return { ok: false, message: isensP.message };
  }

  const carbMorningP = parseOptionalPositiveFloat(
    formData.get("carb_ratio_morning"),
    "Утром: г на 1 ед."
  );
  if (!carbMorningP.ok) {
    return { ok: false, message: carbMorningP.message };
  }
  const carbDayP = parseOptionalPositiveFloat(
    formData.get("carb_ratio_day"),
    "Днём: г на 1 ед."
  );
  if (!carbDayP.ok) {
    return { ok: false, message: carbDayP.message };
  }
  const carbEveningP = parseOptionalPositiveFloat(
    formData.get("carb_ratio_evening"),
    "Вечером: г на 1 ед."
  );
  if (!carbEveningP.ok) {
    return { ok: false, message: carbEveningP.message };
  }
  const carbNightP = parseOptionalPositiveFloat(
    formData.get("carb_ratio_night"),
    "Ночью: г на 1 ед."
  );
  if (!carbNightP.ok) {
    return { ok: false, message: carbNightP.message };
  }
  const isensMorningP = parseOptionalPositiveFloat(
    formData.get("insulin_sensitivity_morning"),
    "Утром: падение на 1 ед."
  );
  if (!isensMorningP.ok) {
    return { ok: false, message: isensMorningP.message };
  }
  const isensDayP = parseOptionalPositiveFloat(
    formData.get("insulin_sensitivity_day"),
    "Днём: падение на 1 ед."
  );
  if (!isensDayP.ok) {
    return { ok: false, message: isensDayP.message };
  }
  const isensEveningP = parseOptionalPositiveFloat(
    formData.get("insulin_sensitivity_evening"),
    "Вечером: падение на 1 ед."
  );
  if (!isensEveningP.ok) {
    return { ok: false, message: isensEveningP.message };
  }
  const isensNightP = parseOptionalPositiveFloat(
    formData.get("insulin_sensitivity_night"),
    "Ночью: падение на 1 ед."
  );
  if (!isensNightP.ok) {
    return { ok: false, message: isensNightP.message };
  }

  const tzRaw = formData.get("timezone");
  let timezone: string | null = null;
  if (typeof tzRaw === "string") {
    const tzTrimmed = tzRaw.trim();
    if (tzTrimmed.length > TIMEZONE_MAX_LEN) {
      return {
        ok: false,
        message: `Часовой пояс слишком длинный (макс. ${TIMEZONE_MAX_LEN} символов).`,
      };
    }
    timezone = tzTrimmed === "" ? null : tzTrimmed;
  }

  return {
    ok: true,
    data: {
      glucose_target_min: minP.value,
      glucose_target_max: maxP.value,
      insulin_dose_step: doseStepParsed,
      carb_ratio: carbP.value,
      insulin_sensitivity: isensP.value,
      carb_ratio_morning: carbMorningP.value,
      carb_ratio_day: carbDayP.value,
      carb_ratio_evening: carbEveningP.value,
      carb_ratio_night: carbNightP.value,
      insulin_sensitivity_morning: isensMorningP.value,
      insulin_sensitivity_day: isensDayP.value,
      insulin_sensitivity_evening: isensEveningP.value,
      insulin_sensitivity_night: isensNightP.value,
      timezone,
    },
  };
}
