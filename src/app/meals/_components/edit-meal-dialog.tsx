"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useFormStatus } from "react-dom";
import type { FoodProduct } from "@/lib/types/food";
import type { MealEntryWithItems } from "@/lib/types/meal";
import { MEAL_TYPE_KEYS, MEAL_TYPE_LABEL_RU } from "@/lib/types/meal";
import { editMealEntryAction, type MealActionResult } from "../actions";
import { FEEDBACK_ERROR } from "@/lib/ui/page-patterns";
import { formatDatetimeLocalFromIso } from "@/lib/utils/datetime-local";
import {
  MealItemsEditor,
  type MealItemEditorInitialRow,
} from "./meal-items-editor";

const initialState: MealActionResult = {
  success: false,
  error: null,
};

const inputClass =
  "mt-2 w-full rounded-2xl border border-white/15 bg-black/50 px-4 py-3 text-white outline-none focus:border-white/35 disabled:opacity-60";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black disabled:opacity-60"
    >
      {pending ? "Сохранение…" : "Сохранить"}
    </button>
  );
}

function toInitialRows(meal: MealEntryWithItems): MealItemEditorInitialRow[] {
  return meal.meal_items.map((it) => ({
    key: it.id,
    foodProductId: it.food_product_id,
    grams: String(it.grams),
  }));
}

function EditFormBody({
  meal,
  products,
  onSuccess,
  onCancel,
}: {
  meal: MealEntryWithItems;
  products: FoodProduct[];
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: MealActionResult, formData: FormData) =>
      editMealEntryAction(formData),
    initialState
  );

  useEffect(() => {
    if (state.success) {
      onSuccess();
    }
  }, [state.success, onSuccess]);

  const initialRows = toInitialRows(meal);

  return (
    <form
      action={formAction}
      className="max-h-[min(75vh,calc(100dvh-6rem))] space-y-4 overflow-y-auto overflow-x-hidden pr-0.5"
    >
      <input type="hidden" name="mealEntryId" value={meal.id} />

      <label className="block text-sm text-white/70">
        Когда съедено
        <input
          name="eaten_at"
          type="datetime-local"
          required
          defaultValue={formatDatetimeLocalFromIso(meal.eaten_at)}
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
          defaultValue={meal.meal_type}
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
          defaultValue={meal.note ?? ""}
          className={`${inputClass} resize-none`}
        />
      </label>

      <MealItemsEditor
        products={products}
        disabled={isPending}
        initialItems={initialRows}
      />

      {state.error ? (
        <p role="alert" className={FEEDBACK_ERROR}>
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="rounded-xl border border-white/20 px-4 py-2.5 text-sm text-white/85 hover:bg-white/5 disabled:opacity-60"
        >
          Отмена
        </button>
        <SaveButton />
      </div>
    </form>
  );
}

type EditMealDialogProps = {
  meal: MealEntryWithItems;
  products: FoodProduct[];
};

export function EditMealDialog({ meal, products }: EditMealDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [session, setSession] = useState(0);

  const open = () => {
    setSession((s) => s + 1);
    dialogRef.current?.showModal();
  };

  const close = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="text-xs text-white/45 underline decoration-white/20 underline-offset-2 hover:text-white/75"
      >
        Изменить
      </button>
      <dialog
        ref={dialogRef}
        className="fixed left-[50%] top-[50%] z-[100] w-[calc(100%-2rem)] max-w-md translate-x-[-50%] translate-y-[-50%] rounded-3xl border border-white/15 bg-neutral-950 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] text-white shadow-2xl open:backdrop:bg-black/65"
      >
        <div className="mb-4 flex items-start justify-between gap-2">
          <h3 className="text-base font-medium text-white">
            Изменить приём пищи
          </h3>
          <button
            type="button"
            onClick={close}
            className="rounded-lg px-2 py-1 text-lg leading-none text-white/50 hover:bg-white/10 hover:text-white"
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>
        <EditFormBody
          key={`${session}-${meal.id}-${meal.eaten_at}-${meal.meal_items.length}`}
          meal={meal}
          products={products}
          onSuccess={close}
          onCancel={close}
        />
      </dialog>
    </>
  );
}
