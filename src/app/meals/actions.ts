"use server";

import { revalidatePath } from "next/cache";
import { createMealEntry } from "@/lib/db/meals";
import { getUserSettings } from "@/lib/db/settings";
import { createClient } from "@/lib/supabase/server";
import { parseMealCreationForm } from "@/lib/utils/meal-form";

export type MealActionResult = {
  success: boolean;
  error: string | null;
};

export async function createMealEntryAction(
  formData: FormData
): Promise<MealActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.error("[meals] auth.getUser:", authError);
    return {
      success: false,
      error: "Не удалось проверить вход. Попробуйте войти снова.",
    };
  }

  if (!user) {
    return { success: false, error: "Нужно войти в аккаунт." };
  }

  const settings = await getUserSettings(user.id);
  const parsed = parseMealCreationForm(formData, settings.timezone);
  if (!parsed.ok) {
    return { success: false, error: parsed.message };
  }

  const result = await createMealEntry(user.id, parsed.data);

  if (!result.ok) {
    console.error("[meals] create failed:", result.errorMessage);
    return {
      success: false,
      error: result.errorMessage || "Не удалось сохранить приём пищи.",
    };
  }

  revalidatePath("/meals");
  return { success: true, error: null };
}
