import type { UserSettings } from "@/lib/types/glucose";

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
  return "Укажите в настройках углеводный коэффициент и чувствительность к инсулину — без обоих полей помощник не считает оценку болюса.";
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
