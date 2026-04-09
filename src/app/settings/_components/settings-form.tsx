"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { UserSettings } from "@/lib/types/glucose";
import {
  updateUserSettingsAction,
  type SettingsActionResult,
} from "../actions";
import {
  FEEDBACK_ERROR,
  FEEDBACK_SUCCESS,
  SURFACE_CARD,
} from "@/lib/ui/page-patterns";

const initial: SettingsActionResult = { success: false, error: null };

const inputClass =
  "mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-base text-white outline-none placeholder:text-white/40 focus:border-white/30 disabled:opacity-60";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-65"
    >
      {pending ? "Сохранение…" : "Сохранить"}
    </button>
  );
}

type SettingsFormProps = {
  initialSettings: UserSettings;
};

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: SettingsActionResult, formData: FormData) =>
      updateUserSettingsAction(formData),
    initial
  );

  const showSaved = state.success;
  const carbStr =
    initialSettings.carb_ratio != null
      ? String(initialSettings.carb_ratio)
      : "";
  const isensStr =
    initialSettings.insulin_sensitivity != null
      ? String(initialSettings.insulin_sensitivity)
      : "";
  const carbMorningStr =
    initialSettings.carb_ratio_morning != null
      ? String(initialSettings.carb_ratio_morning)
      : "";
  const carbDayStr =
    initialSettings.carb_ratio_day != null
      ? String(initialSettings.carb_ratio_day)
      : "";
  const carbEveningStr =
    initialSettings.carb_ratio_evening != null
      ? String(initialSettings.carb_ratio_evening)
      : "";
  const carbNightStr =
    initialSettings.carb_ratio_night != null
      ? String(initialSettings.carb_ratio_night)
      : "";
  const isensMorningStr =
    initialSettings.insulin_sensitivity_morning != null
      ? String(initialSettings.insulin_sensitivity_morning)
      : "";
  const isensDayStr =
    initialSettings.insulin_sensitivity_day != null
      ? String(initialSettings.insulin_sensitivity_day)
      : "";
  const isensEveningStr =
    initialSettings.insulin_sensitivity_evening != null
      ? String(initialSettings.insulin_sensitivity_evening)
      : "";
  const isensNightStr =
    initialSettings.insulin_sensitivity_night != null
      ? String(initialSettings.insulin_sensitivity_night)
      : "";
  const tzStr = initialSettings.timezone ?? "";

  return (
    <form action={formAction} className="space-y-6">
      <section className={SURFACE_CARD}>
        <h2 className="text-base font-medium text-white">Целевая глюкоза</h2>
        <p className="mt-1 text-xs text-white/50">
          Используется для подсветки и статистики на экране глюкозы.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm text-white/70">
            Минимум
            <input
              name="glucose_target_min"
              type="number"
              inputMode="decimal"
              step="0.1"
              required
              disabled={isPending}
              defaultValue={initialSettings.glucose_target_min}
              className={inputClass}
            />
          </label>
          <label className="block text-sm text-white/70">
            Максимум
            <input
              name="glucose_target_max"
              type="number"
              inputMode="decimal"
              step="0.1"
              required
              disabled={isPending}
              defaultValue={initialSettings.glucose_target_max}
              className={inputClass}
            />
          </label>
        </div>
      </section>

      <section className={SURFACE_CARD}>
        <h2 className="text-base font-medium text-white">Помощник болюса</h2>
        <p className="mt-1 text-xs leading-relaxed text-white/50">
          Для базовой работы помощника нужны 2 поля ниже: общий УК и общая
          чувствительность. Блоки по времени суток — необязательные уточнения.
        </p>
        <div className="mt-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-100/90">
            Базовые значения (рекомендуется заполнить)
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm text-white/70">
              Общий УК (г / 1 ед.)
              <input
                name="carb_ratio"
                type="number"
                inputMode="decimal"
                step="0.1"
                disabled={isPending}
                placeholder="например, 12"
                defaultValue={carbStr}
                className={inputClass}
              />
            </label>
            <label className="block text-sm text-white/70">
              Общая чувствительность
              <input
                name="insulin_sensitivity"
                type="number"
                inputMode="decimal"
                step="0.1"
                disabled={isPending}
                placeholder="например, 2"
                defaultValue={isensStr}
                className={inputClass}
              />
            </label>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-emerald-100/80">
            Эти поля используются как fallback для всех блоков времени, где
            локальные значения не заданы.
          </p>
        </div>

        <details className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <summary className="cursor-pointer list-none text-xs font-medium uppercase tracking-wide text-white/55 [&::-webkit-details-marker]:hidden">
            Уточнения по времени суток (необяз.){" "}
            <span className="font-normal text-white/35">▼</span>
          </summary>
          <p className="mt-2 text-xs leading-relaxed text-white/45">
            Только если УК/чувствительность реально отличаются. Пустые поля берут
            общий fallback выше.
          </p>
          <div className="mt-3 space-y-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-white/55">
                Утро · 06:00-11:59
              </p>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <label className="block text-sm text-white/70">
                  УК
                  <input
                    name="carb_ratio_morning"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    disabled={isPending}
                    defaultValue={carbMorningStr}
                    className={inputClass}
                  />
                </label>
                <label className="block text-sm text-white/70">
                  Чувствительность
                  <input
                    name="insulin_sensitivity_morning"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    disabled={isPending}
                    defaultValue={isensMorningStr}
                    className={inputClass}
                  />
                </label>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-white/55">
                День · 12:00-17:59
              </p>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <label className="block text-sm text-white/70">
                  УК
                  <input
                    name="carb_ratio_day"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    disabled={isPending}
                    defaultValue={carbDayStr}
                    className={inputClass}
                  />
                </label>
                <label className="block text-sm text-white/70">
                  Чувствительность
                  <input
                    name="insulin_sensitivity_day"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    disabled={isPending}
                    defaultValue={isensDayStr}
                    className={inputClass}
                  />
                </label>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-white/55">
                Вечер · 18:00-23:59
              </p>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <label className="block text-sm text-white/70">
                  УК
                  <input
                    name="carb_ratio_evening"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    disabled={isPending}
                    defaultValue={carbEveningStr}
                    className={inputClass}
                  />
                </label>
                <label className="block text-sm text-white/70">
                  Чувствительность
                  <input
                    name="insulin_sensitivity_evening"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    disabled={isPending}
                    defaultValue={isensEveningStr}
                    className={inputClass}
                  />
                </label>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-white/55">
                Ночь · 00:00-05:59
              </p>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <label className="block text-sm text-white/70">
                  УК
                  <input
                    name="carb_ratio_night"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    disabled={isPending}
                    defaultValue={carbNightStr}
                    className={inputClass}
                  />
                </label>
                <label className="block text-sm text-white/70">
                  Чувствительность
                  <input
                    name="insulin_sensitivity_night"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    disabled={isPending}
                    defaultValue={isensNightStr}
                    className={inputClass}
                  />
                </label>
              </div>
            </div>
          </div>
        </details>
      </section>

      <section className={SURFACE_CARD}>
        <h2 className="text-base font-medium text-white">Часовой пояс</h2>
        <p className="mt-1 text-xs text-white/50">
          Если поле пустое, даты и формы используют системный пояс сервера (
          <span className="text-white/65">обычно UTC</span> в облаке). Задайте
          IANA — например, <span className="text-white/65">Europe/Moscow</span> или{" "}
          <span className="text-white/65">UTC+3</span>.
        </p>
        <label className="mt-3 block text-sm text-white/70">
          Явный пояс (необязательно)
          <input
            name="timezone"
            type="text"
            disabled={isPending}
            placeholder="Оставьте пустым для fallback"
            defaultValue={tzStr}
            maxLength={64}
            className={inputClass}
          />
        </label>
      </section>

      {state.error ? (
        <p role="alert" className={FEEDBACK_ERROR}>
          {state.error}
        </p>
      ) : null}

      <SubmitButton />

      {showSaved ? (
        <p className={FEEDBACK_SUCCESS} role="status" aria-live="polite">
          Сохранено
        </p>
      ) : null}
    </form>
  );
}
