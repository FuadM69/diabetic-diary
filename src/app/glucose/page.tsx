"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";

export default function GlucosePage() {
  const [glucose, setGlucose] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem("glucose", glucose);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 2000);
  };

  return (
    <AppShell title="Глюкоза">
      <div className="flex min-h-full items-center justify-center">
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
      </div>
    </AppShell>
  );
}
