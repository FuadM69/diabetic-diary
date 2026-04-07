"use client";

import { useId, useState } from "react";
import type { FoodProduct } from "@/lib/types/food";

type Row = { id: string };

function newRowId(): string {
  return `row-${Math.random().toString(36).slice(2, 10)}`;
}

const selectClass =
  "mt-1 w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-white/30 disabled:opacity-60";

const inputClass =
  "mt-1 w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-white/30 disabled:opacity-60";

type MealItemsEditorProps = {
  products: FoodProduct[];
  disabled?: boolean;
};

export function MealItemsEditor({ products, disabled }: MealItemsEditorProps) {
  const baseId = useId();
  const [rows, setRows] = useState<Row[]>(() => [{ id: newRowId() }]);

  const addRow = () => {
    setRows((prev) => [...prev, { id: newRowId() }]);
  };

  const removeRow = (id: string) => {
    setRows((prev) => {
      if (prev.length <= 1) {
        return prev;
      }
      return prev.filter((r) => r.id !== id);
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-white/80">Состав</p>
        <button
          type="button"
          onClick={addRow}
          disabled={disabled}
          className="rounded-xl border border-white/15 px-3 py-1.5 text-xs text-white/80 hover:bg-white/5 disabled:opacity-50"
        >
          + Строка
        </button>
      </div>

      <ul className="space-y-3">
        {rows.map((row, index) => (
          <li
            key={row.id}
            className="rounded-2xl border border-white/10 bg-black/25 p-3"
          >
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1 space-y-2">
                <label className="block text-xs text-white/55">
                  Продукт #{index + 1}
                  <select
                    name="food_product_id"
                    disabled={disabled}
                    defaultValue=""
                    className={selectClass}
                  >
                    <option value="">
                      {products.length === 0
                        ? "Сначала добавьте продукты в каталог"
                        : "Выберите продукт"}
                    </option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                        {p.brand ? ` · ${p.brand}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs text-white/55">
                  Вес, г
                  <input
                    name="grams"
                    type="number"
                    inputMode="decimal"
                    min={0.1}
                    step="0.1"
                    placeholder="например, 150"
                    disabled={disabled}
                    className={inputClass}
                  />
                </label>
              </div>
              {rows.length > 1 ? (
                <button
                  type="button"
                  aria-label="Удалить строку"
                  disabled={disabled}
                  onClick={() => removeRow(row.id)}
                  className="mt-6 rounded-lg px-2 py-1 text-lg leading-none text-white/45 hover:bg-white/10 hover:text-white"
                >
                  ×
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      <p
        className="text-[0.7rem] leading-snug text-white/40"
        id={`${baseId}-hint`}
      >
        Укажите продукт и вес для каждой позиции. Углеводы и калории считаются от
        значений «на 100 г».
      </p>
    </div>
  );
}
