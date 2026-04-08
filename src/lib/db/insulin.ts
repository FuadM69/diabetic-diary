/**
 * Insulin entries — **RLS:** `user_id = auth.uid()` for all operations.
 */
import { createClient } from "@/lib/supabase/server";
import type { InsulinEntry } from "@/lib/types/insulin";
import type {
  InsulinFormParsed,
  InsulinUpdateFormParsed,
} from "@/lib/utils/insulin-form";
import { normalizeInsulinEntryType } from "@/lib/utils/insulin";
import { isInsulinDebugLogEnabled } from "@/lib/utils/insulin-form";

function mapInsulinRow(row: InsulinEntry): InsulinEntry {
  const entry_type = normalizeInsulinEntryType(row.entry_type);
  if (entry_type) {
    return { ...row, entry_type };
  }
  if (process.env.NODE_ENV === "development") {
    console.warn(
      "[insulin] unknown entry_type from DB, using bolus for display:",
      row.entry_type
    );
  }
  return { ...row, entry_type: "bolus" };
}

export type GetInsulinEntriesOptions = {
  /** Inclusive lower bound on `taken_at` (ISO). Omit or `null` = no date filter. */
  takenAtGte?: string | null;
};

const INSULIN_SELECT =
  "id, user_id, taken_at, insulin_name, entry_type, units, note";

/**
 * PostgREST (Supabase) caps each **response** at the project’s max rows (often 1000).
 * A single `.select()` without pagination therefore returns only the first page — with
 * `order("taken_at", { ascending: false })` that is the newest N rows, and **older rows
 * never appear in `data`** even though they match `user_id` and `taken_at` filters.
 */
const INSULIN_FETCH_PAGE_SIZE = 1000;

export async function getInsulinEntries(
  userId: string,
  options?: GetInsulinEntriesOptions
): Promise<InsulinEntry[]> {
  const supabase = await createClient();

  const aggregated: InsulinEntry[] = [];

  for (let offset = 0; ; offset += INSULIN_FETCH_PAGE_SIZE) {
    let q = supabase
      .from("insulin_entries")
      .select(INSULIN_SELECT)
      .eq("user_id", userId);

    const from = options?.takenAtGte;
    if (typeof from === "string" && from.length > 0) {
      q = q.gte("taken_at", from);
    }

    const { data, error } = await q
      .order("taken_at", { ascending: false })
      .range(offset, offset + INSULIN_FETCH_PAGE_SIZE - 1);

    if (error) {
      throw error;
    }

    const batch = (data as InsulinEntry[]) ?? [];
    aggregated.push(...batch);

    if (batch.length < INSULIN_FETCH_PAGE_SIZE) {
      break;
    }
  }

  return aggregated.map(mapInsulinRow);
}

export type InsulinMutationResult =
  | { ok: true; row?: InsulinEntry }
  | { ok: false; errorMessage: string };

export async function createInsulinEntry(
  userId: string,
  payload: InsulinFormParsed
): Promise<InsulinMutationResult> {
  const supabase = await createClient();

  const insertPayload = {
    user_id: userId,
    taken_at: payload.taken_at,
    insulin_name: payload.insulin_name,
    entry_type: payload.entry_type,
    units: payload.units,
    note: payload.note,
  };

  if (isInsulinDebugLogEnabled()) {
    console.log(
      "[insulin][db][createInsulinEntry]",
      JSON.stringify({
        step: "supabase.insert",
        user_id: insertPayload.user_id,
        entry_type: insertPayload.entry_type,
        taken_at_utc: insertPayload.taken_at,
        units: insertPayload.units,
      })
    );
  }

  const { data, error } = await supabase
    .from("insulin_entries")
    .insert(insertPayload)
    .select(INSULIN_SELECT)
    .maybeSingle();

  if (isInsulinDebugLogEnabled()) {
    console.log(
      "[insulin][db][createInsulinEntry]",
      JSON.stringify({
        step: "supabase.response",
        has_error: error != null,
        error: error?.message ?? null,
        has_data: data != null,
        code: (error as { code?: string } | null)?.code ?? null,
      })
    );
  }

  if (error) {
    return { ok: false, errorMessage: error.message };
  }

  if (!data) {
    if (isInsulinDebugLogEnabled()) {
      console.warn(
        "[insulin][db][createInsulinEntry] empty row after insert — typical causes: RLS without RETURNING, or trigger swallowing row"
      );
    }
    return {
      ok: false,
      errorMessage:
        "Не удалось сохранить запись. Проверьте права доступа к таблице.",
    };
  }

  return { ok: true, row: mapInsulinRow(data as InsulinEntry) };
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

  return { ok: true, row: mapInsulinRow(data as InsulinEntry) };
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
