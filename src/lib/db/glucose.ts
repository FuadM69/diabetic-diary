/**
 * Glucose persistence.
 *
 * **RLS:** `user_id = auth.uid()` for all operations (see Supabase migration).
 *
 * **Columns:** matches `public.glucose_entries` after migration
 * `20260407120000_glucose_source_note_meal_items_user_id.sql`.
 */
import type { GlucoseEntry } from "@/lib/types/glucose";
import { createClient } from "@/lib/supabase/server";
import { isDiaryLogRangeDebugEnabled } from "@/lib/utils/log-range-bounds";

const GLUCOSE_SELECT =
  "id, user_id, glucose_value, measured_at, source, note";

export type GetGlucoseEntriesOptions = {
  /** Inclusive lower bound on `measured_at` (ISO). Omit or `null` = no date filter. */
  measuredAtGte?: string | null;
};

export type NewGlucoseEntryInput = {
  glucoseValue: number;
  /** UTC ISO timestamp from validated `datetime-local` input. */
  measuredAtIso: string;
  note?: string | null;
  /** Defaults to `manual` when omitted. */
  source?: string;
};

export type UpdateGlucoseEntryInput = {
  glucoseValue: number;
  measuredAtIso: string;
  note?: string | null;
};

export async function getGlucoseEntries(
  userId: string,
  options?: GetGlucoseEntriesOptions
): Promise<GlucoseEntry[]> {
  const supabase = await createClient();

  let q = supabase
    .from("glucose_entries")
    .select(GLUCOSE_SELECT)
    .eq("user_id", userId);

  const from = options?.measuredAtGte;
  if (typeof from === "string" && from.length > 0) {
    if (isDiaryLogRangeDebugEnabled()) {
      console.log(
        "[glucose][getGlucoseEntries] .gte(measured_at, bound)",
        from
      );
    }
    q = q.gte("measured_at", from);
  }

  const { data, error } = await q.order("measured_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data as GlucoseEntry[]) ?? [];
}

/** Latest reading for the user (by `measured_at` desc). */
export async function getLatestGlucoseEntry(
  userId: string
): Promise<GlucoseEntry | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("glucose_entries")
    .select(GLUCOSE_SELECT)
    .eq("user_id", userId)
    .order("measured_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? (data as GlucoseEntry) : null;
}

/** Latest reading at or before `measuredAtLte` (ISO), by `measured_at` desc. */
export async function getLatestGlucoseEntryAtOrBefore(
  userId: string,
  measuredAtLte: string
): Promise<GlucoseEntry | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("glucose_entries")
    .select(GLUCOSE_SELECT)
    .eq("user_id", userId)
    .lte("measured_at", measuredAtLte)
    .order("measured_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? (data as GlucoseEntry) : null;
}

export type InsertGlucoseEntryResult =
  | { ok: true; rows: GlucoseEntry[] }
  | { ok: false; errorMessage: string };

export async function insertGlucoseEntry(
  userId: string,
  input: NewGlucoseEntryInput
): Promise<InsertGlucoseEntryResult> {
  const supabase = await createClient();

  const source =
    typeof input.source === "string" && input.source.trim().length > 0
      ? input.source.trim()
      : "manual";

  const { data, error } = await supabase
    .from("glucose_entries")
    .insert({
      user_id: userId,
      glucose_value: input.glucoseValue,
      measured_at: input.measuredAtIso,
      source,
      note: input.note ?? null,
    })
    .select(GLUCOSE_SELECT);

  if (error) {
    return { ok: false, errorMessage: error.message };
  }

  if (!data || data.length === 0) {
    return {
      ok: false,
      errorMessage:
        "Не удалось сохранить запись. Проверьте права доступа к таблице.",
    };
  }

  return { ok: true, rows: data as GlucoseEntry[] };
}

export type GlucoseEntryMutationResult =
  | { ok: true; row?: GlucoseEntry }
  | { ok: false; errorMessage: string };

export async function updateGlucoseEntry(
  userId: string,
  entryId: string,
  input: UpdateGlucoseEntryInput
): Promise<GlucoseEntryMutationResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("glucose_entries")
    .update({
      glucose_value: input.glucoseValue,
      measured_at: input.measuredAtIso,
      note: input.note ?? null,
    })
    .eq("id", entryId)
    .eq("user_id", userId)
    .select(GLUCOSE_SELECT)
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

  return { ok: true, row: data as GlucoseEntry };
}

export async function deleteGlucoseEntry(
  userId: string,
  entryId: string
): Promise<GlucoseEntryMutationResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("glucose_entries")
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
