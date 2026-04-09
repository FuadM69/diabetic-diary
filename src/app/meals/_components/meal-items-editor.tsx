"use client";

import { useId, useMemo, useState } from "react";
import type { FoodProduct } from "@/lib/types/food";
import {
  getDisplayProductName,
  isDrinkProduct,
} from "@/lib/utils/food-product-kind";

type Row = { id: string };

function newRowId(): string {
  return `row-${Math.random().toString(36).slice(2, 10)}`;
}

function filterProductsByQuery(
  products: FoodProduct[],
  query: string
): FoodProduct[] {
  const t = query.trim().toLowerCase();
  if (!t) {
    return products;
  }
  return products.filter((p) => {
    if (p.name.toLowerCase().includes(t)) {
      return true;
    }
    if (p.brand && p.brand.toLowerCase().includes(t)) {
      return true;
    }
    return false;
  });
}

/** Keep the row’s current selection visible even if the search filter hides it. */
function optionsForRow(
  filtered: FoodProduct[],
  all: FoodProduct[],
  selectedId: string | undefined
): FoodProduct[] {
  if (!selectedId) {
    return filtered;
  }
  const selected = all.find((p) => p.id === selectedId);
  if (!selected) {
    return filtered;
  }
  if (filtered.some((p) => p.id === selectedId)) {
    return filtered;
  }
  return [selected, ...filtered];
}

const addRowButtonBottomClass =
  "w-full rounded-2xl border border-dashed border-white/25 bg-white/[0.06] px-4 py-3 text-sm font-medium text-white/90 hover:border-white/35 hover:bg-white/[0.1] disabled:opacity-50";

const selectClass =
  "mt-1 w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2.5 text-base text-white outline-none focus:border-white/30 disabled:opacity-60";

const inputClass =
  "mt-1 w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2.5 text-base text-white outline-none focus:border-white/30 disabled:opacity-60";

type ProductScope = "all" | "food" | "drink";

export type MealItemEditorInitialRow = {
  /** Stable React key (e.g. existing `meal_items.id`). */
  key: string;
  foodProductId: string;
  grams: string;
};

type MealItemsEditorProps = {
  products: FoodProduct[];
  disabled?: boolean;
  /** Prefill rows (edit meal). When omitted, one empty row. */
  initialItems?: MealItemEditorInitialRow[];
};

export function MealItemsEditor({
  products,
  disabled,
  initialItems,
}: MealItemsEditorProps) {
  const baseId = useId();
  const [rows, setRows] = useState<Row[]>(() => {
    if (initialItems && initialItems.length > 0) {
      return initialItems.map((it) => ({ id: it.key }));
    }
    return [{ id: newRowId() }];
  });

  const [productQuery, setProductQuery] = useState("");
  const [scope, setScope] = useState<ProductScope>("all");

  const scopedProducts = useMemo(() => {
    if (scope === "all") {
      return products;
    }
    if (scope === "drink") {
      return products.filter((p) => isDrinkProduct(p));
    }
    return products.filter((p) => !isDrinkProduct(p));
  }, [products, scope]);

  const filteredProducts = useMemo(
    () => filterProductsByQuery(scopedProducts, productQuery),
    [scopedProducts, productQuery]
  );

  const showNoResults =
    products.length > 0 &&
    filteredProducts.length === 0 &&
    productQuery.trim() !== "";

  const rowDefaults =
    initialItems && initialItems.length > 0 ?
      new Map(initialItems.map((it) => [it.key, it]))
    : null;

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
      <p className="text-sm font-medium text-white/80">Состав</p>

      <div className="rounded-2xl border border-white/20 bg-white/[0.06] p-3 shadow-sm shadow-black/20">
        <p className="text-sm font-medium text-white/90">
          Поиск продукта по названию или бренду
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setScope("all")}
            className={`rounded-full px-3 py-1 text-xs ${
              scope === "all"
                ? "bg-white text-black"
                : "border border-white/20 text-white/70 hover:bg-white/10"
            }`}
          >
            Все
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setScope("food")}
            className={`rounded-full px-3 py-1 text-xs ${
              scope === "food"
                ? "bg-white text-black"
                : "border border-white/20 text-white/70 hover:bg-white/10"
            }`}
          >
            Еда
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setScope("drink")}
            className={`rounded-full px-3 py-1 text-xs ${
              scope === "drink"
                ? "bg-white text-black"
                : "border border-white/20 text-white/70 hover:bg-white/10"
            }`}
          >
            Напитки
          </button>
        </div>
        <label className="mt-2 block text-xs text-white/55">
          <span className="sr-only">Поиск</span>
          <input
            type="search"
            value={productQuery}
            onChange={(e) => setProductQuery(e.target.value)}
            disabled={disabled}
            autoComplete="off"
            className={inputClass}
            placeholder="Начните вводить…"
            aria-label="Поиск продукта по названию или бренду"
          />
        </label>
        <p className="mt-1.5 text-[0.7rem] leading-snug text-white/45">
          Сужает список в каждой строке «Продукт» ниже. Без запроса показаны все
          позиции выбранного раздела.
        </p>
      </div>

      {showNoResults ? (
        <p className="text-sm text-white/50" role="status">
          Ничего не найдено
        </p>
      ) : null}

      <ul className="space-y-3">
        {rows.map((row, index) => {
          const preset = rowDefaults?.get(row.id);
          const rowOptions = optionsForRow(
            filteredProducts,
            products,
            preset?.foodProductId
          );
          return (
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
                      defaultValue={preset?.foodProductId ?? ""}
                      className={selectClass}
                    >
                      <option value="">
                        {products.length === 0
                          ? "Сначала добавьте продукты в каталог"
                          : "Выберите продукт"}
                      </option>
                      {rowOptions.map((p) => (
                        <option key={p.id} value={p.id}>
                          {getDisplayProductName(p.name)}
                          {isDrinkProduct(p) ? " · Напиток" : ""}
                          {p.brand ? ` · ${p.brand}` : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-xs text-white/55">
                    Вес/объём, г/мл
                    <input
                      name="grams"
                      type="number"
                      inputMode="decimal"
                      min={0.1}
                      step="0.1"
                      placeholder="например, 150"
                      disabled={disabled}
                      defaultValue={preset?.grams ?? ""}
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
          );
        })}
        <li className="list-none pt-3">
          <button
            type="button"
            onClick={addRow}
            disabled={disabled}
            className={`${addRowButtonBottomClass} shadow-md shadow-black/30`}
          >
            + Добавить строку в конец
          </button>
        </li>
      </ul>

      <p
        className="text-[0.7rem] leading-snug text-white/40 pb-1"
        id={`${baseId}-hint`}
      >
        Укажите продукт и вес/объём для каждой позиции. Углеводы и калории считаются
        от значений «на 100 г» (для напитков можно хранить как «на 100 мл»).
      </p>
    </div>
  );
}
