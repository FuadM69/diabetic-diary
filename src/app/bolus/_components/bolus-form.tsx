"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { BolusMealContext, BolusRecentMealOption } from "@/lib/types/bolus";
import type { UserSettings } from "@/lib/types/glucose";
import type { BolusEstimate } from "@/lib/utils/bolus";
import { computeBolusEstimate } from "@/lib/utils/bolus";
import type { BolusUrlPrefill } from "@/lib/utils/bolus-prefill";
import { buildInsulinPrefillHref } from "@/lib/utils/bolus-prefill";
import {
  bolusSettingsMissingMessage,
  bolusSettingsReady,
  parseBolusHelperInput,
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
  latestGlucose: number | null;
  latestGlucoseMeasuredAt: string | null;
};

function recentOptionToContext(m: BolusRecentMealOption): BolusMealContext {
  return {
    mealTypeLabel: m.mealTypeLabel,
    eatenAtDisplay: formatGlucoseDate(m.eatenAt),
    carbsGrams: m.totalCarbs,
  };
}

function toComputeSettings(s: UserSettings) {
  return {
    glucose_target_min: s.glucose_target_min,
    glucose_target_max: s.glucose_target_max,
    carb_ratio: s.carb_ratio!,
    insulin_sensitivity: s.insulin_sensitivity!,
  };
}

export function BolusForm({
  settings,
  recentMeals,
  urlPrefill,
  initialMealContext,
  linkedMealMissing,
  latestGlucose,
  latestGlucoseMeasuredAt,
}: BolusFormProps) {
  const ready = useMemo(() => bolusSettingsReady(settings), [settings]);

  const [mealContextDisplay, setMealContextDisplay] = useState<
    BolusMealContext | null
  >(() => initialMealContext);

  const [insulinLinkedMealId, setInsulinLinkedMealId] = useState<
    string | null
  >(() => (linkedMealMissing ? null : urlPrefill.linkedMealId));

  const [carbs, setCarbs] = useState(() => urlPrefill.carbs);
  const [glucose, setGlucose] = useState(() => {
    if (urlPrefill.glucose.length > 0) {
      return urlPrefill.glucose;
    }
    if (latestGlucose != null && Number.isFinite(latestGlucose)) {
      return String(latestGlucose);
    }
    return "";
  });
  const [estimate, setEstimate] = useState<BolusEstimate | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEstimate = () => {
    setError(null);
    setEstimate(null);

    if (!ready) {
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
        settings: toComputeSettings(settings),
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
                <p className="mt-1 text-xs leading-relaxed text-white/50">
                  Значение в поле «Углеводы» ниже вы вводите или подставляете
                  сами — оно участвует в расчёте. Цифра выше показывает сумму
                  из записи приёма пищи.
                </p>
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
              <p className="text-xs leading-relaxed text-white/45">
                Приём пищи из журнала не выбран. Углеводы и время ниже задаёте
                вы; свяжите с записью, открыв помощник с карточки приёма или
                нажав недавний приём.
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
                    setCarbs(String(m.totalCarbs));
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

        {latestGlucose != null && Number.isFinite(latestGlucose) ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setGlucose(String(latestGlucose));
                clearResult();
              }}
              className="rounded-2xl border border-white/15 bg-white/[0.06] px-3 py-2 text-xs text-white/85 hover:border-white/25"
            >
              Подставить последнюю глюкозу: {latestGlucose}
              {latestGlucoseMeasuredAt ? (
                <span className="ml-1 text-white/45">
                  ({formatGlucoseDate(latestGlucoseMeasuredAt)})
                </span>
              ) : null}
            </button>
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
            placeholder="замер сейчас"
            className={inputClass}
          />
        </label>

        <button
          type="button"
          onClick={handleEstimate}
          disabled={!ready}
          className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          Показать оценку
        </button>
      </div>

      <BolusResultCard
        estimate={estimate}
        message={error}
        insulinPrefillHref={insulinPrefillHref}
      />
    </div>
  );
}
