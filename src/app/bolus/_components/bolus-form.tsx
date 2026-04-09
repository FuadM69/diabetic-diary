"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type {
  BolusGlucoseSuggestion,
  BolusMealContext,
  BolusRecentMealOption,
} from "@/lib/types/bolus";
import type { UserSettings } from "@/lib/types/glucose";
import type { BolusEstimate } from "@/lib/utils/bolus";
import {
  computeBolusEstimate,
  insulinUnitsPerTypicalBreadUnit,
} from "@/lib/utils/bolus";
import type { BolusUrlPrefill } from "@/lib/utils/bolus-prefill";
import { buildInsulinPrefillHref } from "@/lib/utils/bolus-prefill";
import {
  bolusSettingsMissingMessage,
  bolusSettingsReady,
  parseBolusHelperInput,
  resolveBolusSettingsForTime,
} from "@/lib/utils/bolus-form";
import { formatGlucoseDate } from "@/lib/utils/glucose";
import { BolusResultCard } from "./bolus-result-card";

const inputClass =
  "mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-base text-white outline-none placeholder:text-white/40 focus:border-white/30";

type BolusFormProps = {
  settings: UserSettings;
  recentMeals: BolusRecentMealOption[];
  /** Query prefill from /bolus?… (form init only). */
  urlPrefill: BolusUrlPrefill;
  /** Resolved journal meal when `mealId` is in the URL (display + insulin note id). */
  initialMealContext: BolusMealContext | null;
  /** True when URL had `mealId` but the row was not found. */
  linkedMealMissing: boolean;
  /**
   * UTC ISO: meal `eaten_at` (DB or `mealTime` query). When set, glucose hints may only use
   * journal readings with `measured_at <=` this instant — never later “latest” values.
   */
  mealGlucoseReferenceIso: string | null;
  /** Initial glucose prefill / chip target: at-or-before meal when in meal context, else latest global. */
  defaultGlucoseSuggestion: BolusGlucoseSuggestion | null;
};

/** Drop any suggestion incompatible with the meal reference (ISO timestamps compare lexicographically). */
function glucoseSuggestionAllowed(
  s: BolusGlucoseSuggestion | null,
  mealRefIso: string | null
): BolusGlucoseSuggestion | null {
  if (!s) {
    return null;
  }
  if (mealRefIso) {
    if (s.scope === "latest_global") {
      return null;
    }
    if (s.measuredAt > mealRefIso) {
      return null;
    }
  }
  return s;
}

function recentOptionToContext(m: BolusRecentMealOption): BolusMealContext {
  return {
    mealTypeLabel: m.mealTypeLabel,
    eatenAtDisplay: formatGlucoseDate(m.eatenAt),
    carbsGrams: m.totalCarbs,
  };
}

function suggestionFromRecentOption(
  m: BolusRecentMealOption
): BolusGlucoseSuggestion | null {
  if (
    m.suggestGlucoseValue == null ||
    !Number.isFinite(m.suggestGlucoseValue) ||
    !m.suggestGlucoseMeasuredAt
  ) {
    return null;
  }
  if (m.suggestGlucoseMeasuredAt > m.eatenAt) {
    return null;
  }
  return {
    value: m.suggestGlucoseValue,
    measuredAt: m.suggestGlucoseMeasuredAt,
    scope: "at_or_before_meal",
  };
}

