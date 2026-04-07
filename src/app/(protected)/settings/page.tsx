"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";

type DiabetesSettings = {
  appName: string;
  breadUnitGrams: string;
  insulinBreakfastRatio: string;
  insulinLunchRatio: string;
  insulinDinnerRatio: string;
  insulinNightRatio: string;
  insulinSensitivityFactor: string;
  targetGlucoseMin: string;
  targetGlucoseMax: string;
  recommendationsEnabled: boolean;
};

const defaultSettings: DiabetesSettings = {
  appName: "Дневник диабетика",
  breadUnitGrams: "12",
  insulinBreakfastRatio: "1.5",
  insulinLunchRatio: "1.0",
  insulinDinnerRatio: "1.2",
  insulinNightRatio: "0.8",
  insulinSensitivityFactor: "2.0",
  targetGlucoseMin: "5.0",
  targetGlucoseMax: "7.0",
  recommendationsEnabled: true,
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<DiabetesSettings>(defaultSettings);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const savedSettings = localStorage.getItem("diabetes_settings");

    if (!savedSettings) {
      return;
    }

    try {
      const parsedSettings: Partial<DiabetesSettings> = JSON.parse(savedSettings);
      setSettings({
        ...defaultSettings,
        ...parsedSettings,
      });
    } catch {
      setSettings(defaultSettings);
    }
  }, []);

  const handleChange = (field: keyof DiabetesSettings, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleToggleRecommendations = () => {
    setSettings((prev) => ({
      ...prev,
      recommendationsEnabled: !prev.recommendationsEnabled,
    }));
  };

  const handleSave = () => {
    localStorage.setItem("diabetes_settings", JSON.stringify(settings));
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 2000);
  };

  const inputClassName =
    "mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/40 focus:border-white/30";

  return (
    <AppShell title="Настройки">
      <div className="space-y-4">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-base font-medium text-white">Приложение</h2>
          <label className="mt-3 block text-sm text-white/70">
            Название приложения
            <input
              type="text"
              value={settings.appName}
              onChange={(event) => handleChange("appName", event.target.value)}
              placeholder="например, Дневник Фуада"
              className={inputClassName}
            />
          </label>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-base font-medium text-white">ХЕ</h2>
          <label className="mt-3 block text-sm text-white/70">
            Граммов углеводов в 1 ХЕ
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={settings.breadUnitGrams}
              onChange={(event) =>
                handleChange("breadUnitGrams", event.target.value)
              }
              className={inputClassName}
            />
          </label>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-base font-medium text-white">
            Инсулиновые коэффициенты
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-3">
            <label className="text-sm text-white/70">
              Завтрак
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={settings.insulinBreakfastRatio}
                onChange={(event) =>
                  handleChange("insulinBreakfastRatio", event.target.value)
                }
                className={inputClassName}
              />
            </label>
            <label className="text-sm text-white/70">
              Обед
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={settings.insulinLunchRatio}
                onChange={(event) =>
                  handleChange("insulinLunchRatio", event.target.value)
                }
                className={inputClassName}
              />
            </label>
            <label className="text-sm text-white/70">
              Ужин
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={settings.insulinDinnerRatio}
                onChange={(event) =>
                  handleChange("insulinDinnerRatio", event.target.value)
                }
                className={inputClassName}
              />
            </label>
            <label className="text-sm text-white/70">
              Ночь
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={settings.insulinNightRatio}
                onChange={(event) =>
                  handleChange("insulinNightRatio", event.target.value)
                }
                className={inputClassName}
              />
            </label>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-base font-medium text-white">Коррекция</h2>
          <label className="mt-3 block text-sm text-white/70">
            Чувствительность к инсулину
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={settings.insulinSensitivityFactor}
              onChange={(event) =>
                handleChange("insulinSensitivityFactor", event.target.value)
              }
              className={inputClassName}
            />
          </label>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-base font-medium text-white">Целевая глюкоза</h2>
          <div className="mt-3 grid grid-cols-1 gap-3">
            <label className="text-sm text-white/70">
              Минимум
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={settings.targetGlucoseMin}
                onChange={(event) =>
                  handleChange("targetGlucoseMin", event.target.value)
                }
                className={inputClassName}
              />
            </label>
            <label className="text-sm text-white/70">
              Максимум
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={settings.targetGlucoseMax}
                onChange={(event) =>
                  handleChange("targetGlucoseMax", event.target.value)
                }
                className={inputClassName}
              />
            </label>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-base font-medium text-white">Рекомендации</h2>
          <label className="mt-3 flex items-center gap-3 text-sm text-white/80">
            <input
              type="checkbox"
              checked={settings.recommendationsEnabled}
              onChange={handleToggleRecommendations}
              className="h-4 w-4 rounded border-white/20 bg-black/40"
            />
            Включить справочный расчет дозы
          </label>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <button
            onClick={handleSave}
            className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black"
          >
            Сохранить настройки
          </button>
          {isSaved && (
            <p className="mt-3 text-sm text-white/70">Настройки сохранены</p>
          )}
        </section>
      </div>
    </AppShell>
  );
}
