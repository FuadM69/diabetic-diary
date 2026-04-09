"use server";

import { revalidatePath } from "next/cache";
import {
  createFoodProduct,
  deleteFoodProduct,
  updateFoodProduct,
} from "@/lib/db/food";
import { createClient } from "@/lib/supabase/server";
import {
  parseFoodProductForm,
  parseUpdateFoodProductForm,
} from "@/lib/utils/food-form";

export type FoodActionResult = {
  success: boolean;
  error: string | null;
};

export async function createFoodProductAction(
  formData: FormData
): Promise<FoodActionResult> {
  const parsed = parseFoodProductForm(formData);
  if (!parsed.ok) {
    return { success: false, error: parsed.message };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.error("[food] auth.getUser:", authError);
    return {
      success: false,
      error: "Не удалось проверить вход. Попробуйте войти снова.",
    };
  }

  if (!user) {
    return { success: false, error: "Нужно войти в аккаунт." };
  }

  const result = await createFoodProduct(user.id, parsed.data);

  if (!result.ok) {
    console.error("[food] create failed:", result.errorMessage);
    return {
      success: false,
      error: result.errorMessage || "Не удалось сохранить продукт.",
    };
  }

  revalidatePath("/food");
  return { success: true, error: null };
}

export async function deleteFoodProductAction(
  formData: FormData
): Promise<FoodActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: "Нужно войти в аккаунт.",
    };
  }

  const rawId = formData.get("productId");
  if (rawId === null || typeof rawId !== "string" || rawId.trim() === "") {
    return { success: false, error: "Не указан продукт." };
  }
  const productId = rawId.trim();

  const result = await deleteFoodProduct(user.id, productId);
  if (!result.ok) {
    return {
      success: false,
      error: result.errorMessage || "Не удалось удалить продукт.",
    };
  }

  revalidatePath("/food");
  revalidatePath("/meals");
  return { success: true, error: null };
}

export async function updateFoodProductAction(
  formData: FormData
): Promise<FoodActionResult> {
  const parsed = parseUpdateFoodProductForm(formData);
  if (!parsed.ok) {
    return { success: false, error: parsed.message };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.error("[food] update auth.getUser:", authError);
    return {
      success: false,
      error: "Не удалось проверить вход. Попробуйте войти снова.",
    };
  }

  if (!user) {
    return { success: false, error: "Нужно войти в аккаунт." };
  }

  if (process.env.FOOD_DEBUG === "1") {
    const { productId, ...fields } = parsed.data;
    console.log(
      "[food][update] payload:",
      JSON.stringify({ productId, fields })
    );
  }

  const result = await updateFoodProduct(user.id, parsed.data);

  if (process.env.FOOD_DEBUG === "1") {
    console.log(
      "[food][update] result:",
      result.ok ? `ok id=${result.row.id}` : result.errorMessage
    );
  }

  if (!result.ok) {
    console.error("[food] update failed:", result.errorMessage);
    return {
      success: false,
      error:
        result.errorMessage || "Не удалось сохранить изменения продукта.",
    };
  }

  revalidatePath("/food");
  return { success: true, error: null };
}
