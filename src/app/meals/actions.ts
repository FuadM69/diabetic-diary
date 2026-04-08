"use server";

import { revalidatePath } from "next/cache";
import {
  createMealEntry,
  deleteMealEntry,
  updateMealEntry,
} from "@/lib/db/meals";
import { getUserSettings } from "@/lib/db/settings";
import { createClient } from "@/lib/supabase/server";
import {
  parseMealCreationForm,
  parseMealEntryId,
  parseMealUpdateForm,
} from "@/lib/utils/meal-form";

export type MealActionResult = {
  success: boolean;
  error: string | null;
  /** Set only after successful **create** — for deep link to /bolus. */
  createdMealId?: string | null;
  createdTotalCarbs?: number | null;
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
  return {
    success: true,
    error: null,
    createdMealId: result.mealId,
    createdTotalCarbs: result.totalCarbs,
  };
}

export async function editMealEntryAction(
  formData: FormData
): Promise<MealActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.error("[meals] edit auth.getUser:", authError);
    return {
      success: false,
      error: "Не удалось проверить вход. Попробуйте войти снова.",
    };
  }

  if (!user) {
    return { success: false, error: "Нужно войти в аккаунт." };
  }

  const settings = await getUserSettings(user.id);
  const parsed = parseMealUpdateForm(formData, settings.timezone);
  if (!parsed.ok) {
    return { success: false, error: parsed.message };
  }

  const { mealEntryId, ...payload } = parsed.data;
  const result = await updateMealEntry(user.id, mealEntryId, payload);

  if (!result.ok) {
    console.error("[meals] update failed:", result.errorMessage);
    return {
      success: false,
      error: result.errorMessage || "Не удалось сохранить изменения.",
    };
  }

  revalidatePath("/meals");
  return { success: true, error: null };
}

export async function deleteMealEntryAction(
  formData: FormData
): Promise<MealActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.error("[meals] delete auth.getUser:", authError);
    return {
      success: false,
      error: "Не удалось проверить вход. Попробуйте войти снова.",
    };
  }

  if (!user) {
    return { success: false, error: "Нужно войти в аккаунт." };
  }

  const idParsed = parseMealEntryId(formData.get("mealEntryId"));
  if (!idParsed.ok) {
    return { success: false, error: idParsed.message };
  }

  const result = await deleteMealEntry(user.id, idParsed.mealEntryId);

  if (!result.ok) {
    console.error("[meals] delete failed:", result.errorMessage);
    return {
      success: false,
      error: result.errorMessage || "Не удалось удалить приём пищи.",
    };
  }

  revalidatePath("/meals");
  return { success: true, error: null };
}
