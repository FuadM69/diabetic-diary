"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  createFoodProductAction,
  type FoodActionResult,
} from "../actions";
import { FEEDBACK_ERROR, FEEDBACK_SUCCESS } from "@/lib/ui/page-patterns";

const initial: FoodActionResult = { success: false, error: null };

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
      {pending ? "Сохранение…" : "Добавить продукт"}
    </button>
  );
}

type FoodProductFormProps = {
  formKey: string;
};

export function FoodProductForm({ formKey }: FoodProductFormProps) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: FoodActionResult, formData: FormData) =>
      createFoodProductAction(formData),
    initial
  );

  return (
    <form key={formKey} action={formAction} className="space-y-4">
      <h3 className="text-sm font-medium text-white/85">Новый продукт</h3>
      <p className="text-xs text-white/45">
        Продукт будет виден только вам. Значения — на 100 г.
      </p>

      <label className="block text-sm text-white/70">
        Название *
        <input
          name="name"
          type="text"
          required
          disabled={isPending}
          placeholder="Например, Гречка отварная"
          className={inputClass}
        />
      </label>

      <label className="block text-sm text-white/70">
        Бренд
        <input
          name="brand"
          type="text"
          disabled={isPending}
          placeholder="Необязательно"
          className={inputClass}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm text-white/70">
          Углеводы (г) *
          <input
            name="carbs_per_100g"
            type="number"
            inputMode="decimal"
            step="0.1"
            min={0}
            required
            disabled={isPending}
            className={inputClass}
          />
        </label>
        <label className="block text-sm text-white/70">
          Ккал *
          <input
            name="calories_per_100g"
            type="number"
            inputMode="decimal"
            step="1"
            min={0}
            required
            disabled={isPending}
            className={inputClass}
          />
        </label>
        <label className="block text-sm text-white/70">
          Белки (г) *
          <input
            name="protein_per_100g"
            type="number"
            inputMode="decimal"
            step="0.1"
            min={0}
            required
            disabled={isPending}
            className={inputClass}
          />
        </label>
        <label className="block text-sm text-white/70">
          Жиры (г) *
          <input
            name="fat_per_100g"
            type="number"
            inputMode="decimal"
            step="0.1"
            min={0}
            required
            disabled={isPending}
            className={inputClass}
          />
        </label>
      </div>

      {state.error ? (
        <p role="alert" className={FEEDBACK_ERROR}>
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className={FEEDBACK_SUCCESS} role="status">
          Продукт добавлен.
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
