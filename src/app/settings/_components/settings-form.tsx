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
  "mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/40 focus:border-white/30 disabled:opacity-60";

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
          Оба поля нужны для оценки болюса на странице «Болюс»: коэффициент —
          сколько г углеводов «покрывает» 1 ед. инсулина; чувствительность — на
          сколько единиц снижает глюкозу на 1 единицу в ваших единицах. Это
          личные значения от врача или опыта; можно оставить пустым, если
          расчёт не используете.
        </p>
        <label className="mt-4 block text-sm text-white/70">
          Углеводный коэффициент (г / 1 ед.)
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
        <label className="mt-4 block text-sm text-white/70">
          Чувствительность (снижение глюкозы на 1 ед.)
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
      </section>

      <section className={SURFACE_CARD}>
        <h2 className="text-base font-medium text-white">Часовой пояс</h2>
        <p className="mt-1 text-xs text-white/50">
          Произвольная строка (например, Europe/Moscow или UTC+3).
        </p>
        <label className="mt-4 block text-sm text-white/70">
          Часовой пояс
          <input
            name="timezone"
            type="text"
            disabled={isPending}
            placeholder="Europe/Moscow"
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
