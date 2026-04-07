"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";

type GlucoseEntry = {
  id: string;
  value: string;
  createdAt: string;
};

type SavedMeal = {
  id: string;
  createdAt: string;
};

type InsulinEntry = {
  id: string;
  createdAt: string;
};

export default function HomePage() {
  const [glucose, setGlucose] = useState("—");
  const [mealsTodayCount, setMealsTodayCount] = useState("0");
  const [insulinTodayCount, setInsulinTodayCount] = useState("0");

  useEffect(() => {
    const parseArray = <T,>(raw: string | null): T[] => {
      if (!raw) {
        return [];
      }

      try {
        const parsed: T[] = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    };

    const glucoseEntries = parseArray<GlucoseEntry>(
      localStorage.getItem("glucose_entries")
    );
    const mealHistory = parseArray<SavedMeal>(localStorage.getItem("meal_history"));
    const insulinEntries = parseArray<InsulinEntry>(
      localStorage.getItem("insulin_entries")
    );

    setGlucose(glucoseEntries[0]?.value || "—");

    const today = new Date().toDateString();
    const mealsToday = mealHistory.filter(
      (meal) => new Date(meal.createdAt).toDateString() === today
    ).length;
    const insulinToday = insulinEntries.filter(
      (entry) => new Date(entry.createdAt).toDateString() === today
    ).length;

    setMealsTodayCount(String(mealsToday));
    setInsulinTodayCount(String(insulinToday));
  }, []);

  return (
    <AppShell title="Главная">
      <div className="space-y-4">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-white/60">Сегодня</p>
          <h2 className="mt-2 text-2xl font-semibold">Добро пожаловать</h2>
          <p className="mt-2 text-sm leading-6 text-white/70">
            Это стартовый каркас MVP приложения «Дневник диабетика».
          </p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-base font-medium text-white">Быстрые действия</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Link
              href="/glucose"
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-center text-sm font-medium text-white"
            >
              Добавить глюкозу
            </Link>
            <Link
              href="/meals"
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-center text-sm font-medium text-white"
            >
              Добавить еду
            </Link>
            <Link
              href="/insulin"
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-center text-sm font-medium text-white"
            >
              Добавить инсулин
            </Link>
            <Link
              href="/history"
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-center text-sm font-medium text-white"
            >
              Открыть дневник
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-white/60">Глюкоза</p>
            <p className="mt-2 text-2xl font-semibold">{glucose || "—"}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-white/60">Приемы пищи сегодня</p>
            <p className="mt-2 text-2xl font-semibold">{mealsTodayCount}</p>
          </div>
          <div className="col-span-2 rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-white/60">Инсулин сегодня</p>
            <p className="mt-2 text-2xl font-semibold">{insulinTodayCount}</p>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-white/60">Следующий этап</p>
          <p className="mt-2 text-base text-white">
            После этого каркаса начнем делать реальные экраны и навигацию.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
