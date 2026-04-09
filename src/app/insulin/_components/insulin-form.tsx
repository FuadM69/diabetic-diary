"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import type { GlucoseRangeKey } from "@/lib/types/glucose";
import { INSULIN_ENTRY_TYPES } from "@/lib/types/insulin";
import {
  INSULIN_ENTRY_TYPE_LABEL_RU,
  getInsulinTakenAtTimezoneCaption,
} from "@/lib/utils/insulin";
import type { InsulinQueryPrefill } from "@/lib/utils/insulin-form";
import {
  createInsulinEntryAction,
  type InsulinActionResult,
} from "../actions";
import {
  FEEDBACK_ERROR,
  FEEDBACK_SUCCESS,
} from "@/lib/ui/page-patterns";
import {
  extractLinkedMealIdFromInsulinNote,
  stripLinkedMealMarkerFromInsulinNote,
} from "@/lib/utils/bolus-prefill";

const initial: InsulinActionResult = { success: false, error: null };

const inputClass =
  "mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-base text-white outline-none placeholder:text-white/40 focus:border-white/30 disabled:opacity-60";

function SubmitButton({
  disabled,
  pending,
}: {
  disabled: boolean;
  pending: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-65"
    >
      {pending ? "Сохранение…" : "Добавить запись"}
    </button>
  );
}

type InsulinFormProps = {
  /** Optional draft from `/insulin?units=…` (never trusted until submit). */
  queryPrefill?: InsulinQueryPrefill | null;
  /** `datetime-local` default from server (wall time in user_settings.timezone). */
  defaultTakenAtLocal: string;
  /** When profile timezone is missing/invalid — do not submit misleading times. */
  timezoneConfigError?: string | null;
  /** Saved `user_settings.timezone` (raw) — caption under datetime-local. */
  savedUserTimezone: string | null;
  /** Active journal period (list filter); used to explain visibility after save. */
  activeRange: GlucoseRangeKey;
  activeRangeLabel: string;
  /** Explicit UX marker from bolus prefill link. */
  prefillFromBolusFlow?: boolean;
  /** Whether bolus prefill came from a meal-linked context. */
  prefillFromMeal?: boolean;
};

