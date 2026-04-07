"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { FoodProduct } from "@/lib/types/food";
import { MEAL_TYPE_KEYS, MEAL_TYPE_LABEL_RU } from "@/lib/types/meal";
import { createMealEntryAction, type MealActionResult } from "../actions";
import { FEEDBACK_ERROR, FEEDBACK_SUCCESS } from "@/lib/ui/page-patterns";
import { MealItemsEditor } from "./meal-items-editor";

const initial: MealActionResult = { success: false, error: null };

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
      {pending ? "Сохранение…" : "Сохранить приём пищи"}
    </button>
  );
}

type MealFormProps = {
  products: FoodProduct[];
  formKey: string;
  /** From server render to avoid client `new Date()` hydration drift. */
  defaultEatenAt: string;
};

export function MealForm({ products, formKey, defaultEatenAt }: MealFormProps) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: MealActionResult, formData: FormData) =>
      createMealEntryAction(formData),
    initial
  );

  return (
    <form key={formKey} action={formAction} className="space-y-5">
      <label className="block text-sm text-white/70">
        Когда съедено
        <input
          name="eaten_at"
          type="datetime-local"
          required
          defaultValue={defaultEatenAt}
          disabled={isPending}
          className={inputClass}
        />
      </label>

      <label className="block text-sm text-white/70">
        Тип приёма
        <select
          name="meal_type"
          required
          disabled={isPending}
          defaultValue="breakfast"
          className={inputClass}
        >
          {MEAL_TYPE_KEYS.map((key) => (
            <option key={key} value={key}>
              {MEAL_TYPE_LABEL_RU[key]}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm text-white/70">
        Комментарий
        <textarea
          name="note"
          rows={2}
          disabled={isPending}
          placeholder="Необязательно"
          className={`${inputClass} resize-none`}
        />
      </label>

      <MealItemsEditor products={products} disabled={isPending} />

      {state.error ? (
        <p role="alert" className={FEEDBACK_ERROR}>
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className={FEEDBACK_SUCCESS} role="status">
          Приём пищи сохранён.
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
