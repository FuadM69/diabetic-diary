/**
 * Nutrition amounts from per-100g values (single source for meal_items totals).
 */
export function roundMealNutrition(n: number): number {
  return Math.round(n * 100) / 100;
}

export function carbsFromPer100gAndGrams(
  carbsPer100g: number,
  grams: number
): number {
  return roundMealNutrition((carbsPer100g * grams) / 100);
}

export function caloriesFromPer100gAndGrams(
  caloriesPer100g: number,
  grams: number
): number {
  return roundMealNutrition((caloriesPer100g * grams) / 100);
}

export function sumCarbsFromItems(
  items: ReadonlyArray<{ carbs_total: number }>
): number {
  const s = items.reduce((a, i) => a + i.carbs_total, 0);
  return roundMealNutrition(s);
}

export function sumCaloriesFromItems(
  items: ReadonlyArray<{ calories_total: number }>
): number {
  const s = items.reduce((a, i) => a + i.calories_total, 0);
  return roundMealNutrition(s);
}
