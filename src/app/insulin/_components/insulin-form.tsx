"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { INSULIN_ENTRY_TYPES } from "@/lib/types/insulin";
import { formatDatetimeLocalValue } from "@/lib/utils/datetime-local";
import {
  INSULIN_ENTRY_TYPE_LABEL_RU,
} from "@/lib/utils/insulin";
import type { InsulinQueryPrefill } from "@/lib/utils/insulin-form";
import {
  createInsulinEntryAction,
  type InsulinActionResult,
} from "../actions";
import { FEEDBACK_ERROR } from "@/lib/ui/page-patterns";

const initial: InsulinActionResult = { success: false, error: null };

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
      {pending ? "Сохранение…" : "Добавить запись"}
    </button>
  );
}

type InsulinFormProps = {
  formKey: string;
  /** Optional draft from `/insulin?units=…` (never trusted until submit). */
  queryPrefill?: InsulinQueryPrefill | null;
};

export function InsulinForm({ formKey, queryPrefill = null }: InsulinFormProps) {
  const [takenAt, setTakenAt] = useState(() =>
    formatDatetimeLocalValue(new Date())
  );

  const [state, formAction, isPending] = useActionState(
    async (_prev: InsulinActionResult, fd: FormData) =>
      createInsulinEntryAction(fd),
    initial
  );

  return (
    <form key={formKey} action={formAction} className="space-y-4">
      <label className="block text-sm text-white/70">
        Когда введено
        <input
          name="taken_at"
          type="datetime-local"
          required
          value={takenAt}
          onChange={(e) => setTakenAt(e.target.value)}
          disabled={isPending}
          className={inputClass}
        />
      </label>

      <fieldset className="space-y-2">
        <legend className="text-sm text-white/70">Тип</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
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
                disabled={isPending}
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
          name="units"
          type="number"
          inputMode="decimal"
          min={0.05}
          step="0.05"
          required
          disabled={isPending}
          defaultValue={queryPrefill?.units}
          placeholder="например, 4"
          className={inputClass}
        />
      </label>

      <label className="block text-sm text-white/70">
        Название инсулина{" "}
        <span className="font-normal text-white/40">(необязательно)</span>
        <input
          name="insulin_name"
          type="text"
          disabled={isPending}
          placeholder="например, Новорапид"
          className={inputClass}
        />
      </label>

      <label className="block text-sm text-white/70">
        Заметка{" "}
        <span className="font-normal text-white/40">(необязательно)</span>
        <textarea
          name="note"
          rows={2}
          disabled={isPending}
          defaultValue={queryPrefill?.note ?? ""}
          placeholder="комментарий к введению"
          className={`${inputClass} resize-none`}
        />
      </label>

      {state.error ? (
        <p role="alert" className={FEEDBACK_ERROR}>
          {state.error}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
