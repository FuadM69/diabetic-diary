/**
 * Meals: `meal_entries` and `meal_items` both carry `user_id` for RLS
 * (`auth.uid() = user_id` on items). See Supabase migration.
 */
import type { FoodProduct } from "@/lib/types/food";
import type {
  MealCreateInput,
  MealEntryRow,
  MealEntryWithItems,
  MealItemRow,
} from "@/lib/types/meal";
import { createClient } from "@/lib/supabase/server";
import { getFoodProducts, getFoodProductsByIdsForUser } from "./food";
import {
  caloriesFromPer100gAndGrams,
  carbsFromPer100gAndGrams,
} from "@/lib/utils/meal-nutrition";

const MEAL_ITEM_SELECT =
  "id, user_id, meal_entry_id, food_product_id, grams, carbs_total, calories_total";

export async function getSelectableFoodProducts(
  userId: string,
  search?: string | null
): Promise<FoodProduct[]> {
  return getFoodProducts(userId, {
    search: search?.trim() ? search.trim() : undefined,
  });
}

export type CreateMealResult =
  | { ok: true; mealId: string }
  | { ok: false; errorMessage: string };

export async function createMealEntry(
  userId: string,
  payload: MealCreateInput
): Promise<CreateMealResult> {
  const supabase = await createClient();

  const productIds = [...new Set(payload.items.map((i) => i.food_product_id))];
  let productMap: Map<string, FoodProduct>;
  try {
    productMap = await getFoodProductsByIdsForUser(userId, productIds);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ошибка загрузки продуктов.";
    return { ok: false, errorMessage: msg };
  }

  for (const id of productIds) {
    if (!productMap.has(id)) {
      return {
        ok: false,
        errorMessage:
          "Один из продуктов недоступен или удалён. Обновите список блюд.",
      };
    }
  }

  const { data: meal, error: mealErr } = await supabase
    .from("meal_entries")
    .insert({
      user_id: userId,
      eaten_at: payload.eaten_at,
      meal_type: payload.meal_type,
      note: payload.note,
    })
    .select("id")
    .maybeSingle();

  if (mealErr || !meal) {
    return {
      ok: false,
      errorMessage: mealErr?.message ?? "Не удалось создать приём пищи.",
    };
  }

  const mealId = (meal as { id: string }).id;

  const itemRows = payload.items.map((item) => {
    const p = productMap.get(item.food_product_id)!;
    return {
      user_id: userId,
      meal_entry_id: mealId,
      food_product_id: item.food_product_id,
      grams: item.grams,
      carbs_total: carbsFromPer100gAndGrams(p.carbs_per_100g, item.grams),
      calories_total: caloriesFromPer100gAndGrams(
        p.calories_per_100g,
        item.grams
      ),
    };
  });

  const { error: itemsErr } = await supabase.from("meal_items").insert(itemRows);

  if (itemsErr) {
    await supabase.from("meal_entries").delete().eq("id", mealId);
    return {
      ok: false,
      errorMessage: itemsErr.message || "Не удалось сохранить состав блюда.",
    };
  }

  return { ok: true, mealId };
}

function assembleMealsWithItems(
  meals: MealEntryRow[],
  items: MealItemRow[],
  productNames: Map<string, { name: string; brand: string | null }>
): MealEntryWithItems[] {
  const itemsByMeal = new Map<string, MealItemRow[]>();
  for (const item of items) {
    const list = itemsByMeal.get(item.meal_entry_id) ?? [];
    list.push(item);
    itemsByMeal.set(item.meal_entry_id, list);
  }

  return meals.map((m) => {
    const mealItems = (itemsByMeal.get(m.id) ?? []).map((it) => {
      const meta = productNames.get(it.food_product_id);
      return {
        ...it,
        productName: meta?.name ?? "Продукт",
        productBrand: meta?.brand ?? null,
      };
    });
    return { ...m, meal_items: mealItems };
  });
}

export type GetMealEntriesOptions = {
  /** Inclusive lower bound on `eaten_at` (ISO). Omit or `null` = no date filter. */
  eatenAtGte?: string | null;
};

