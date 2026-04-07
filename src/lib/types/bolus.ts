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
