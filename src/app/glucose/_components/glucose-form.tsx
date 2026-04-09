"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import type { UserSettings } from "@/lib/types/glucose";
import { formatBolusDose } from "@/lib/utils/bolus";
import {
  bolusTargetGlucoseFromRange,
  computeCorrectionBolus,
} from "@/lib/utils/bolus";
import {
  submitGlucoseEntry,
  type GlucoseSubmitResult,
} from "../actions";
import { FEEDBACK_ERROR, FEEDBACK_SUCCESS } from "@/lib/ui/page-patterns";
import { formatDatetimeLocalValue } from "@/lib/utils/datetime-local";
import { buildGlucoseCorrectionInsulinPrefillHref } from "@/lib/utils/bolus-prefill";
import {
  formatInsulinDoseStepRu,
  insulinPrefillUnitsOrFallback,
} from "@/lib/utils/insulin-dose-step";
import { formatGlucoseValue } from "@/lib/utils/glucose";

const initialState: GlucoseSubmitResult = {
  success: false,
  error: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Сохранение…" : "Добавить запись"}
    </button>
  );
}

type GlucoseFormProps = {
  /** Bumps when server data changes after save so fields reset without useEffect. */
  formKey: string;
  settings: UserSettings;
};

export function GlucoseForm({ formKey, settings }: GlucoseFormProps) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: GlucoseSubmitResult, formData: FormData) =>
      submitGlucoseEntry(formData),
    initialState
  );
  const [glucoseInput, setGlucoseInput] = useState("");

  /** Fresh “now” whenever the parent re-renders; the `<form key={formKey}>` remount applies it after save. */
  const defaultMeasuredAt = formatDatetimeLocalValue(new Date());

  const showValidationOrGeneralError = state.error !== null;
  const showSuccess = state.success && !state.error;
  const currentGlucose = Number.parseFloat(glucoseInput.replace(",", "."));
  const hasGlucoseForSuggestion =
    glucoseInput.trim().length > 0 &&
    Number.isFinite(currentGlucose) &&
    currentGlucose > 0;
  const hasSensitivity =
    typeof settings.insulin_sensitivity === "number" &&
    Number.isFinite(settings.insulin_sensitivity) &&
    settings.insulin_sensitivity > 0;
  const targetGlucose = bolusTargetGlucoseFromRange(
    settings.glucose_target_min,
    settings.glucose_target_max
  );
  const correctionUnits =
    hasGlucoseForSuggestion && hasSensitivity
      ? computeCorrectionBolus(
          currentGlucose,
          targetGlucose,
          settings.insulin_sensitivity!
        )
      : 0;
  const correctionRounded =
    correctionUnits > 0 ?
      insulinPrefillUnitsOrFallback(
        correctionUnits,
        settings.insulin_dose_step
      )
    : 0;
  const correctionPrefillHref =
    correctionUnits > 0 ?
      buildGlucoseCorrectionInsulinPrefillHref({
        roundedUnits: correctionRounded,
      })
    : null;

  useEffect(() => {
    if (state.success) {
      setGlucoseInput("");
    }
  }, [state.success]);

  return (
    <form key={formKey} action={formAction} className="space-y-4">
      <input type="hidden" name="source" value="manual" />
      <div>
        <label
          htmlFor="glucoseValue"
          className="block text-sm text-white/70"
        >
          Глюкоза
        </label>
        <input
          id="glucoseValue"
          name="glucoseValue"
          type="number"
          min={0.1}
          step="0.1"
          inputMode="decimal"
          placeholder="Например, 6.2"
          value={glucoseInput}
          onChange={(e) => setGlucoseInput(e.target.value)}
          disabled={isPending}
          aria-invalid={showValidationOrGeneralError}
          aria-describedby={
            showValidationOrGeneralError ? "glucose-form-error" : undefined
          }
          className="mt-2 w-full max-w-xs rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-base text-white outline-none placeholder:text-white/40 focus:border-white/30 disabled:opacity-60 aria-invalid:border-red-400/50"
        />
      </div>

      {hasGlucoseForSuggestion ? (
        <div
          className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm"
          role="status"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-white/45">
            Подсказка коррекции
          </p>
          {!hasSensitivity ? (
            <p className="mt-1 text-white/70">
              Не задан фактор коррекции (сдвиг глюкозы на 1 ед.) — откройте{" "}
              <Link
                href="/settings"
                className="underline decoration-white/30 underline-offset-2"
              >
                настройки
              </Link>
              .
            </p>
          ) : correctionUnits > 0 ? (
            <>
              <p className="mt-1 text-xs leading-relaxed text-white/55">
                Цель коррекции — середина вашего диапазона{" "}
                <span className="tabular-nums text-white/75">
                  {formatGlucoseValue(settings.glucose_target_min)}–
                  {formatGlucoseValue(settings.glucose_target_max)}
                </span>
                , сейчас для расчёта взято{" "}
                <span className="tabular-nums font-medium text-white/85">
                  {formatGlucoseValue(targetGlucose)}
                </span>
                .
              </p>
              <p className="mt-2 text-white/85">
                <span className="tabular-nums text-2xl font-semibold text-white">
                  {formatBolusDose(correctionRounded)} ед.
                </span>
                <span className="ml-1 text-sm font-medium text-emerald-200/90">
                  к вводу
                </span>
              </p>
              <p className="mt-1 tabular-nums text-xs text-white/45">
                расчёт без округления: {formatBolusDose(correctionUnits)} ед. ·
                шаг {formatInsulinDoseStepRu(settings.insulin_dose_step)}
              </p>
              <p className="mt-1 text-[0.7rem] leading-snug text-white/40">
                Округление до {formatInsulinDoseStepRu(settings.insulin_dose_step)}{" "}
                — ближайший шаг на сетке; в форму инсулина подставляется
                практическая доза.
              </p>
              {correctionPrefillHref ? (
                <Link
                  href={correctionPrefillHref}
                  className="mt-2 inline-flex rounded-xl border border-white/20 px-3 py-2 text-xs font-medium text-white/90 hover:bg-white/5"
                  prefetch={false}
                >
                  Открыть форму инсулина с подсказкой
                </Link>
              ) : null}
            </>
          ) : (
            <p className="mt-1 text-white/70">
              Глюкоза в/ниже цели — коррекция не требуется.
            </p>
          )}
          <p className="mt-2 text-[0.7rem] leading-snug text-white/45">
            Это только ориентир, запись инсулина создаёте вручную.
          </p>
        </div>
      ) : null}

      <div>
        <label
          htmlFor="glucose-measured-at"
          className="block text-sm text-white/70"
        >
          Дата и время замера
        </label>
        <input
          id="glucose-measured-at"
          name="measuredAt"
          type="datetime-local"
          defaultValue={defaultMeasuredAt}
          disabled={isPending}
          aria-invalid={showValidationOrGeneralError}
          aria-describedby={
            showValidationOrGeneralError ? "glucose-form-error" : undefined
          }
          className="mt-2 w-full max-w-xs rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-base text-white outline-none focus:border-white/30 disabled:opacity-60 aria-invalid:border-red-400/50 [color-scheme:dark]"
        />
      </div>
      <label htmlFor="glucose-note" className="block text-sm text-white/70">
        Заметка{" "}
        <span className="font-normal text-white/40">(необязательно)</span>
        <textarea
          id="glucose-note"
          name="note"
          rows={2}
          disabled={isPending}
          placeholder="контекст замера"
          className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-base text-white outline-none placeholder:text-white/40 focus:border-white/30 disabled:opacity-60"
        />
      </label>
      <SubmitButton />

      <div aria-live="polite" className="min-h-[1.25rem]">
        {showSuccess ? (
          <p className={FEEDBACK_SUCCESS}>Запись сохранена.</p>
        ) : null}
      </div>

      {showValidationOrGeneralError ? (
        <p
          id="glucose-form-error"
          role="alert"
          className={FEEDBACK_ERROR}
        >
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
