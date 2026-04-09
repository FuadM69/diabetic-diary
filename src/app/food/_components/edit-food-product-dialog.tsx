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
import {
  updateFoodProductAction,
  type FoodActionResult,
} from "../actions";
import { FEEDBACK_ERROR, FEEDBACK_SUCCESS } from "@/lib/ui/page-patterns";
import {
  getDisplayProductName,
  isDrinkProduct,
} from "@/lib/utils/food-product-kind";

const initialState: FoodActionResult = {
  success: false,
  error: null,
};

const inputClass =
  "mt-2 w-full rounded-2xl border border-white/15 bg-black/50 px-4 py-3 text-base text-white outline-none placeholder:text-white/40 focus:border-white/35 disabled:opacity-60";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Сохранение…" : "Сохранить"}
    </button>
  );
}

function EditFormBody({
  product,
  onSuccess,
  onCancel,
}: {
  product: FoodProduct;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const drink = isDrinkProduct(product);
  const [state, formAction, isPending] = useActionState(
    async (_prev: FoodActionResult, formData: FormData) =>
      updateFoodProductAction(formData),
    initialState
  );

  useEffect(() => {
    if (state.success) {
      onSuccess();
    }
  }, [state.success, onSuccess]);

  return (
    <form
      action={formAction}
      className="max-h-[70vh] space-y-3 overflow-y-auto pr-1"
    >
      <input type="hidden" name="productId" value={product.id} />

      <label className="block text-sm text-white/70">
        Название *
        <input
          name="name"
          type="text"
          required
          disabled={isPending}
          defaultValue={getDisplayProductName(product.name)}
          className={inputClass}
        />
      </label>

      <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/75">
        <input
          type="checkbox"
          name="is_drink"
          value="1"
          defaultChecked={drink}
          disabled={isPending}
          className="size-4 accent-white"
        />
        Это напиток (показывать в разделе напитков)
      </label>

      <label className="block text-sm text-white/70">
        Бренд
        <input
          name="brand"
          type="text"
          disabled={isPending}
          defaultValue={product.brand ?? ""}
          placeholder="Необязательно"
          className={inputClass}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm text-white/70">
          Углеводы ({drink ? "г/100 мл" : "г"}) *
          <input
            name="carbs_per_100g"
            type="number"
            inputMode="decimal"
            step="0.1"
            min={0}
            required
            disabled={isPending}
            defaultValue={product.carbs_per_100g}
            className={inputClass}
          />
        </label>
        <label className="block text-sm text-white/70">
          Ккал {drink ? "/100 мл" : ""} *
          <input
            name="calories_per_100g"
            type="number"
            inputMode="decimal"
            step="0.1"
            min={0}
            required
            disabled={isPending}
            defaultValue={product.calories_per_100g}
            className={inputClass}
          />
        </label>
        <label className="block text-sm text-white/70">
          Белки ({drink ? "г/100 мл" : "г"}) *
          <input
            name="protein_per_100g"
            type="number"
            inputMode="decimal"
            step="0.1"
            min={0}
            required
            disabled={isPending}
            defaultValue={product.protein_per_100g}
            className={inputClass}
          />
        </label>
        <label className="block text-sm text-white/70">
          Жиры ({drink ? "г/100 мл" : "г"}) *
          <input
            name="fat_per_100g"
            type="number"
            inputMode="decimal"
            step="0.1"
            min={0}
            required
            disabled={isPending}
            defaultValue={product.fat_per_100g}
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
        <p role="status" className={FEEDBACK_SUCCESS}>
          Изменения сохранены.
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

type EditFoodProductDialogProps = {
  product: FoodProduct;
};

export function EditFoodProductDialog({ product }: EditFoodProductDialogProps) {
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
        className="fixed left-[50%] top-[50%] z-[100] w-[calc(100%-2rem)] max-w-sm translate-x-[-50%] translate-y-[-50%] rounded-3xl border border-white/15 bg-neutral-950 p-5 text-white shadow-2xl open:backdrop:bg-black/65"
      >
        <div className="mb-4 flex items-start justify-between gap-2">
          <h3 className="text-base font-medium text-white">Изменить продукт</h3>
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
          key={session}
          product={product}
          onSuccess={close}
          onCancel={close}
        />
      </dialog>
    </>
  );
}
