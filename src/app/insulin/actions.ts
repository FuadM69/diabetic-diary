"use server";

import { revalidatePath } from "next/cache";
import {
  createInsulinEntry,
  deleteInsulinEntry,
  updateInsulinEntry,
} from "@/lib/db/insulin";
import { getUserSettings } from "@/lib/db/settings";
import { createClient } from "@/lib/supabase/server";
import { formatUtcIsoForUserDisplay } from "@/lib/utils/datetime-local-tz";
import { parseGlucoseEntryId } from "@/lib/utils/glucose";
import { explainLogRangeTimeZone } from "@/lib/utils/log-range-bounds";
import { INSULIN_ENTRY_TYPE_LABEL_RU } from "@/lib/utils/insulin";
import {
  isInsulinDebugLogEnabled,
  parseInsulinCreateForm,
  parseInsulinUpdateForm,
} from "@/lib/utils/insulin-form";

export type InsulinActionResult = {
  success: boolean;
  error: string | null;
  /** Set on successful create/update — same clock interpretation as list/cards (settings timezone). */
  savedEntryTypeLabel?: string | null;
  savedTakenAtDisplay?: string | null;
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
    if (isInsulinDebugLogEnabled()) {
      console.log(
        "[insulin][create]",
        JSON.stringify({
          step: "parse_failed",
          message: parsed.message,
          form: Object.fromEntries(formData.entries()),
          timezoneRaw: settings.timezone,
          timezoneResolved: explainLogRangeTimeZone(settings.timezone),
        })
      );
    }
    return { success: false, error: parsed.message };
  }

  if (isInsulinDebugLogEnabled()) {
    console.log(
      "[insulin][create]",
      JSON.stringify({
        step: "pre_insert",
        user_id: user.id,
        entry_type: parsed.data.entry_type,
        taken_at_utc: parsed.data.taken_at,
        units: parsed.data.units,
        insulin_name: parsed.data.insulin_name,
        note_preview:
          parsed.data.note != null ?
            `${parsed.data.note.slice(0, 80)}${parsed.data.note.length > 80 ? "…" : ""}`
          : null,
        datetime_local_submitted: String(formData.get("taken_at") ?? ""),
        timezoneRaw: settings.timezone,
        timezoneResolved: explainLogRangeTimeZone(settings.timezone),
        /**
         * Basal / bolus / correction share this exact path — no branch on type.
         */
        code_path: "parseInsulinCreateForm → createInsulinEntry (identical for all types)",
      })
    );
  }

  const result = await createInsulinEntry(user.id, parsed.data);

  if (isInsulinDebugLogEnabled()) {
    console.log(
      "[insulin][create]",
      JSON.stringify({
        step: result.ok ? "insert_ok" : "insert_failed",
        user_id: user.id,
        entry_type: parsed.data.entry_type,
        taken_at_utc_sent: parsed.data.taken_at,
        row: result.ok ?
          {
            id: result.row?.id,
            taken_at: result.row?.taken_at,
            entry_type: result.row?.entry_type,
            user_id: result.row?.user_id,
          }
        : null,
        errorMessage: result.ok ? null : result.errorMessage,
      })
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
  const row = result.row!;
  return {
    success: true,
    error: null,
    savedEntryTypeLabel: INSULIN_ENTRY_TYPE_LABEL_RU[row.entry_type],
    savedTakenAtDisplay: formatUtcIsoForUserDisplay(
      row.taken_at,
      settings.timezone
    ),
  };
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
  const row = result.row!;
  return {
    success: true,
    error: null,
    savedEntryTypeLabel: INSULIN_ENTRY_TYPE_LABEL_RU[row.entry_type],
    savedTakenAtDisplay: formatUtcIsoForUserDisplay(
      row.taken_at,
      settings.timezone
    ),
  };
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
