"use server";

import { revalidatePath } from "next/cache";
import {
  createInsulinEntry,
  deleteInsulinEntry,
  updateInsulinEntry,
} from "@/lib/db/insulin";
import { getUserSettings } from "@/lib/db/settings";
import { createClient } from "@/lib/supabase/server";
import { parseGlucoseEntryId } from "@/lib/utils/glucose";
import {
  parseInsulinCreateForm,
  parseInsulinUpdateForm,
} from "@/lib/utils/insulin-form";

export type InsulinActionResult = {
  success: boolean;
  error: string | null;
};

export async function createInsulinEntryAction(
  formData: FormData
): Promise<InsulinActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.error("[insulin] auth.getUser:", authError);
    return {
      success: false,
      error: "Не удалось проверить вход. Попробуйте войти снова.",
    };
  }

  if (!user) {
    return { success: false, error: "Нужно войти в аккаунт." };
  }

  const settings = await getUserSettings(user.id);
  const parsed = parseInsulinCreateForm(formData, settings.timezone);
  if (!parsed.ok) {
    return { success: false, error: parsed.message };
  }

  const result = await createInsulinEntry(user.id, parsed.data);

  if (!result.ok) {
    console.error("[insulin] create failed:", result.errorMessage);
    return {
      success: false,
      error:
        result.errorMessage || "Не удалось сохранить запись. Попробуйте ещё раз.",
    };
  }

  revalidatePath("/insulin");
  return { success: true, error: null };
}

export async function updateInsulinEntryAction(
  formData: FormData
): Promise<InsulinActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.error("[insulin] edit auth.getUser:", authError);
    return {
      success: false,
      error: "Не удалось проверить вход. Попробуйте войти снова.",
    };
  }

  if (!user) {
    return { success: false, error: "Нужно войти в аккаунт." };
  }

  const settings = await getUserSettings(user.id);
  const parsed = parseInsulinUpdateForm(formData, settings.timezone);
  if (!parsed.ok) {
    return { success: false, error: parsed.message };
  }

  const result = await updateInsulinEntry(user.id, parsed.data);

  if (!result.ok) {
    console.error("[insulin] update failed:", result.errorMessage);
    return {
      success: false,
      error: result.errorMessage || "Не удалось сохранить изменения.",
    };
  }

  revalidatePath("/insulin");
  return { success: true, error: null };
}

export async function deleteInsulinEntryAction(
  formData: FormData
): Promise<InsulinActionResult> {
  const idParsed = parseGlucoseEntryId(formData.get("entryId"));
  if (!idParsed.ok) {
    return { success: false, error: idParsed.message };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.error("[insulin] delete auth.getUser:", authError);
    return {
      success: false,
      error: "Не удалось проверить вход. Попробуйте войти снова.",
    };
  }

  if (!user) {
    return { success: false, error: "Нужно войти в аккаунт." };
  }

  const result = await deleteInsulinEntry(user.id, idParsed.entryId);

  if (!result.ok) {
    console.error("[insulin] delete failed:", result.errorMessage);
    return {
      success: false,
      error: result.errorMessage || "Не удалось удалить запись.",
    };
  }

  revalidatePath("/insulin");
  return { success: true, error: null };
}
