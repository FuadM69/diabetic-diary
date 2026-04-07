/**
 * Pure bolus **estimate** helpers (meal + correction). Not medical advice.
 * Assumes `carb_ratio` and `insulin_sensitivity` use the same glucose units as readings.
 */

export type BolusSettingsInput = {
  glucose_target_min: number;
  glucose_target_max: number;
  carb_ratio: number;
  insulin_sensitivity: number;
};

export type BolusComputeInput = {
  carbs: number;
  current_glucose: number;
  settings: BolusSettingsInput;
};

export type BolusEstimate = {
  targetGlucose: number;
  mealBolus: number;
  correctionBolus: number;
  totalBolus: number;
};

/** Order range low → high. */
export function normalizeGlucoseTargetRange(
  min: number,
  max: number
): { lo: number; hi: number } {
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { lo: 0, hi: 0 };
  }
  if (min > max) {
    return { lo: max, hi: min };
  }
  return { lo: min, hi: max };
}

/** Midpoint of the target band (safe default for correction). */
export function bolusTargetGlucoseFromRange(
  glucoseTargetMin: number,
  glucoseTargetMax: number
): number {
  const { lo, hi } = normalizeGlucoseTargetRange(
    glucoseTargetMin,
    glucoseTargetMax
  );
  return (lo + hi) / 2;
}

/** Carbs bolus: carbs / carb_ratio. Zero carbs → 0. Invalid ratio → 0. */
export function computeMealBolus(carbs: number, carbRatio: number): number {
  if (!Number.isFinite(carbs) || carbs < 0) {
    return 0;
  }
  if (!Number.isFinite(carbRatio) || carbRatio <= 0) {
    return 0;
  }
  return carbs / carbRatio;
}

/**
 * Correction bolus only when current glucose is above target.
 * (current - target) / insulin_sensitivity, else 0.
 */
export function computeCorrectionBolus(
  currentGlucose: number,
  targetGlucose: number,
  insulinSensitivity: number
): number {
  if (!Number.isFinite(currentGlucose) || !Number.isFinite(targetGlucose)) {
    return 0;
  }
  if (
    !Number.isFinite(insulinSensitivity) ||
    insulinSensitivity <= 0
  ) {
    return 0;
  }
  if (currentGlucose <= targetGlucose) {
    return 0;
  }
  return (currentGlucose - targetGlucose) / insulinSensitivity;
}

export function computeBolusEstimate(input: BolusComputeInput): BolusEstimate {
  const targetGlucose = bolusTargetGlucoseFromRange(
    input.settings.glucose_target_min,
    input.settings.glucose_target_max
  );
  const mealBolus = computeMealBolus(input.carbs, input.settings.carb_ratio);
  const correctionBolus = computeCorrectionBolus(
    input.current_glucose,
    targetGlucose,
    input.settings.insulin_sensitivity
  );
  const totalBolus = mealBolus + correctionBolus;

  return {
    targetGlucose,
    mealBolus,
    correctionBolus,
    totalBolus,
  };
}

export function formatBolusDose(value: number): string {
  if (!Number.isFinite(value)) {
    return "—";
  }
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(value);
}