export function BolusForm({
  settings,
  recentMeals,
  urlPrefill,
  initialMealContext,
  linkedMealMissing,
  mealGlucoseReferenceIso,
  defaultGlucoseSuggestion,
}: BolusFormProps) {
  const ready = useMemo(() => bolusSettingsReady(settings), [settings]);

  const [mealContextDisplay, setMealContextDisplay] = useState<
    BolusMealContext | null
  >(() => initialMealContext);

  const [mealRefIso, setMealRefIso] = useState<string | null>(
    () => mealGlucoseReferenceIso
  );

  const [insulinLinkedMealId, setInsulinLinkedMealId] = useState<
    string | null
  >(() => (linkedMealMissing ? null : urlPrefill.linkedMealId));

  const [activeGlucoseSuggestion, setActiveGlucoseSuggestion] = useState<
    BolusGlucoseSuggestion | null
  >(() =>
    glucoseSuggestionAllowed(defaultGlucoseSuggestion, mealGlucoseReferenceIso)
  );

  const [carbs, setCarbs] = useState(() => urlPrefill.carbs);
  const [glucose, setGlucose] = useState(() => {
    if (urlPrefill.glucose.length > 0) {
      return urlPrefill.glucose;
    }
    const allowed = glucoseSuggestionAllowed(
      defaultGlucoseSuggestion,
      mealGlucoseReferenceIso
    );
    if (allowed != null && Number.isFinite(allowed.value)) {
      return String(allowed.value);
    }
    return "";
  });
  const [estimate, setEstimate] = useState<BolusEstimate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resolvedForActiveTime = useMemo(
    () => resolveBolusSettingsForTime(settings, mealRefIso),
    [settings, mealRefIso]
  );
  const readyForActiveTime = resolvedForActiveTime.ready;

  const insulinPerXeLine = useMemo(() => {
    const cr = resolvedForActiveTime.carbRatio;
    if (cr == null) {
      return null;
    }
    return insulinUnitsPerTypicalBreadUnit(cr);
  }, [resolvedForActiveTime.carbRatio]);

  const handleEstimate = () => {
    setError(null);
    setEstimate(null);

    if (!readyForActiveTime) {
      setError(bolusSettingsMissingMessage());
      return;
    }

    const parsed = parseBolusHelperInput(carbs, glucose);
    if (!parsed.ok) {
      setError(parsed.message);
      return;
    }

    setEstimate(
      computeBolusEstimate({
        carbs: parsed.data.carbs,
        current_glucose: parsed.data.current_glucose,
        settings: {
          glucose_target_min: settings.glucose_target_min,
          glucose_target_max: settings.glucose_target_max,
          carb_ratio: resolvedForActiveTime.carbRatio!,
          insulin_sensitivity: resolvedForActiveTime.insulinSensitivity!,
        },
      })
    );
  };

  const clearResult = () => {
    setError(null);
    setEstimate(null);
  };

  const insulinPrefillHref =
    estimate &&
    !error &&
    Number.isFinite(estimate.totalBolus) &&
    estimate.totalBolus > 0
      ? buildInsulinPrefillHref({
          totalBolus: estimate.totalBolus,
          linkedMealId: insulinLinkedMealId,
          doseStep: settings.insulin_dose_step,
        })
      : null;

  const urlCarbsParsed =
    urlPrefill.carbs.trim() === ""
      ? null
      : Number.parseFloat(urlPrefill.carbs.replace(",", "."));

  const showJournalVsUrlCarbsHint =
    mealContextDisplay != null &&
    urlPrefill.linkedMealId != null &&
    insulinLinkedMealId === urlPrefill.linkedMealId &&
    urlCarbsParsed != null &&
    Number.isFinite(urlCarbsParsed) &&
    Math.abs(urlCarbsParsed - mealContextDisplay.carbsGrams) > 0.01;

  return (
    <div className="space-y-6">
      {!ready ? (
        <div
          className="rounded-2xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/95"
          role="status"
        >
          <p>{bolusSettingsMissingMessage()}</p>
          <Link
            href="/settings"
            className="mt-2 inline-block font-medium text-white underline decoration-white/30 underline-offset-2"
          >
            Открыть настройки
          </Link>
        </div>
      ) : null}

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 space-y-4">
        <div className="space-y-2">
          {mealContextDisplay ? (
            <>
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-200/90">
                Расчёт для приёма пищи
              </p>
              <div
                className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-3 text-sm"
                role="status"
              >
                <p className="font-semibold text-white">
                  {mealContextDisplay.mealTypeLabel}
                </p>
                <p className="mt-0.5 text-white/65">
                  {mealContextDisplay.eatenAtDisplay}
                </p>
                <p className="mt-2 text-white/80">
                  Углеводы по журналу для этого приёма:{" "}
                  <span className="tabular-nums font-medium text-white">
                    {mealContextDisplay.carbsGrams} г
                  </span>
                </p>
                <details className="mt-1 text-xs text-white/45">
                  <summary className="cursor-pointer text-white/50">
                    Про поле «Углеводы» ниже
                  </summary>
                  <p className="mt-1.5 leading-relaxed">
                    Сумма в поле может отличаться от журнала — в расчёт идёт то,
                    что в поле.
                  </p>
                </details>
                {showJournalVsUrlCarbsHint ? (
                  <p className="mt-2 border-t border-white/10 pt-2 text-xs leading-relaxed text-amber-100/90">
                    В журнале сейчас {mealContextDisplay.carbsGrams} г; из ссылки
                    в поле подставлено {urlCarbsParsed} г. Перед расчётом
                    проверьте, какое значение верное.
                  </p>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <p className="text-xs font-medium uppercase tracking-wide text-white/45">
                Ручной расчёт
              </p>
              <p className="text-xs text-white/45">
                Углеводы и глюкозу вводите ниже. Связь с приёмом — через недавние
                кнопки или ссылку с карточки.
              </p>
              {linkedMealMissing ? (
                <p
                  className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100/95"
                  role="status"
                >
                  Запись приёма из ссылки не найдена (возможно, удалена).
                  Углеводы в поле могли прийти только из ссылки — проверьте
                  перед расчётом.
                </p>
              ) : null}
            </>
          )}
        </div>

        {mealRefIso ? (
          <details
            className="rounded-2xl border border-sky-500/30 bg-sky-950/20 px-3 py-2 text-xs text-white/75"
            role="note"
          >
            <summary className="cursor-pointer font-medium text-sky-100/95">
              Время приёма для глюкозы:{" "}
              <span className="tabular-nums font-normal text-white">
                {formatGlucoseDate(mealRefIso)}
              </span>
            </summary>
            <p className="mt-2 leading-relaxed text-white/55">
              Подставляются только замеры{" "}
              <span className="text-white/75">на этот момент или раньше</span>.
              Более поздние не выбираются автоматически.
            </p>
          </details>
        ) : null}

        {recentMeals.length > 0 ? (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-white/45">
              Недавние приёмы пищи
            </p>
            <p className="mt-0.5 text-xs text-white/40">
              Подставить сумму углеводов из журнала (можно изменить вручную).
            </p>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {recentMeals.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setMealContextDisplay(recentOptionToContext(m));
                    setInsulinLinkedMealId(m.id);
                    setMealRefIso(m.eatenAt);
                    setCarbs(String(m.totalCarbs));
                    const gRaw = suggestionFromRecentOption(m);
                    const g = glucoseSuggestionAllowed(gRaw, m.eatenAt);
                    setActiveGlucoseSuggestion(g);
                    setGlucose(
                      g != null && Number.isFinite(g.value) ? String(g.value) : ""
                    );
                    clearResult();
                  }}
                  className="shrink-0 rounded-2xl border border-white/15 bg-white/[0.06] px-3 py-2 text-left text-xs text-white/85 transition-colors hover:border-white/25 hover:bg-white/[0.09]"
                >
                  <span className="font-medium text-white">
                    {m.mealTypeLabel} · {m.totalCarbs} г УВ
                  </span>
                  <span className="mt-0.5 block text-white/45">
                    {formatGlucoseDate(m.eatenAt)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {mealRefIso != null && !activeGlucoseSuggestion ? (
          <p className="text-xs leading-relaxed text-amber-100/85" role="status">
            До времени приёма ({formatGlucoseDate(mealRefIso)}) в журнале нет
            замера глюкозы — подставить нечего. Введите значение вручную.
          </p>
        ) : null}

        {activeGlucoseSuggestion != null &&
        Number.isFinite(activeGlucoseSuggestion.value) ? (
          <div className="space-y-2">
            <p className="text-xs text-white/55" role="status">
              {mealRefIso ?
                <>
                  Предлагаемый замер для этого приёма:{" "}
                  <span className="tabular-nums font-medium text-white">
                    {activeGlucoseSuggestion.value}
                  </span>{" "}
                  ({formatGlucoseDate(activeGlucoseSuggestion.measuredAt)}) — не
                  позже времени приёма.
                </>
              : <>
                  Предлагаемый замер (последний в журнале):{" "}
                  <span className="tabular-nums font-medium text-white">
                    {activeGlucoseSuggestion.value}
                  </span>{" "}
                  ({formatGlucoseDate(activeGlucoseSuggestion.measuredAt)}).
                </>}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setGlucose(String(activeGlucoseSuggestion.value));
                  clearResult();
                }}
                className="rounded-2xl border border-white/15 bg-white/[0.06] px-3 py-2 text-left text-xs text-white/85 hover:border-white/25"
              >
                Подставить в поле:{" "}
                <span className="tabular-nums font-medium text-white">
                  {activeGlucoseSuggestion.value}
                </span>
              </button>
            </div>
          </div>
        ) : null}

        <label className="block text-sm text-white/70">
          Углеводы (г)
          <input
            name="carbs"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.1"
            value={carbs}
            onChange={(e) => {
              setCarbs(e.target.value);
              clearResult();
            }}
            disabled={!ready}
            placeholder="0"
            className={inputClass}
          />
        </label>

        <label className="block text-sm text-white/70">
          Текущая глюкоза
          <input
            name="current_glucose"
            type="number"
            inputMode="decimal"
            min={0.1}
            step="0.1"
            value={glucose}
            onChange={(e) => {
              setGlucose(e.target.value);
              clearResult();
            }}
            disabled={!ready}
            placeholder={mealRefIso ? "глюкоза на момент приёма" : "замер"}
            className={inputClass}
          />
        </label>

        <button
          type="button"
          onClick={handleEstimate}
          disabled={!readyForActiveTime}
          className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          Показать оценку
        </button>

        <div
          className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs text-white/70"
          role="status"
        >
          <p>
            Активный блок коэффициентов:{" "}
            <span className="font-medium text-white">
              {resolvedForActiveTime.blockLabel}
            </span>
            .
          </p>
          <p className="mt-1 tabular-nums text-white/80">
            Г углеводов на 1 ед.:{" "}
            {resolvedForActiveTime.carbRatio != null ?
              resolvedForActiveTime.carbRatio
            : "—"}
            {insulinPerXeLine ? ` · ~1 ХЕ (12 г): ${insulinPerXeLine} ед.` : ""}
            {" · "}Падение сахара на 1 ед.:{" "}
            {resolvedForActiveTime.insulinSensitivity != null ?
              resolvedForActiveTime.insulinSensitivity
            : "—"}
          </p>
          {resolvedForActiveTime.usesFallbackCarbRatio ||
          resolvedForActiveTime.usesFallbackSensitivity ? (
            <p className="mt-1 text-white/50">
              Для этого блока часть значений не заполнена — использованы базовые
              из «Настроек».
            </p>
          ) : null}
        </div>
      </div>

      <BolusResultCard
        estimate={estimate}
        message={error}
        insulinPrefillHref={insulinPrefillHref}
        glucoseTargetMin={settings.glucose_target_min}
        glucoseTargetMax={settings.glucose_target_max}
        doseStep={settings.insulin_dose_step}
      />
    </div>
  );
}
