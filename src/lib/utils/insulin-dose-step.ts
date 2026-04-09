/**
 * User-selectable pen/pump increment for dose display and URL prefill rounding.
 * Values stored in `user_settings.insulin_dose_step`.
 */

export const INSULIN_DOSE_STEPS = [1, 0.5, 0.25] as const;

export type InsulinDoseStep = (typeof INSULIN_DOSE_STEPS)[number];

export const DEFAULT_INSULIN_DOSE_STEP: InsulinDoseStep = 0.5;

const STEP_SET = new Set<number>(INSULIN_DOSE_STEPS);

export function isInsulinDoseStep(n: number): n is InsulinDoseStep {
  return STEP_SET.has(n);
}

/** Map DB / unknown input to a supported step (fallback 0.5). */
export function normalizeInsulinDoseStepFromDb(value: unknown): InsulinDoseStep {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_INSULIN_DOSE_STEP;
  }
  for (const s of INSULIN_DOSE_STEPS) {
    if (Math.abs(value - s) < 1e-9) {
      return s;
    }
  }
  return DEFAULT_INSULIN_DOSE_STEP;
}

/**
 * Nearest practical dose on the pen/pump grid (handles float noise).
 */
export function roundInsulinDoseToStep(
  dose: number,
  step: InsulinDoseStep
): number {
  if (!Number.isFinite(dose) || dose <= 0) {
    return dose;
  }
  const rounded = Math.round(dose / step) * step;
  const decimals =
    step >= 1 ? 0
    : step >= 0.5 ? 1
    : 2;
  return Math.round(rounded * 10 ** decimals) / 10 ** decimals;
}

/**
 * Rounded dose for pen/pump prefill. If the grid rounds a small positive
 * estimate to 0, returns the raw estimate so the insulin form is not empty.
 */
export function insulinPrefillUnitsOrFallback(
  dose: number,
  step: InsulinDoseStep = DEFAULT_INSULIN_DOSE_STEP
): number {
  const rounded = roundInsulinDoseToStep(dose, step);
  if (rounded <= 0 && dose > 0) {
    return dose;
  }
  return rounded;
}

export function formatInsulinDoseStepRu(step: InsulinDoseStep): string {
  if (step === 1) {
    return "1 ед.";
  }
  if (step === 0.5) {
    return "0,5 ед.";
  }
  return "0,25 ед.";
}
