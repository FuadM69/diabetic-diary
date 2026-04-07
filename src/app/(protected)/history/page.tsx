"use client";

import { useMemo, useSyncExternalStore } from "react";
import { AppShell } from "@/components/layout/app-shell";

type GlucoseEntry = {
  id: string;
  value: string;
  createdAt: string;
};

type MealItem = {
  id: string;
  productId: string;
  productName: string;
  grams: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  xe: number;
};

type SavedMeal = {
  id: string;
  createdAt: string;
  items: MealItem[];
  totalCalories: number;
  totalProtein: number;
  totalFat: number;
  totalCarbs: number;
  totalXe: number;
};

type InsulinEntry = {
  id: string;
  insulinKind: "bolus" | "basal";
  insulinType: string;
  dose: string;
  comment: string;
  createdAt: string;
};

type TimelineItem =
  | {
      id: string;
      type: "glucose";
      createdAt: string;
      data: GlucoseEntry;
    }
  | {
      id: string;
      type: "meal";
      createdAt: string;
      data: SavedMeal;
    }
  | {
      id: string;
      type: "insulin";
      createdAt: string;
      data: InsulinEntry;
    };

function subscribeStorage(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function historyStorageFingerprint(): string {
  try {
    return [
      localStorage.getItem("glucose_entries") ?? "",
      localStorage.getItem("meal_history") ?? "",
      localStorage.getItem("insulin_entries") ?? "",
    ].join("\u001f");
  } catch {
    return "";
  }
}

function buildTimelineFromStorage(): TimelineItem[] {
  let glucoseEntries: GlucoseEntry[] = [];
  let mealHistory: SavedMeal[] = [];
  let insulinEntries: InsulinEntry[] = [];

  const savedGlucoseEntries = localStorage.getItem("glucose_entries");
  if (savedGlucoseEntries) {
    try {
      const parsed: GlucoseEntry[] = JSON.parse(savedGlucoseEntries);
      glucoseEntries = Array.isArray(parsed) ? parsed : [];
    } catch {
      glucoseEntries = [];
    }
  }

  const savedMealHistory = localStorage.getItem("meal_history");
  if (savedMealHistory) {
    try {
      const parsed: SavedMeal[] = JSON.parse(savedMealHistory);
      mealHistory = Array.isArray(parsed) ? parsed : [];
    } catch {
      mealHistory = [];
    }
  }

  const savedInsulinEntries = localStorage.getItem("insulin_entries");
  if (savedInsulinEntries) {
    try {
      const parsed: InsulinEntry[] = JSON.parse(savedInsulinEntries);
      insulinEntries = Array.isArray(parsed) ? parsed : [];
    } catch {
      insulinEntries = [];
    }
  }

  const timelineItems: TimelineItem[] = [
    ...glucoseEntries.map((entry) => ({
      id: `glucose-${entry.id}`,
      type: "glucose" as const,
      createdAt: entry.createdAt,
      data: entry,
    })),
    ...mealHistory.map((meal) => ({
      id: `meal-${meal.id}`,
      type: "meal" as const,
      createdAt: meal.createdAt,
      data: meal,
    })),
    ...insulinEntries.map((entry) => ({
      id: `insulin-${entry.id}`,
      type: "insulin" as const,
      createdAt: entry.createdAt,
      data: entry,
    })),
  ];

  timelineItems.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return timelineItems;
}

export default function HistoryPage() {
  const storageKey = useSyncExternalStore(
    subscribeStorage,
    historyStorageFingerprint,
    () => ""
  );

  const timeline = useMemo(() => {
    void storageKey;
    return buildTimelineFromStorage();
  }, [storageKey]);

  return (
    <AppShell title="История">
      <div className="space-y-4">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-xl font-semibold">Единый дневник</h2>
          <p className="mt-2 text-sm text-white/70">
            Глюкоза, приемы пищи и инсулин в одной ленте
          </p>
        </section>

        {timeline.length === 0 ? (
          <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-white/70">Записей пока нет</p>
          </section>
        ) : (
          <div className="space-y-3">
            {timeline.map((item) => {
              if (item.type === "glucose") {
                return (
                  <section
                    key={item.id}
                    className="rounded-3xl border border-white/10 bg-white/5 p-4"
                  >
                    <p className="text-xs uppercase tracking-wide text-white/50">
                      Глюкоза
                    </p>
                    <p className="mt-2 text-2xl font-semibold">{item.data.value}</p>
                    <p className="mt-2 text-sm text-white/60">
                      {new Date(item.createdAt).toLocaleString("ru-RU")}
                    </p>
                  </section>
                );
              }

              if (item.type === "meal") {
                return (
                  <section
                    key={item.id}
                    className="rounded-3xl border border-white/10 bg-white/5 p-4"
                  >
                    <p className="text-xs uppercase tracking-wide text-white/50">
                      Прием пищи
                    </p>
                    <p className="mt-2 text-sm text-white/60">
                      {new Date(item.createdAt).toLocaleString("ru-RU")}
                    </p>

                    <div className="mt-3 space-y-1 text-sm text-white/80">
                      {item.data.items.map((mealItem) => (
                        <p key={mealItem.id}>
                          {mealItem.productName} - {mealItem.grams} г
                        </p>
                      ))}
                    </div>

                    <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 p-3">
                      <p className="text-sm text-white/70">
                        Калории: {item.data.totalCalories.toFixed(2)}
                      </p>
                      <p className="text-sm text-white/70">
                        Белки: {item.data.totalProtein.toFixed(2)}
                      </p>
                      <p className="text-sm text-white/70">
                        Жиры: {item.data.totalFat.toFixed(2)}
                      </p>
                      <p className="text-sm text-white/70">
                        Углеводы: {item.data.totalCarbs.toFixed(2)}
                      </p>
                      <p className="text-sm text-white">
                        ХЕ: {item.data.totalXe.toFixed(2)}
                      </p>
                    </div>
                  </section>
                );
              }

              return (
                <section
                  key={item.id}
                  className="rounded-3xl border border-white/10 bg-white/5 p-4"
                >
                  <p className="text-xs uppercase tracking-wide text-white/50">
                    Инсулин
                  </p>
                  <p className="mt-1 text-sm text-white/70">
                    {item.data.insulinKind === "bolus" ? "Болюсный" : "Базальный"}
                  </p>
                  <p className="mt-1 text-lg font-semibold">{item.data.insulinType}</p>
                  <p className="mt-1 text-sm text-white/80">{item.data.dose} ед.</p>
                  {item.data.comment && (
                    <p className="mt-1 text-sm text-white/70">{item.data.comment}</p>
                  )}
                  <p className="mt-2 text-sm text-white/60">
                    {new Date(item.createdAt).toLocaleString("ru-RU")}
                  </p>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
