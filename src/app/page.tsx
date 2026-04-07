"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";

type GlucoseEntry = {
  id: string;
  value: string;
  createdAt: string;
};

export default function HomePage() {
  const [glucose, setGlucose] = useState("—");

  useEffect(() => {
    const savedEntries = localStorage.getItem("glucose_entries");

    if (!savedEntries) {
      setGlucose("—");
      return;
    }

    try {
      const parsedEntries: GlucoseEntry[] = JSON.parse(savedEntries);
      if (!Array.isArray(parsedEntries) || parsedEntries.length === 0) {
        setGlucose("—");
        return;
      }

      setGlucose(parsedEntries[0]?.value || "—");
    } catch {
      setGlucose("—");
    }
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
            <p className="text-sm text-white/60">Инсулин</p>
            <p className="mt-2 text-2xl font-semibold">—</p>
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
