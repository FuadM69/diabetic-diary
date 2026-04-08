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
};
