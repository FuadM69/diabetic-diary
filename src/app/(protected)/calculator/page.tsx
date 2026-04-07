"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";

type DiabetesSettings = {
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

type Profile = "breakfast" | "lunch" | "dinner" | "night";

type CalculationResult = {
  xe: number;
  ratio: number;
  mealDose: number;
  target: number;
  correction: number;
  total: number;
};

export default function CalculatorPage() {
  const [settings, setSettings] = useState<DiabetesSettings | null>(null);
  const [currentGlucose, setCurrentGlucose] = useState("");
  const [carbs, setCarbs] = useState("");
  const [profile, setProfile] = useState<Profile>("breakfast");
  const [result, setResult] = useState<CalculationResult | null>(null);

  useEffect(() => {
    const savedSettings = localStorage.getItem("diabetes_settings");
    if (!savedSettings) {
      setSettings(null);
      return;
    }

    try {
      const parsedSettings: DiabetesSettings = JSON.parse(savedSettings);
      setSettings(parsedSettings);
    } catch {
      setSettings(null);
    }
  }, []);

  const getRatioByProfile = (currentProfile: Profile) => {
    if (!settings) {
      return 0;
    }

    const map: Record<Profile, string> = {
      breakfast: settings.insulinBreakfastRatio,
      lunch: settings.insulinLunchRatio,
      dinner: settings.insulinDinnerRatio,
      night: settings.insulinNightRatio,
    };

    const ratio = parseFloat(map[currentProfile]);
    return Number.isNaN(ratio) ? 0 : ratio;
  };

  const handleCalculate = () => {
    if (!settings) {
      return;
    }

    const currentGlucoseValue = parseFloat(currentGlucose);
    const carbsValue = parseFloat(carbs);
    const breadUnitGrams = parseFloat(settings.breadUnitGrams);
    const insulinSensitivityFactor = parseFloat(settings.insulinSensitivityFactor);
    const targetMin = parseFloat(settings.targetGlucoseMin);
    const targetMax = parseFloat(settings.targetGlucoseMax);
    const ratio = getRatioByProfile(profile);

    if (
      Number.isNaN(currentGlucoseValue) ||
      Number.isNaN(carbsValue) ||
      Number.isNaN(breadUnitGrams) ||
      Number.isNaN(insulinSensitivityFactor) ||
      Number.isNaN(targetMin) ||
      Number.isNaN(targetMax) ||
      breadUnitGrams <= 0 ||
      insulinSensitivityFactor <= 0
    ) {
      return;
    }

    const xe = carbsValue / breadUnitGrams;
    const mealDose = xe * ratio;
    const target = (targetMin + targetMax) / 2;
    const correction = (currentGlucoseValue - target) / insulinSensitivityFactor;
    const total = Math.max(0, mealDose + correction);

    setResult({
      xe,
      ratio,
      mealDose,
      target,
      correction,
      total,
    });
  };

  const inputClassName =
    "mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/40 focus:border-white/30";

  return (
    <AppShell title="Расчет дозы">
      <div className="space-y-4">
        {!settings ? (
          <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-white/80">Сначала заполните настройки</p>
          </section>
        ) : (
          <>
            <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="space-y-3">
                <label className="block text-sm text-white/70">
                  Текущая глюкоза
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={currentGlucose}
                    onChange={(event) => setCurrentGlucose(event.target.value)}
                    className={inputClassName}
                  />
                </label>

                <label className="block text-sm text-white/70">
                  Углеводы (г)
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={carbs}
                    onChange={(event) => setCarbs(event.target.value)}
                    className={inputClassName}
                  />
                </label>

                <label className="block text-sm text-white/70">
                  Профиль
                  <select
                    value={profile}
                    onChange={(event) => setProfile(event.target.value as Profile)}
                    className={inputClassName}
                  >
                    <option value="breakfast">breakfast</option>
                    <option value="lunch">lunch</option>
                    <option value="dinner">dinner</option>
                    <option value="night">night</option>
                  </select>
                </label>

                <button
                  onClick={handleCalculate}
                  className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black"
                >
                  Рассчитать
                </button>
              </div>
            </section>

            {result && (
              <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <h2 className="text-base font-medium text-white">Результат</h2>
                <div className="mt-3 space-y-1 text-sm text-white/80">
                  <p>Доза на еду: {result.mealDose.toFixed(2)}</p>
                  <p>Коррекция: {result.correction.toFixed(2)}</p>
                  <p className="text-base font-semibold text-white">
                    Итого: {result.total.toFixed(2)}
                  </p>
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-3 text-sm text-white/70">
                  <p>
                    ХЕ = {parseFloat(carbs || "0").toFixed(2)} /{" "}
                    {parseFloat(settings.breadUnitGrams || "0").toFixed(2)} ={" "}
                    {result.xe.toFixed(2)}
                  </p>
                  <p>
                    Доза на еду = {result.xe.toFixed(2)} * {result.ratio.toFixed(2)} ={" "}
                    {result.mealDose.toFixed(2)}
                  </p>
                  <p>
                    Коррекция = ({parseFloat(currentGlucose || "0").toFixed(2)} -{" "}
                    {result.target.toFixed(2)}) /{" "}
                    {parseFloat(settings.insulinSensitivityFactor || "0").toFixed(2)} ={" "}
                    {result.correction.toFixed(2)}
                  </p>
                  <p>Итого = {result.total.toFixed(2)}</p>
                </div>
              </section>
            )}

            <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm leading-6 text-white/80">
                Расчет носит справочный характер и не заменяет рекомендации врача.
                Пользователь самостоятельно принимает решение.
              </p>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
