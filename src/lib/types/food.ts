/** Row from `public.food_products` (selected columns). */
export type FoodProduct = {
  id: string;
  name: string;
  brand: string | null;
  carbs_per_100g: number;
  calories_per_100g: number;
  protein_per_100g: number;
  fat_per_100g: number;
  created_by: string | null;
  is_public: boolean;
};

export type FoodProductInsert = {
  name: string;
  brand: string | null;
  carbs_per_100g: number;
  calories_per_100g: number;
  protein_per_100g: number;
  fat_per_100g: number;
};

/** Update payload: same fields as insert plus row id (owned rows only in DB). */
export type FoodProductUpdate = FoodProductInsert & {
  productId: string;
};
