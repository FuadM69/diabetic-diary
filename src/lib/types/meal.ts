export type MealEntryRow = {
  id: string;
  user_id: string;
  eaten_at: string;
  meal_type: string;
  note: string | null;
};

export type MealItemRow = {
  id: string;
  user_id: string;
  meal_entry_id: string;
  food_product_id: string;
  grams: number;
  carbs_total: number;
  calories_total: number;
};

export type MealItemWithProductPreview = MealItemRow & {
  productName: string;
  productBrand: string | null;
};

export type MealEntryWithItems = MealEntryRow & {
  meal_items: MealItemWithProductPreview[];
};

export const MEAL_TYPE_KEYS = [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
] as const;

export type MealTypeKey = (typeof MEAL_TYPE_KEYS)[number];

export const MEAL_TYPE_LABEL_RU: Record<MealTypeKey, string> = {
  breakfast: "Завтрак",
  lunch: "Обед",
  dinner: "Ужин",
  snack: "Перекус",
};

export type MealCreateItemInput = {
  food_product_id: string;
  grams: number;
};

export type MealCreateInput = {
  eaten_at: string;
  meal_type: MealTypeKey;
  note: string | null;
  items: MealCreateItemInput[];
};
