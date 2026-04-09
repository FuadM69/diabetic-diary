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
import {
  bolusTargetGlucoseFromRange,
  insulinUnitsPerTypicalBreadUnit,
} from "@/lib/utils/bolus";

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
  const cr0 = initialSettings.carb_ratio;
  const insulinPerXeHint = insulinUnitsPerTypicalBreadUnit(
    typeof cr0 === "number" && Number.isFinite(cr0) && cr0 > 0 ? cr0 : NaN
  );
  const savedCorrectionTarget = bolusTargetGlucoseFromRange(
    initialSettings.glucose_target_min,
    initialSettings.glucose_target_max
  );
  const savedCorrectionTargetLabel = Number.isFinite(savedCorrectionTarget) ?
      new Intl.NumberFormat("ru-RU", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      }).format(savedCorrectionTarget)
    : null;

  return (
    <form action={formAction} className="space-y-6">
      <section className={SURFACE_CARD}>
        <h2 className="text-base font-medium text-white">
          Целевой диапазон глюкозы
        </h2>
        <div className="mt-2 space-y-2 text-xs leading-relaxed text-white/50">
          <p>
            <span className="text-white/65">Диапазон «в цели»</span> — для
            подсветки и статистики на экране глюкозы.
          </p>
          <p>
            <span className="text-white/65">Целевой сахар для коррекции</span>{" "}
            (доп. инсулин при высоком сахаре) —{" "}
            <span className="text-white/65">середина</span> между минимумом и
            максимумом: (мин + макс) ÷ 2, в тех же единицах, что глюкометр.
            Отдельного поля нет — подберите мин/макс так, чтобы середина была
            как у вас в плане лечения.
          </p>
          {savedCorrectionTargetLabel ? (
            <p className="text-white/40">
              По последнему сохранённому диапазону цель для коррекции ≈{" "}
              <span className="tabular-nums text-white/55">
                {savedCorrectionTargetLabel}
              </span>
              . После правки полей нажмите «Сохранить», чтобы пересчитать.
            </p>
          ) : null}
        </div>
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
        <h2 className="text-base font-medium text-white">Болюс: еда и коррекция</h2>
        <div className="mt-2 text-xs leading-relaxed text-white/50">
          <p>
            Два числа для расчётов:{" "}
            <span className="text-white/65">сколько г углеводов на 1 ед.</span>{" "}
            на еду и{" "}
            <span className="text-white/65">
              насколько падает сахар от 1 ед.
            </span>{" "}
            при коррекции. Утро/день/вечер подставляются по часовому поясу
            (ниже) и времени расчёта.
          </p>
        </div>
        <div className="mt-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-3">
          <p className="text-xs font-medium text-emerald-100/90">
            Основные значения — на весь день, если не уточните ниже
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm text-white/70">
              <span className="block leading-snug">
                Сколько углеводов покрывает 1 ед. инсулина
              </span>
              <span className="mt-0.5 block text-[0.72rem] font-normal text-emerald-100/75">
                г на 1 ед. Например: «1 ед. на 10 г» — введите{" "}
                <span className="tabular-nums">10</span>
              </span>
              <input
                name="carb_ratio"
                type="number"
                inputMode="decimal"
                step="0.1"
                disabled={isPending}
                placeholder="10"
                defaultValue={carbStr}
                className={inputClass}
              />
            </label>
            <label className="block text-sm text-white/70">
              <span className="block leading-snug">
                Насколько снижает сахар 1 ед. инсулина
              </span>
              <span className="mt-0.5 block text-[0.72rem] font-normal text-emerald-100/75">
                Те же единицы, что глюкометр. Пример:{" "}
                <span className="tabular-nums">2</span>
              </span>
              <input
                name="insulin_sensitivity"
                type="number"
                inputMode="decimal"
                step="0.1"
                disabled={isPending}
                placeholder="2"
                defaultValue={isensStr}
                className={inputClass}
              />
            </label>
          </div>
          {insulinPerXeHint ? (
            <p className="mt-2 text-xs leading-relaxed text-emerald-100/85">
              Ориентир: 1 ХЕ ≈ 12 г углеводов — ~{insulinPerXeHint} ед. на 1 ХЕ
              при этом соотношении.
            </p>
          ) : null}
          <p className="mt-2 text-xs leading-relaxed text-emerald-100/80">
            В блоке по времени суток пустое поле значит «взять отсюда».
          </p>
        </div>

        <label className="mt-4 block text-sm text-white/70">
          Шаг дозы инсулина (ручка / помпа)
          <select
            name="insulin_dose_step"
            disabled={isPending}
            defaultValue={String(initialSettings.insulin_dose_step)}
            className={`${inputClass} cursor-pointer`}
          >
            <option value="1">1 ед.</option>
            <option value="0.5">0,5 ед.</option>
            <option value="0.25">0,25 ед.</option>
          </select>
        </label>
        <p className="mt-1 text-xs leading-relaxed text-white/45">
          Подсказки доз и переход в форму инсулина округляют до ближайшего шага
          на этой сетке.
        </p>

        <details className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <summary className="cursor-pointer list-none text-xs font-medium text-white/60 [&::-webkit-details-marker]:hidden">
            Другие цифры утром, днём, вечером или ночью (необязательно){" "}
            <span className="font-normal text-white/35">▼</span>
          </summary>
          <p className="mt-2 text-xs leading-relaxed text-white/45">
            Если по времени суток цифры другие, заполните блок. Пусто — как в
            основных значениях выше.
          </p>
          <div className="mt-3 space-y-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <p className="text-xs font-medium text-white/70">Утром · 06:00–11:59</p>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <label className="block text-sm text-white/70">
                  Г углеводов на 1 ед.
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
                  Падение сахара на 1 ед.
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
              <p className="text-xs font-medium text-white/70">Днём · 12:00–17:59</p>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <label className="block text-sm text-white/70">
                  Г углеводов на 1 ед.
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
                  Падение сахара на 1 ед.
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
              <p className="text-xs font-medium text-white/70">
                Вечером · 18:00–23:59
              </p>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <label className="block text-sm text-white/70">
                  Г углеводов на 1 ед.
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
                  Падение сахара на 1 ед.
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
              <p className="text-xs font-medium text-white/70">Ночью · 00:00–05:59</p>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <label className="block text-sm text-white/70">
                  Г углеводов на 1 ед.
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
                  Падение сахара на 1 ед.
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