export async function getMealEntries(
  userId: string,
  options?: GetMealEntriesOptions
): Promise<MealEntryWithItems[]> {
  const supabase = await createClient();

  let q = supabase
    .from("meal_entries")
    .select("id, user_id, eaten_at, meal_type, note")
    .eq("user_id", userId);

  const from = options?.eatenAtGte;
  if (typeof from === "string" && from.length > 0) {
    q = q.gte("eaten_at", from);
  }

  const { data: meals, error: mealsErr } = await q.order("eaten_at", {
    ascending: false,
  });

  if (mealsErr) {
    throw mealsErr;
  }

  const mealList = (meals as MealEntryRow[]) ?? [];
  if (mealList.length === 0) {
    return [];
  }

  const mealIds = mealList.map((m) => m.id);

  const { data: items, error: itemsErr } = await supabase
    .from("meal_items")
    .select(MEAL_ITEM_SELECT)
    .in("meal_entry_id", mealIds);

  if (itemsErr) {
    throw itemsErr;
  }

  const itemList = (items as MealItemRow[]) ?? [];
  const productIds = [...new Set(itemList.map((i) => i.food_product_id))];

  let productNames = new Map<string, { name: string; brand: string | null }>();
  if (productIds.length > 0) {
    const { data: products, error: pErr } = await supabase
      .from("food_products")
      .select("id, name, brand")
      .in("id", productIds);

    if (pErr) {
      throw pErr;
    }

    productNames = new Map(
      ((products as { id: string; name: string; brand: string | null }[]) ?? []).map(
        (p) => [p.id, { name: p.name, brand: p.brand }]
      )
    );
  }

  return assembleMealsWithItems(mealList, itemList, productNames);
}

const RECENT_MEALS_CAP = 50;

/**
 * Recent meals (newest first), for pickers / helpers. Caps `limit` for safety.
 */
export async function getRecentMealEntries(
  userId: string,
  limit: number
): Promise<MealEntryWithItems[]> {
  const safeLimit = Math.min(
    Math.max(1, Math.floor(limit)),
    RECENT_MEALS_CAP
  );

  const supabase = await createClient();

  const { data: meals, error: mealsErr } = await supabase
    .from("meal_entries")
    .select("id, user_id, eaten_at, meal_type, note")
    .eq("user_id", userId)
    .order("eaten_at", { ascending: false })
    .limit(safeLimit);

  if (mealsErr) {
    throw mealsErr;
  }

  const mealList = (meals as MealEntryRow[]) ?? [];
  if (mealList.length === 0) {
    return [];
  }

  const mealIds = mealList.map((m) => m.id);

  const { data: items, error: itemsErr } = await supabase
    .from("meal_items")
    .select(MEAL_ITEM_SELECT)
    .in("meal_entry_id", mealIds);

  if (itemsErr) {
    throw itemsErr;
  }

  const itemList = (items as MealItemRow[]) ?? [];
  const productIds = [...new Set(itemList.map((i) => i.food_product_id))];

  let productNames = new Map<string, { name: string; brand: string | null }>();
  if (productIds.length > 0) {
    const { data: products, error: pErr } = await supabase
      .from("food_products")
      .select("id, name, brand")
      .in("id", productIds);

    if (pErr) {
      throw pErr;
    }

    productNames = new Map(
      ((products as { id: string; name: string; brand: string | null }[]) ?? []).map(
        (p) => [p.id, { name: p.name, brand: p.brand }]
      )
    );
  }

  return assembleMealsWithItems(mealList, itemList, productNames);
}

export async function getMealEntryDetails(
  userId: string,
  mealEntryId: string
): Promise<MealEntryWithItems | null> {
  const supabase = await createClient();

  const { data: meal, error: mealErr } = await supabase
    .from("meal_entries")
    .select("id, user_id, eaten_at, meal_type, note")
    .eq("id", mealEntryId)
    .eq("user_id", userId)
    .maybeSingle();

  if (mealErr) {
    throw mealErr;
  }

  if (!meal) {
    return null;
  }

  const { data: items, error: itemsErr } = await supabase
    .from("meal_items")
    .select(MEAL_ITEM_SELECT)
    .eq("meal_entry_id", mealEntryId);

  if (itemsErr) {
    throw itemsErr;
  }

  const itemList = (items as MealItemRow[]) ?? [];
  const productIds = [...new Set(itemList.map((i) => i.food_product_id))];

  let productNames = new Map<string, { name: string; brand: string | null }>();
  if (productIds.length > 0) {
    const { data: products, error: pErr } = await supabase
      .from("food_products")
      .select("id, name, brand")
      .in("id", productIds);

    if (pErr) {
      throw pErr;
    }

    productNames = new Map(
      ((products as { id: string; name: string; brand: string | null }[]) ?? []).map(
        (p) => [p.id, { name: p.name, brand: p.brand }]
      )
    );
  }

  const [assembled] = assembleMealsWithItems(
    [meal as MealEntryRow],
    itemList,
    productNames
  );
  return assembled ?? null;
}
