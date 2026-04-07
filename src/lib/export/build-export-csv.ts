import type { GlucoseEntry } from "@/lib/types/glucose";
import type { InsulinEntry } from "@/lib/types/insulin";
import type { MealEntryWithItems } from "@/lib/types/meal";
import { MEAL_TYPE_LABEL_RU, type MealTypeKey } from "@/lib/types/meal";
import { INSULIN_ENTRY_TYPE_LABEL_RU } from "@/lib/utils/insulin";
import { rowsToCsv } from "@/lib/export/csv";
import { sumCaloriesFromItems, sumCarbsFromItems } from "@/lib/utils/meal-nutrition";

export function buildGlucoseCsv(rows: GlucoseEntry[]): string {
  const header = [
    "measured_at",
    "glucose_value",
    "source",
    "note",
  ];
  const body: string[][] = [
    header,
    ...rows.map((r) => [
      r.measured_at,
      String(r.glucose_value),
      r.source ?? "manual",
      r.note ?? "",
    ]),
  ];
  return rowsToCsv(body);
}

export function buildInsulinCsv(rows: InsulinEntry[]): string {
  const header = [
    "taken_at",
    "insulin_name",
    "entry_type",
    "entry_type_label",
    "units",
    "note",
  ];
  const body: string[][] = [
    header,
    ...rows.map((r) => [
      r.taken_at,
      r.insulin_name ?? "",
      r.entry_type,
      INSULIN_ENTRY_TYPE_LABEL_RU[r.entry_type],
      String(r.units),
      r.note ?? "",
    ]),
  ];
  return rowsToCsv(body);
}

function mealTypeLabel(mealType: string): string {
  return mealType in MEAL_TYPE_LABEL_RU
    ? MEAL_TYPE_LABEL_RU[mealType as MealTypeKey]
    : mealType;
}

export function buildMealsCsv(rows: MealEntryWithItems[]): string {
  const header = [
    "eaten_at",
    "meal_type",
    "meal_type_label",
    "total_carbs_g",
    "total_calories_kcal",
    "note",
  ];
  const body: string[][] = [
    header,
    ...rows.map((m) => {
      const carbs = sumCarbsFromItems(m.meal_items);
      const kcal = sumCaloriesFromItems(m.meal_items);
      return [
        m.eaten_at,
        m.meal_type,
        mealTypeLabel(m.meal_type),
        String(carbs),
        String(kcal),
        m.note ?? "",
      ] as string[];
    }),
  ];
  return rowsToCsv(body);
}

/** One wide CSV: filter by `dataset` column in Excel. */
export function buildCombinedExportCsv(input: {
  glucose: GlucoseEntry[];
  insulin: InsulinEntry[];
  meals: MealEntryWithItems[];
}): string {
  const header = [
    "dataset",
    "event_at",
    "glucose_value",
    "source",
    "note_glucose",
    "insulin_name",
    "entry_type",
    "entry_type_label",
    "units",
    "note_insulin",
    "meal_type",
    "meal_type_label",
    "total_carbs_g",
    "total_calories_kcal",
    "note_meal",
  ];

  const rows: string[][] = [header];

  for (const r of input.glucose) {
    rows.push([
      "glucose",
      r.measured_at,
      String(r.glucose_value),
      r.source ?? "manual",
      r.note ?? "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);
  }

  for (const r of input.insulin) {
    rows.push([
      "insulin",
      r.taken_at,
      "",
      "",
      "",
      r.insulin_name ?? "",
      r.entry_type,
      INSULIN_ENTRY_TYPE_LABEL_RU[r.entry_type],
      String(r.units),
      r.note ?? "",
      "",
      "",
      "",
      "",
      "",
    ]);
  }

  for (const m of input.meals) {
    const carbs = sumCarbsFromItems(m.meal_items);
    const kcal = sumCaloriesFromItems(m.meal_items);
    rows.push([
      "meal",
      m.eaten_at,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      m.meal_type,
      mealTypeLabel(m.meal_type),
      String(carbs),
      String(kcal),
      m.note ?? "",
    ]);
  }

  return rowsToCsv(rows);
}
