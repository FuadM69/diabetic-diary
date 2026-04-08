"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { FoodProduct } from "@/lib/types/food";
import { MEAL_TYPE_KEYS, MEAL_TYPE_LABEL_RU } from "@/lib/types/meal";
import { createMealEntryAction, type MealActionResult } from "../actions";
import { FEEDBACK_ERROR } from "@/lib/ui/page-patterns";
import { MealItemsEditor } from "./meal-items-editor";

const initial: MealActionResult = {
  success: false,
  error: null,
};

const inputClass =
  "mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/40 focus:border-white/30 disabled:opacity-60";

const bolusLinkClass =
  "inline-flex w-full items-center justify-center rounded-2xl bg-white px-4 py-3 text-center text-sm font-medium text-black transition-opacity hover:opacity-90 sm:w-auto";

const journalLinkClass =
  "inline-flex w-full items-center justify-center rounded-2xl border border-white/20 px-4 py-3 text-center text-sm font-medium text-white/90 transition-colors hover:bg-white/5 sm:w-auto";

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

  const showBolusNext =
    state.success &&
    state.createdMealId &&
    state.createdTotalCarbs != null;

  const bolusHref =
    showBolusNext ?
      `/bolus?${new URLSearchParams({
        carbs: String(state.createdTotalCarbs),
        mealId: state.createdMealId!,
      }).toString()}`
    : null;

  return (
    <form key={formKey} action={formAction} className="space-y-5">
      <p className="text-xs leading-relaxed text-white/45">
        После сохранения можно перейти к оценке болюса с подставленными углеводами.
        Глюкозу и итоговую дозу вы указываете и проверяете сами — запись в журнал
        инсулина не создаётся автоматически.
      </p>

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

      {showBolusNext && bolusHref ? (
        <div
          className="space-y-3 rounded-2xl border border-emerald-500/35 bg-emerald-950/25 p-4"
          role="status"
        >
          <p className="text-sm leading-relaxed text-white/85">
            Приём пищи сохранён. В помощнике болюса уже подставлены углеводы (
            <span className="tabular-nums text-white">
              {state.createdTotalCarbs} г
            </span>
            ). Укажите актуальную глюкозу (или подставьте последнюю) и проверьте
            дозу перед введением — приложение не записывает инсулин за вас.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Link href={bolusHref} className={bolusLinkClass} prefetch={false}>
              Рассчитать болюс
            </Link>
            <a href="#meal-journal" className={journalLinkClass}>
              Вернуться в журнал
            </a>
          </div>
        </div>
      ) : null}

      <SubmitButton />
    </form>
  );
}
