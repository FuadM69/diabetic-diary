/** Glucose reading offered for the bolus helper (never auto-applied after mount except initial state). */
export type BolusGlucoseSuggestion = {
  value: number;
  measuredAt: string;
  /** Explains sourcing for UI copy. */
  scope: "at_or_before_meal" | "latest_global";
};

/** Display-only context when bolus is tied to a journal meal (URL or recent chip). */
export type BolusMealContext = {
  mealTypeLabel: string;
  eatenAtDisplay: string;
  /** Carbs from journal (sum of meal items), for transparency; field below may differ. */
  carbsGrams: number;
};

/**
 * Serializable meal summary for bolus helper (recent-meal chips).
 */
export type BolusRecentMealOption = {
  id: string;
  eatenAt: string;
  mealType: string;
  mealTypeLabel: string;
  totalCarbs: number;
  /** Latest glucose at or before `eatenAt`; null if none in journal. */
  suggestGlucoseValue: number | null;
  suggestGlucoseMeasuredAt: string | null;
};
