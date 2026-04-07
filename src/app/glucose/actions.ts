"use server";

import { revalidatePath } from "next/cache";
import {
  deleteGlucoseEntry,
  insertGlucoseEntry,
  updateGlucoseEntry,
} from "@/lib/db/glucose";
import { getUserSettings } from "@/lib/db/settings";
import { createClient } from "@/lib/supabase/server";
import {
  parseGlucoseEntryId,
  parseGlucoseFormValue,
  parseGlucoseMeasuredAt,
  parseGlucoseNote,
  parseGlucoseSource,
} from "@/lib/utils/glucose";

export type GlucoseSubmitResult = {
  success: boolean;
  error: string | null;
};

export async function submitGlucoseEntry(
  formData: FormData
): Promise<GlucoseSubmitResult> {
  const parsed = parseGlucoseFormValue(formData.get("glucoseValue"));
  if (!parsed.ok) {
    return { success: false, error: parsed.message };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.error("[glucose] auth.getUser:", authError);
    return {
      success: false,
      error: "Не удалось проверить вход. Попробуйте войти снова.",
    };
  }

  if (!user) {
    return { success: false, error: "Нужно войти в аккаунт." };
  }

  const settings = await getUserSettings(user.id);

  const noteParsed = parseGlucoseNote(formData.get("note"));
  if (!noteParsed.ok) {
    return { success: false, error: noteParsed.message };
  }
  const sourceParsed = parseGlucoseSource(formData.get("source"));
  if (!sourceParsed.ok) {
    return { success: false, error: sourceParsed.message };
  }

  const measuredAtParsed = parseGlucoseMeasuredAt(
    formData.get("measuredAt"),
    settings.timezone
  );
  if (!measuredAtParsed.ok) {
    return { success: false, error: measuredAtParsed.message };
  }

  const insertResult = await insertGlucoseEntry(user.id, {
    glucoseValue: parsed.value,
    measuredAtIso: measuredAtParsed.iso,
    note: noteParsed.note,
    source: sourceParsed.source,
  });

  if (!insertResult.ok) {
    console.error("[glucose] insert failed:", insertResult.errorMessage);
    return {
      success: false,
      error:
        insertResult.errorMessage ||
        "Не удалось сохранить запись. Попробуйте ещё раз.",
    };
  }

  revalidatePath("/glucose");
  return { success: true, error: null };
}

export async function editGlucoseEntryAction(
  formData: FormData
): Promise<GlucoseSubmitResult> {
  const idParsed = parseGlucoseEntryId(formData.get("entryId"));
  if (!idParsed.ok) {
    return { success: false, error: idParsed.message };
  }

  const valueParsed = parseGlucoseFormValue(formData.get("glucoseValue"));
  if (!valueParsed.ok) {
    return { success: false, error: valueParsed.message };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.error("[glucose] edit auth.getUser:", authError);
    return {
      success: false,
      error: "Не удалось проверить вход. Попробуйте войти снова.",
    };
  }

  if (!user) {
    return { success: false, error: "Нужно войти в аккаунт." };
  }

  const settings = await getUserSettings(user.id);

  const noteParsed = parseGlucoseNote(formData.get("note"));
  if (!noteParsed.ok) {
    return { success: false, error: noteParsed.message };
  }

  const measuredAtParsed = parseGlucoseMeasuredAt(
    formData.get("measuredAt"),
    settings.timezone
  );
  if (!measuredAtParsed.ok) {
    return { success: false, error: measuredAtParsed.message };
  }

  const result = await updateGlucoseEntry(user.id, idParsed.entryId, {
    glucoseValue: valueParsed.value,
    measuredAtIso: measuredAtParsed.iso,
    note: noteParsed.note,
  });

  if (!result.ok) {
    console.error("[glucose] update failed:", result.errorMessage);
    return {
      success: false,
      error: result.errorMessage || "Не удалось сохранить изменения.",
    };
  }

  revalidatePath("/glucose");
  return { success: true, error: null };
}

export async function deleteGlucoseEntryAction(
  formData: FormData
): Promise<GlucoseSubmitResult> {
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
    console.error("[glucose] delete auth.getUser:", authError);
    return {
      success: false,
      error: "Не удалось проверить вход. Попробуйте войти снова.",
    };
  }

  if (!user) {
    return { success: false, error: "Нужно войти в аккаунт." };
  }

  const result = await deleteGlucoseEntry(user.id, idParsed.entryId);

  if (!result.ok) {
    console.error("[glucose] delete failed:", result.errorMessage);
    return {
      success: false,
      error: result.errorMessage || "Не удалось удалить запись.",
    };
  }

  revalidatePath("/glucose");
  return { success: true, error: null };
}
