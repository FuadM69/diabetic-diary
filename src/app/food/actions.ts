"use server";

import { revalidatePath } from "next/cache";
import { createFoodProduct } from "@/lib/db/food";
import { createClient } from "@/lib/supabase/server";
import { parseFoodProductForm } from "@/lib/utils/food-form";

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
