/**
 * Insulin entries — **RLS:** `user_id = auth.uid()` for all operations.
 */
import { createClient } from "@/lib/supabase/server";
import type { InsulinEntry } from "@/lib/types/insulin";
import type {
  InsulinFormParsed,
  InsulinUpdateFormParsed,
} from "@/lib/utils/insulin-form";

export type GetInsulinEntriesOptions = {
  /** Inclusive lower bound on `taken_at` (ISO). Omit or `null` = no date filter. */
  takenAtGte?: string | null;
};

const INSULIN_SELECT =
  "id, user_id, taken_at, insulin_name, entry_type, units, note";

export async function getInsulinEntries(
  userId: string,
  options?: GetInsulinEntriesOptions
): Promise<InsulinEntry[]> {
  const supabase = await createClient();

  let q = supabase
    .from("insulin_entries")
    .select(INSULIN_SELECT)
    .eq("user_id", userId);

  const from = options?.takenAtGte;
  if (typeof from === "string" && from.length > 0) {
    q = q.gte("taken_at", from);
  }

  const { data, error } = await q.order("taken_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data as InsulinEntry[]) ?? [];
}

export type InsulinMutationResult =
  | { ok: true; row?: InsulinEntry }
  | { ok: false; errorMessage: string };

export async function createInsulinEntry(
  userId: string,
  payload: InsulinFormParsed
): Promise<InsulinMutationResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("insulin_entries")
    .insert({
      user_id: userId,
      taken_at: payload.taken_at,
      insulin_name: payload.insulin_name,
      entry_type: payload.entry_type,
      units: payload.units,
      note: payload.note,
    })
    .select(INSULIN_SELECT)
    .maybeSingle();

  if (error) {
    return { ok: false, errorMessage: error.message };
  }

  if (!data) {
    return {
      ok: false,
      errorMessage:
        "Не удалось сохранить запись. Проверьте права доступа к таблице.",
    };
  }

  return { ok: true, row: data as InsulinEntry };
}

export async function updateInsulinEntry(
  userId: string,
  payload: InsulinUpdateFormParsed
): Promise<InsulinMutationResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("insulin_entries")
    .update({
      taken_at: payload.taken_at,
      insulin_name: payload.insulin_name,
      entry_type: payload.entry_type,
      units: payload.units,
      note: payload.note,
    })
    .eq("id", payload.entryId)
    .eq("user_id", userId)
    .select(INSULIN_SELECT)
    .maybeSingle();

  if (error) {
    return { ok: false, errorMessage: error.message };
  }

  if (!data) {
    return {
      ok: false,
      errorMessage: "Запись не найдена или нет прав на изменение.",
    };
  }

  return { ok: true, row: data as InsulinEntry };
}

export async function deleteInsulinEntry(
  userId: string,
  entryId: string
): Promise<InsulinMutationResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("insulin_entries")
    .delete()
    .eq("id", entryId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, errorMessage: error.message };
  }

  if (!data) {
    return {
      ok: false,
      errorMessage: "Запись не найдена или нет прав на удаление.",
    };
  }

  return { ok: true };
}
