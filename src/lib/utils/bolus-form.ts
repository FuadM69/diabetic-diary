import type { UserSettings } from "@/lib/types/glucose";
import { explainLogRangeTimeZone, readZonedWallClockParts } from "@/lib/utils/log-range-bounds";

export type BolusTimeOfDayKey = "morning" | "day" | "evening" | "night";

export type BolusResolvedSettings = {
  block: BolusTimeOfDayKey;
  blockLabel: string;
  carbRatio: number | null;
  insulinSensitivity: number | null;
  usesFallbackCarbRatio: boolean;
  usesFallbackSensitivity: boolean;
  ready: boolean;
};

export type BolusValidatedInput = {
  carbs: number;
  current_glucose: number;
};

export type ParseBolusHelperInputResult =
  | { ok: true; data: BolusValidatedInput }
  | { ok: false; message: string };

/** Both ratio and ISF required and strictly positive for bolus math. */
export function bolusSettingsReady(settings: UserSettings): boolean {
  const cr = settings.carb_ratio;
  const isf = settings.insulin_sensitivity;
  return (
    typeof cr === "number" &&
    Number.isFinite(cr) &&
    cr > 0 &&
    typeof isf === "number" &&
    Number.isFinite(isf) &&
    isf > 0
  );
}

export function bolusSettingsMissingMessage(): string {
  return "В настройках укажите УК (г углеводов на 1 ед.) и фактор коррекции (сдвиг глюкозы на 1 ед.) — без них оценка недоступна.";
}

function isPositiveNumber(v: number | null | undefined): v is number {
  return typeof v === "number" && Number.isFinite(v) && v > 0;
}

function getTimeBlockByHour(hour: number): BolusTimeOfDayKey {
  if (hour >= 6 && hour < 12) {
    return "morning";
  }
  if (hour >= 12 && hour < 18) {
    return "day";
  }
  if (hour >= 18 && hour < 24) {
    return "evening";
  }
  return "night";
}

export function getBolusTimeBlockLabelRu(block: BolusTimeOfDayKey): string {
  if (block === "morning") {
    return "утро (06:00-11:59)";
  }
  if (block === "day") {
    return "день (12:00-17:59)";
  }
  if (block === "evening") {
    return "вечер (18:00-23:59)";
  }
  return "ночь (00:00-05:59)";
}

function resolveBolusTimeBlock(
  settings: UserSettings,
  mealTimeIso: string | null
): BolusTimeOfDayKey {
  const instant = mealTimeIso ? new Date(mealTimeIso) : new Date();
  const safeInstant = Number.isNaN(instant.getTime()) ? new Date() : instant;
  const tz = explainLogRangeTimeZone(settings.timezone).resolvedTimeZone;
  const hour = readZonedWallClockParts(safeInstant, tz).hour;
  return getTimeBlockByHour(hour);
}

export function resolveBolusSettingsForTime(
  settings: UserSettings,
  mealTimeIso: string | null
): BolusResolvedSettings {
  const block = resolveBolusTimeBlock(settings, mealTimeIso);
  const blockLabel = getBolusTimeBlockLabelRu(block);
  const carbByBlock =
    block === "morning" ? settings.carb_ratio_morning
    : block === "day" ? settings.carb_ratio_day
    : block === "evening" ? settings.carb_ratio_evening
    : settings.carb_ratio_night;
  const isfByBlock =
    block === "morning" ? settings.insulin_sensitivity_morning
    : block === "day" ? settings.insulin_sensitivity_day
    : block === "evening" ? settings.insulin_sensitivity_evening
    : settings.insulin_sensitivity_night;

  const hasBlockCarb = isPositiveNumber(carbByBlock);
  const hasBlockIsf = isPositiveNumber(isfByBlock);
  const carbRatio = hasBlockCarb ? carbByBlock : settings.carb_ratio;
  const insulinSensitivity = hasBlockIsf ? isfByBlock : settings.insulin_sensitivity;

  return {
    block,
    blockLabel,
    carbRatio: isPositiveNumber(carbRatio) ? carbRatio : null,
    insulinSensitivity: isPositiveNumber(insulinSensitivity)
      ? insulinSensitivity
      : null,
    usesFallbackCarbRatio: !hasBlockCarb,
    usesFallbackSensitivity: !hasBlockIsf,
    ready:
      isPositiveNumber(hasBlockCarb ? carbByBlock : settings.carb_ratio) &&
      isPositiveNumber(hasBlockIsf ? isfByBlock : settings.insulin_sensitivity),
  };
}

function parseNonNegativeCarbs(
  raw: FormDataEntryValue | null
):
  | { ok: true; value: number }
  | { ok: false; message: string } {
  if (raw === null || typeof raw !== "string") {
    return { ok: false, message: "Укажите углеводы (г)." };
  }
  const str = raw.trim();
  if (str === "") {
    return { ok: false, message: "Укажите углеводы (г)." };
  }
  const value = Number.parseFloat(str.replace(",", "."));
  if (!Number.isFinite(value)) {
    return { ok: false, message: "Введите корректное число для углеводов." };
  }
  if (value < 0) {
    return { ok: false, message: "Углеводы не могут быть отрицательными." };
  }
  return { ok: true, value };
}

function parsePositiveGlucose(
  raw: FormDataEntryValue | null
):
  | { ok: true; value: number }
  | { ok: false; message: string } {
  if (raw === null || typeof raw !== "string") {
    return { ok: false, message: "Укажите текущую глюкозу." };
  }
  const str = raw.trim();
  if (str === "") {
    return { ok: false, message: "Укажите текущую глюкозу." };
  }
  const value = Number.parseFloat(str.replace(",", "."));
  if (!Number.isFinite(value)) {
    return { ok: false, message: "Введите корректное число для глюкозы." };
  }
  if (value <= 0) {
    return {
      ok: false,
      message: "Глюкоза должна быть больше нуля.",
    };
  }
  return { ok: true, value };
}

/** Validate bolus helper fields (e.g. from FormData in the browser). */
export function parseBolusHelperInput(
  carbsRaw: FormDataEntryValue | null,
  currentGlucoseRaw: FormDataEntryValue | null
): ParseBolusHelperInputResult {
  const carbs = parseNonNegativeCarbs(carbsRaw);
  if (!carbs.ok) {
    return { ok: false, message: carbs.message };
  }
  const glu = parsePositiveGlucose(currentGlucoseRaw);
  if (!glu.ok) {
    return { ok: false, message: glu.message };
  }
  return {
    ok: true,
    data: { carbs: carbs.value, current_glucose: glu.value },
  };
}
