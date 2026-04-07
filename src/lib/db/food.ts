/**
 * Food catalog: public products (`is_public`) or rows created by the user
 * (`created_by = userId`). **RLS** should allow read for that OR rule and
 * insert/update/delete only where `created_by = auth.uid()` for private rows.
 *
 * `userId` is interpolated into `.or(...)` — must remain a trusted UUID from
 * auth (never raw user input).
 */
import type { FoodProduct, FoodProductInsert } from "@/lib/types/food";
import { createClient } from "@/lib/supabase/server";

export type GetFoodProductsOptions = {
  search?: string | null;
};

export async function getFoodProducts(
  userId: string,
  options?: GetFoodProductsOptions
): Promise<FoodProduct[]> {
  const supabase = await createClient();

  let q = supabase
    .from("food_products")
    .select(
      "id, name, brand, carbs_per_100g, calories_per_100g, protein_per_100g, fat_per_100g, created_by, is_public"
    )
    .or(`is_public.eq.true,created_by.eq.${userId}`);

  const term = options?.search?.trim();
  if (term && term.length > 0) {
    q = q.ilike("name", `%${term}%`);
  }

  const { data, error } = await q
    .order("name", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    throw error;
  }

  return (data as FoodProduct[]) ?? [];
}

export type CreateFoodProductResult =
  | { ok: true; row: FoodProduct }
  | { ok: false; errorMessage: string };

export async function createFoodProduct(
  userId: string,
  payload: FoodProductInsert
): Promise<CreateFoodProductResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("food_products")
    .insert({
      name: payload.name,
      brand: payload.brand,
      carbs_per_100g: payload.carbs_per_100g,
      calories_per_100g: payload.calories_per_100g,
      protein_per_100g: payload.protein_per_100g,
      fat_per_100g: payload.fat_per_100g,
      created_by: userId,
      is_public: false,
    })
    .select(
      "id, name, brand, carbs_per_100g, calories_per_100g, protein_per_100g, fat_per_100g, created_by, is_public"
    )
    .maybeSingle();

  if (error) {
    return { ok: false, errorMessage: error.message };
  }

  if (!data) {
    return {
      ok: false,
      errorMessage:
        "Не удалось сохранить продукт. Проверьте права доступа к таблице.",
    };
  }

  return { ok: true, row: data as FoodProduct };
}

/** Products visible to the user (public or own), subset by ids. */
export async function getFoodProductsByIdsForUser(
  userId: string,
  ids: string[]
): Promise<Map<string, FoodProduct>> {
  const unique = [...new Set(ids)].filter(Boolean);
  const map = new Map<string, FoodProduct>();
  if (unique.length === 0) {
    return map;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("food_products")
    .select(
      "id, name, brand, carbs_per_100g, calories_per_100g, protein_per_100g, fat_per_100g, created_by, is_public"
    )
    .in("id", unique)
    .or(`is_public.eq.true,created_by.eq.${userId}`);

  if (error) {
    throw error;
  }

  for (const row of (data as FoodProduct[]) ?? []) {
    map.set(row.id, row);
  }

  return map;
}
