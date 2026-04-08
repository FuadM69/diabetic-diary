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
import { explainLogRangeTimeZone } from "@/lib/utils/log-range-bounds";
import {
  isInsulinDebugLogEnabled,
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

  if (isInsulinDebugLogEnabled()) {
    const snapshot = Object.fromEntries(formData.entries());
    console.log("[insulin][create] FormData:", JSON.stringify(snapshot));
    console.log(
      "[insulin][create] settings.timezone raw:",
      JSON.stringify(settings.timezone)
    );
    console.log(
      "[insulin][create] timezone resolved:",
      JSON.stringify(explainLogRangeTimeZone(settings.timezone))
    );
  }

  const parsed = parseInsulinCreateForm(formData, settings.timezone);
  if (!parsed.ok) {
    if (isInsulinDebugLogEnabled()) {
      console.log("[insulin][create] parse failed:", parsed.message);
    }
    return { success: false, error: parsed.message };
  }

  if (isInsulinDebugLogEnabled()) {
    console.log(
      "[insulin][create] parsed payload:",
      JSON.stringify(parsed.data)
    );
    console.log(
      "[insulin][create] final taken_at UTC ISO:",
      parsed.data.taken_at
    );
  }

  const result = await createInsulinEntry(user.id, parsed.data);

  if (isInsulinDebugLogEnabled()) {
    console.log(
      "[insulin][create] DB result:",
      result.ok ? `ok id=${result.row?.id}` : result.errorMessage
    );
  }

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
