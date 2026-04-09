"use server";

import { revalidatePath } from "next/cache";
import { updateUserSettings } from "@/lib/db/settings";
import { createClient } from "@/lib/supabase/server";
import { parseUserSettingsForm } from "@/lib/utils/settings-form";

export type SettingsActionResult = {
  success: boolean;
  error: string | null;
};

export async function updateUserSettingsAction(
  formData: FormData
): Promise<SettingsActionResult> {
  const parsed = parseUserSettingsForm(formData);
  if (!parsed.ok) {
    return { success: false, error: parsed.message };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.error("[settings] auth.getUser:", authError);
    return {
      success: false,
      error: "Не удалось проверить вход. Попробуйте войти снова.",
    };
  }

  if (!user) {
    return { success: false, error: "Нужно войти в аккаунт." };
  }

  const result = await updateUserSettings(user.id, parsed.data);

  if (!result.ok) {
    console.error("[settings] update failed:", result.errorMessage);
    return {
      success: false,
      error: result.errorMessage || "Не удалось сохранить настройки.",
    };
  }

  revalidatePath("/");
  revalidatePath("/bolus");
  revalidatePath("/glucose");
  revalidatePath("/settings");

  return { success: true, error: null };
}
