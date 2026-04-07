import { createClient } from "@/lib/supabase/server";

/**
 * Light count queries for export UI (no row load).
 * All scoped by `user_id`.
 */
export async function getExportCounts(
  userId: string,
  dateLowerBoundIso: string | null
): Promise<{
  glucose: number;
  insulin: number;
  meals: number;
}> {
  const supabase = await createClient();

  let glucoseQ = supabase
    .from("glucose_entries")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  let insulinQ = supabase
    .from("insulin_entries")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  let mealsQ = supabase
    .from("meal_entries")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (typeof dateLowerBoundIso === "string" && dateLowerBoundIso.length > 0) {
    glucoseQ = glucoseQ.gte("measured_at", dateLowerBoundIso);
    insulinQ = insulinQ.gte("taken_at", dateLowerBoundIso);
    mealsQ = mealsQ.gte("eaten_at", dateLowerBoundIso);
  }

  const [g, i, m] = await Promise.all([glucoseQ, insulinQ, mealsQ]);

  if (g.error) {
    throw g.error;
  }
  if (i.error) {
    throw i.error;
  }
  if (m.error) {
    throw m.error;
  }

  return {
    glucose: g.count ?? 0,
    insulin: i.count ?? 0,
    meals: m.count ?? 0,
  };
}