export function InsulinForm({
  queryPrefill = null,
  defaultTakenAtLocal,
  timezoneConfigError = null,
  savedUserTimezone,
  activeRange,
  activeRangeLabel,
  prefillFromBolusFlow = false,
  prefillFromMeal = false,
}: InsulinFormProps) {
  const takenAtTzCaption = getInsulinTakenAtTimezoneCaption(savedUserTimezone);
  const [takenAt, setTakenAt] = useState(defaultTakenAtLocal);
  const [browserValidationError, setBrowserValidationError] = useState<
    string | null
  >(null);
  const [fieldKey, setFieldKey] = useState(0);

  useEffect(() => {
    setTakenAt(defaultTakenAtLocal);
  }, [defaultTakenAtLocal]);

  const [state, formAction, isPending] = useActionState(
    async (_prev: InsulinActionResult, fd: FormData) =>
      createInsulinEntryAction(fd),
    initial
  );

  useEffect(() => {
    if (state.success) {
      setBrowserValidationError(null);
      setFieldKey((k) => k + 1);
    }
  }, [state]);

  const blockSubmit = Boolean(timezoneConfigError);
  const disabled = blockSubmit || isPending;
  const combinedError =
    timezoneConfigError || browserValidationError || state.error;

  const prefillMealId =
    queryPrefill?.note ?
      extractLinkedMealIdFromInsulinNote(queryPrefill.note)
    : null;
  const prefillNoteVisible =
    queryPrefill?.note ?
      (stripLinkedMealMarkerFromInsulinNote(queryPrefill.note) ?? queryPrefill.note)
    : "";

  return (
    <form
      action={formAction}
      className="space-y-4"
      onSubmit={(e) => {
        const form = e.currentTarget;
        if (disabled) {
          e.preventDefault();
          return;
        }
        if (!form.checkValidity()) {
          e.preventDefault();
          const firstInvalid = form.querySelector(":invalid");
          const msg =
            firstInvalid instanceof HTMLInputElement ||
            firstInvalid instanceof HTMLTextAreaElement ||
            firstInvalid instanceof HTMLSelectElement
              ? firstInvalid.validationMessage
              : "Проверьте поля формы.";
          setBrowserValidationError(msg);
          firstInvalid instanceof HTMLElement && firstInvalid.focus();
          return;
        }
        setBrowserValidationError(null);
        if (process.env.NEXT_PUBLIC_INSULIN_DEBUG === "1") {
          const fd = new FormData(form);
          console.log(
            "[insulin][client] submit FormData:",
            Object.fromEntries(fd.entries())
          );
        }
      }}
    >
      {prefillMealId ? (
        <input type="hidden" name="linked_meal_id" value={prefillMealId} />
      ) : null}
      {!state.success && (queryPrefill != null || prefillFromBolusFlow) ? (
        <div
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2"
          role="status"
        >
          <p className="text-xs font-medium text-white/85">
            Это черновик — проверьте дозу и время перед сохранением.
          </p>
          {prefillFromBolusFlow ? (
            <p className="mt-1 text-[0.7rem] text-sky-200/90">
              Шаг 2 из 3 — из помощника болюса
              {prefillFromMeal ? " · приём пищи" : ""}.
            </p>
          ) : null}
          <details className="mt-1.5 text-[0.65rem] text-white/45 [&_summary::-webkit-details-marker]:hidden">
            <summary className="cursor-pointer list-none text-white/50">
              Подробнее
            </summary>
            <div className="mt-1.5 space-y-1.5 border-t border-white/10 pt-1.5 leading-relaxed">
              {queryPrefill ? (
                <p>
                  Поля могли подставиться из ссылки (помощник болюса,
                  калькулятор, экран глюкозы). Строка в журнале появится только
                  после «Добавить запись».
                </p>
              ) : null}
              {prefillFromBolusFlow ? (
                <p>
                  Шаг 3 — сохранение в журнал кнопкой «Добавить запись».
                </p>
              ) : null}
            </div>
          </details>
        </div>
      ) : null}

      <div>
        <label className="block text-sm text-white/70">
          Когда введено
          <input
            name="taken_at"
            type="datetime-local"
            required
            value={takenAt}
            onChange={(e) => setTakenAt(e.target.value)}
            disabled={disabled}
            className={inputClass}
          />
        </label>
        {!blockSubmit ? (
          <p className="mt-1.5 text-xs leading-relaxed text-white/45">
            {takenAtTzCaption}
          </p>
        ) : null}
      </div>

      <fieldset className="space-y-2" disabled={disabled}>
        <legend className="text-sm text-white/70">Тип</legend>
        <div
          key={fieldKey}
          className="grid grid-cols-1 gap-2 sm:grid-cols-3"
        >
          {INSULIN_ENTRY_TYPES.map((key) => (
            <label key={key} className="relative block cursor-pointer">
              <input
                type="radio"
                name="entry_type"
                value={key}
                defaultChecked={
                  key === (queryPrefill?.entry_type ?? "bolus")
                }
                required={key === INSULIN_ENTRY_TYPES[0]}
                className="peer sr-only"
              />
              <span className="block rounded-2xl border border-white/15 bg-white/[0.04] px-3 py-3 text-center text-sm text-white/90 peer-checked:border-white peer-checked:bg-white peer-checked:font-medium peer-checked:text-black">
                {INSULIN_ENTRY_TYPE_LABEL_RU[key]}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block text-sm text-white/70">
        Единицы (УЕ)
        <input
          key={`units-${fieldKey}`}
          name="units"
          type="number"
          inputMode="decimal"
          min={0.05}
          step="any"
          required
          disabled={disabled}
          defaultValue={queryPrefill?.units}
          placeholder="например, 4"
          className={inputClass}
        />
      </label>

      <label className="block text-sm text-white/70">
        Название инсулина{" "}
        <span className="font-normal text-white/40">(необязательно)</span>
        <input
          key={`name-${fieldKey}`}
          name="insulin_name"
          type="text"
          disabled={disabled}
          placeholder="например, Новорапид"
          className={inputClass}
        />
      </label>

      <label className="block text-sm text-white/70">
        Заметка{" "}
        <span className="font-normal text-white/40">(необязательно)</span>
        <textarea
          key={`note-${fieldKey}`}
          name="note"
          rows={2}
          disabled={disabled}
          defaultValue={prefillNoteVisible}
          placeholder="комментарий к введению"
          className={`${inputClass} resize-none`}
        />
      </label>

      {state.success &&
      state.savedEntryTypeLabel &&
      state.savedTakenAtDisplay ? (
        <p role="status" className={FEEDBACK_SUCCESS}>
          Запись сохранена:{" "}
          <strong className="font-medium">{state.savedEntryTypeLabel}</strong>
          {", "}
          <span className="tabular-nums">{state.savedTakenAtDisplay}</span> —
          как в журнале (время по настройкам профиля).
          {prefillFromBolusFlow ? (
            <>
              {" "}
              Статус: шаг 3 из 3 — запись сохранена в журнал инсулина.
            </>
          ) : null}
          {activeRange !== "all" ? (
            <>
              {" "}
              Список ниже сейчас ограничен периодом «{activeRangeLabel}» —
              запись появится только если эта дата не раньше нижней границы
              фильтра. Иначе откройте{" "}
              <Link
                href="/insulin?range=all"
                className="font-medium text-emerald-200/95 underline decoration-emerald-400/40 underline-offset-2"
              >
                всё время
              </Link>
              .
            </>
          ) : (
            <> Список ниже показывает весь журнал.</>
          )}
        </p>
      ) : null}

      {combinedError ? (
        <p role="alert" className={FEEDBACK_ERROR}>
          {combinedError}
        </p>
      ) : null}

      <SubmitButton disabled={blockSubmit} pending={isPending} />
    </form>
  );
}
