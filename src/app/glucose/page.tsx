"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type GlucoseEntry = {
  id: string;
  value: string;
  createdAt: string;
};

type GlucoseChartPoint = {
  value: number;
  time: string;
};

export default function GlucosePage() {
  const [glucose, setGlucose] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [entries, setEntries] = useState<GlucoseEntry[]>([]);

  useEffect(() => {
    const savedEntries = localStorage.getItem("glucose_entries");

    if (!savedEntries) {
      return;
    }

    try {
      const parsedEntries: GlucoseEntry[] = JSON.parse(savedEntries);
      if (Array.isArray(parsedEntries)) {
        setEntries(parsedEntries);
      }
    } catch {
      setEntries([]);
    }
  }, []);

  const handleSave = () => {
    const newEntry: GlucoseEntry = {
      id: Date.now().toString(),
      value: glucose,
      createdAt: new Date().toISOString(),
    };

    const updatedEntries = [newEntry, ...entries];
    localStorage.setItem("glucose_entries", JSON.stringify(updatedEntries));
    setEntries(updatedEntries);
    setGlucose("");
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 2000);
  };

  const chartData: GlucoseChartPoint[] = entries
    .slice(0, 10)
    .reverse()
    .map((entry) => ({
      value: parseFloat(entry.value),
      time: new Date(entry.createdAt).toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }))
    .filter((entry) => !Number.isNaN(entry.value));

  return (
    <AppShell title="Глюкоза">
      <div className="flex min-h-full items-center justify-center">
        <div className="w-full space-y-4">
          <section className="w-full rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="glucose-value"
                  className="text-sm text-white/70"
                >
                  Уровень глюкозы
                </label>
                <input
                  id="glucose-value"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  placeholder="например, 5.6"
                  value={glucose}
                  onChange={(event) => setGlucose(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/40 focus:border-white/30"
                />
              </div>

              <button
                onClick={handleSave}
                className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black"
              >
                Сохранить
              </button>
              {isSaved && <p className="text-sm text-white/70">Сохранено</p>}
            </div>
          </section>

          <section className="w-full rounded-3xl border border-white/10 bg-white/5 p-4">
            <h2 className="text-base font-medium text-white">График глюкозы</h2>
            {chartData.length === 0 ? (
              <p className="mt-3 text-sm text-white/70">Нет данных для графика</p>
            ) : (
              <div className="mt-3 h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="time" />
                    <YAxis dataKey="value" />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#ffffff" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          <section className="w-full rounded-3xl border border-white/10 bg-white/5 p-4">
            <h2 className="text-base font-medium text-white">Последние записи</h2>
            {entries.length === 0 ? (
              <p className="mt-3 text-sm text-white/70">Записей пока нет</p>
            ) : (
              <div className="mt-3 space-y-3">
                {entries.slice(0, 10).map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-3xl border border-white/10 bg-white/5 p-4"
                  >
                    <p className="text-2xl font-semibold">{entry.value}</p>
                    <p className="mt-1 text-sm text-white/60">
                      {new Date(entry.createdAt).toLocaleString("ru-RU")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
