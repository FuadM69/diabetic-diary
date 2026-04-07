"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  submitGlucoseEntry,
  type GlucoseSubmitResult,
} from "../actions";
import { FEEDBACK_ERROR, FEEDBACK_SUCCESS } from "@/lib/ui/page-patterns";
import { formatDatetimeLocalValue } from "@/lib/utils/datetime-local";

const initialState: GlucoseSubmitResult = {
  success: false,
  error: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
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
};

export function GlucoseForm({ formKey }: GlucoseFormProps) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: GlucoseSubmitResult, formData: FormData) =>
      submitGlucoseEntry(formData),
    initialState
  );

  /** Fresh “now” whenever the parent re-renders; the `<form key={formKey}>` remount applies it after save. */
  const defaultMeasuredAt = formatDatetimeLocalValue(new Date());

  const showValidationOrGeneralError = state.error !== null;
  const showSuccess = state.success && !state.error;

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
          disabled={isPending}
          aria-invalid={showValidationOrGeneralError}
          aria-describedby={
            showValidationOrGeneralError ? "glucose-form-error" : undefined
          }
          className="mt-2 w-full max-w-xs rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/40 focus:border-white/30 disabled:opacity-60 aria-invalid:border-red-400/50"
        />
      </div>
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
          className="mt-2 w-full max-w-xs rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-white/30 disabled:opacity-60 aria-invalid:border-red-400/50 [color-scheme:dark]"
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
          className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/40 focus:border-white/30 disabled:opacity-60"
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
