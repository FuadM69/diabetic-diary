"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { buildCalculatorInsulinPrefillHref } from "@/lib/utils/bolus-prefill";
import { formatBolusDose } from "@/lib/utils/bolus";
import { formatGlucoseValue } from "@/lib/utils/glucose";
import {
  formatInsulinDoseStepRu,
  insulinPrefillUnitsOrFallback,
  type InsulinDoseStep,
} from "@/lib/utils/insulin-dose-step";

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

const PROFILE_LABEL_RU: Record<Profile, string> = {
  breakfast: "Утро",
  lunch: "Обед",
  dinner: "Ужин",
  night: "Ночь",
};

const STORAGE_KEY = "diabetes_settings";

function subscribeToStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function readSettingsRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function parseSettings(raw: string | null): DiabetesSettings | null {
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as DiabetesSettings;
  } catch {
    return null;
  }
}

type CalculatorClientProps = {
  insulinDoseStep: InsulinDoseStep;
};

const breakdownRowClass =
  "flex items-baseline justify-between gap-3 border-b border-white/10 py-2.5 last:border-b-0";

export function CalculatorClient({ insulinDoseStep }: CalculatorClientProps) {
  const settingsRaw = useSyncExternalStore(
    subscribeToStorage,
    readSettingsRaw,
    () => null
  );

  const settings = useMemo(
    () => parseSettings(settingsRaw),
    [settingsRaw]
  );

  const [currentGlucose, setCurrentGlucose] = useState("");
  const [carbs, setCarbs] = useState("");
  const [profile, setProfile] = useState<Profile>("breakfast");
  const [result, setResult] = useState<CalculationResult | null>(null);

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
    const correction =
      (currentGlucoseValue - target) / insulinSensitivityFactor;
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
    "mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-base text-white outline-none placeholder:text-white/40 focus:border-white/30";

  const showPracticalDose = result != null && result.total > 0;
  const totalRounded =
    result != null && result.total > 0 ?
      insulinPrefillUnitsOrFallback(result.total, insulinDoseStep)
    : null;
  const correctionForDisplay =
    result != null ? Math.max(0, result.correction) : 0;
  const proteinFatHintFoodContext =
    result != null && result.mealDose > 0;

  return (
    <AppShell title="Расчёт дозы">
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
                    onChange={(event) =>
                      setProfile(event.target.value as Profile)
                    }
                    className={`${inputClassName} cursor-pointer`}
                  >
                    <option value="breakfast">
                      {PROFILE_LABEL_RU.breakfast}
                    </option>
                    <option value="lunch">{PROFILE_LABEL_RU.lunch}</option>
                    <option value="dinner">{PROFILE_LABEL_RU.dinner}</option>
                    <option value="night">{PROFILE_LABEL_RU.night}</option>
                  </select>
                </label>

                <button
                  type="button"
                  onClick={handleCalculate}
                  className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black"
                >
                  Рассчитать
                </button>
              </div>
            </section>

            {result ? (
              <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <h2 className="text-base font-medium text-white/85">
                  Оценка болюса
                </h2>
                <p className="mt-2 text-xs leading-relaxed text-white/55">
                  Цель коррекции — середина вашего диапазона{" "}
                  <span className="tabular-nums text-white/75">
                    {formatGlucoseValue(
                      parseFloat(settings.targetGlucoseMin || "NaN")
                    )}
                    –
                    {formatGlucoseValue(
                      parseFloat(settings.targetGlucoseMax || "NaN")
                    )}
                  </span>
                  , сейчас для расчёта взято{" "}
                  <span className="tabular-nums font-medium text-white/85">
                    {formatGlucoseValue(result.target)}
                  </span>
                  .
                </p>
                <p className="mt-2 text-xs leading-relaxed text-white/50">
                  Коррекция — добавка к болюсу на еду, если глюкоза выше середины
                  цели: лишняя глюкоза делится на фактор коррекции (сдвиг на 1 ед.)
                  из настроек калькулятора.
                </p>

                <dl className="mt-3 text-sm">
                  <div className={breakdownRowClass}>
                    <dt className="text-white/55">Болюс на еду</dt>
                    <dd className="tabular-nums font-medium text-white">
                      {formatBolusDose(result.mealDose)} ед.
                    </dd>
                  </div>
                  <div className={breakdownRowClass}>
                    <dt className="text-white/55">Коррекция</dt>
                    <dd className="min-w-0 max-w-[70%] text-right text-sm text-white sm:max-w-[62%]">
                      <span className="tabular-nums font-medium">
                        {formatBolusDose(correctionForDisplay)} ед.
                      </span>
                      {result.correction < 0 ? (
                        <span className="mt-1 block text-xs font-normal text-white/50">
                          Глюкоза ниже середины цели — к сумме только болюс на
                          еду; отрицательную «дозу» вводить нельзя.
                        </span>
                      ) : null}
                    </dd>
                  </div>
                  <div className={`${breakdownRowClass} border-b-0`}>
                    <dt className="text-white/55">Итого (расчёт)</dt>
                    <dd className="tabular-nums font-medium text-white">
                      {formatBolusDose(result.total)} ед.
                    </dd>
                  </div>
                </dl>

                {showPracticalDose && totalRounded != null ? (
                  <div
                    className="mt-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.08] px-4 py-3"
                    role="status"
                  >
                    <p className="text-[0.65rem] font-medium uppercase tracking-wide text-emerald-100/80">
                      Итого — к вводу
                    </p>
                    <p className="mt-1 tabular-nums text-3xl font-semibold tracking-tight text-white">
                      {formatBolusDose(totalRounded)}{" "}
                      <span className="text-lg font-medium text-white/55">
                        ед.
                      </span>
                    </p>
                    <p className="mt-2 tabular-nums text-sm text-white/45">
                      расчёт без округления:{" "}
                      <span className="text-white/55">
                        {formatBolusDose(result.total)} ед.
                      </span>
                      {" · шаг "}
                      <span className="text-white/55">
                        {formatInsulinDoseStepRu(insulinDoseStep)}
                      </span>
                    </p>
                    <p className="mt-1 text-[0.7rem] leading-snug text-white/40">
                      Ближайший шаг на сетке (см. шаг выше); в форму инсулина
                      подставляется эта практическая доза.
                    </p>
                    <Link
                      href={buildCalculatorInsulinPrefillHref({
                        roundedUnits: totalRounded,
                      })}
                      className="mt-3 flex w-full items-center justify-center rounded-xl border border-white/20 bg-white/[0.06] px-3 py-2.5 text-center text-xs font-medium text-white/90 transition-colors hover:border-white/30 hover:bg-white/[0.09]"
                      prefetch={false}
                    >
                      Внести в журнал вручную…
                    </Link>
                    <p className="mt-1.5 text-center text-[0.65rem] leading-snug text-white/40">
                      Откроется форма инсулина с черновиком; запись не создаётся,
                      пока вы не сохраните её сами.
                    </p>
                  </div>
                ) : (
                  <p
                    className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white/55"
                    role="status"
                  >
                    Итог расчёта 0 ед. — ориентира «сколько ввести» по этой
                    сумме нет. Отрицательную коррекцию из разбора ниже не вводите
                    отдельной дозой.
                  </p>
                )}

                <details
                  className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[0.7rem] leading-snug text-white/50"
                  aria-label="Справка: белок и жир"
                >
                  <summary className="cursor-pointer list-none text-white/55 [&::-webkit-details-marker]:hidden">
                    {proteinFatHintFoodContext ? (
                      <>
                        Про белок и жир — в расчёте есть болюс на еду{" "}
                        <span className="font-normal text-white/35">▼</span>
                      </>
                    ) : (
                      <>
                        Про белок и жир (справка, без влияния на дозу){" "}
                        <span className="font-normal text-white/35">▼</span>
                      </>
                    )}
                  </summary>
                  {proteinFatHintFoodContext ? (
                    <div className="mt-2 space-y-2 border-t border-white/10 pt-2">
                      <p>
                        Много белка или жира часто сдвигает подъём глюкозы
                        позже. Оценка здесь — по углеводам и текущему замеру,
                        состав блюда в дозу не входит.
                      </p>
                      <p className="text-white/45">
                        Дольше смотрите замеры и решайте сами; это не
                        автоматическая добавка к цифре «к вводу».
                      </p>
                    </div>
                  ) : (
                    <div className="mt-2 space-y-2 border-t border-white/10 pt-2">
                      <p>
                        Белок/жир могут дать запоздалый подъём. В этом расчёте
                        нет болюса на еду — текст общий; приложение не оценивает
                        жир/белок и не меняет числа выше.
                      </p>
                      <p className="text-white/45">
                        При следующей еде учитывайте при контроле; дозу
                        подтверждаете вы.
                      </p>
                    </div>
                  )}
                </details>

                <details className="group mt-3 rounded-2xl border border-white/10 bg-black/30 p-0 text-sm text-white/70">
                  <summary className="cursor-pointer list-none rounded-2xl px-3 py-2.5 text-[0.7rem] font-medium text-white/55 [&::-webkit-details-marker]:hidden group-open:border-b group-open:border-white/10">
                    Разбор расчёта{" "}
                    <span className="font-normal text-white/35">▼</span>
                  </summary>
                  <div className="space-y-1 px-3 pb-3 pt-0 leading-relaxed">
                    <p>
                      ХЕ = {parseFloat(carbs || "0").toFixed(2)} /{" "}
                      {parseFloat(settings.breadUnitGrams || "0").toFixed(2)} ={" "}
                      {result.xe.toFixed(2)}
                    </p>
                    <p>
                      Болюс на еду = {result.xe.toFixed(2)} *{" "}
                      {result.ratio.toFixed(2)} = {result.mealDose.toFixed(2)}
                    </p>
                    <p>
                      Коррекция = (
                      {parseFloat(currentGlucose || "0").toFixed(2)} −{" "}
                      {result.target.toFixed(2)}) /{" "}
                      {parseFloat(settings.insulinSensitivityFactor || "0").toFixed(
                        2
                      )}{" "}
                      = {result.correction.toFixed(2)} (цель — середина между
                      мин. и макс.)
                    </p>
                    <p>Итого (расчёт) = {result.total.toFixed(2)}</p>
                  </div>
                </details>
              </section>
            ) : null}

            <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm leading-6 text-white/80">
                Расчёт носит справочный характер и не заменяет рекомендации
                врача.
                Пользователь самостоятельно принимает решение.
              </p>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
