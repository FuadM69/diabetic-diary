"use client";

import { useEffect, useId, useMemo, useState } from "react";
import type { FoodProduct } from "@/lib/types/food";
import {
  getDisplayProductName,
  isDrinkProduct,
} from "@/lib/utils/food-product-kind";

type Row = { id: string };

type RowFieldValues = { productId: string; grams: string };

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
    if (getDisplayProductName(p.name).toLowerCase().includes(t)) {
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

/** Cap autocomplete height and items for mobile performance. */
const AUTOCOMPLETE_MAX_ITEMS = 24;

type ProductScope = "all" | "food" | "drink";

export type MealItemEditorInitialRow = {
  /** Stable React key (e.g. existing `meal_items.id`). */
  key: string;
  foodProductId: string;
  grams: string;
};

function buildInitialRowValues(
  initialItems: MealItemEditorInitialRow[] | undefined
): Record<string, RowFieldValues> {
  if (!initialItems?.length) {
    return {};
  }
  const m: Record<string, RowFieldValues> = {};
  for (const it of initialItems) {
    m[it.key] = { productId: it.foodProductId, grams: it.grams };
  }
  return m;
}

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
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>(() => {
    if (initialItems && initialItems.length > 0) {
      return initialItems.map((it) => ({ id: it.key }));
    }
    return [{ id: newRowId() }];
  });

  const [rowFields, setRowFields] = useState<Record<string, RowFieldValues>>(
    () => buildInitialRowValues(initialItems)
  );

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

  const searchTrimmed = productQuery.trim();
  const showNoResults =
    products.length > 0 && filteredProducts.length === 0 && searchTrimmed !== "";

  const autocompleteCandidates = useMemo(() => {
    if (searchTrimmed === "") {
      return [];
    }
    return filteredProducts.slice(0, AUTOCOMPLETE_MAX_ITEMS);
  }, [filteredProducts, searchTrimmed]);

  const activeRowNumber = useMemo(() => {
    if (!activeRowId) {
      return 1;
    }
    const i = rows.findIndex((r) => r.id === activeRowId);
    return i >= 0 ? i + 1 : 1;
  }, [rows, activeRowId]);

  useEffect(() => {
    if (rows.length === 0) {
      setActiveRowId(null);
      return;
    }
    if (activeRowId == null || !rows.some((r) => r.id === activeRowId)) {
      setActiveRowId(rows[0]!.id);
    }
  }, [rows, activeRowId]);

  const addRow = () => {
    const id = newRowId();
    setRows((prev) => [...prev, { id }]);
    setActiveRowId(id);
  };

  const removeRow = (id: string) => {
    if (rows.length <= 1) {
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
    setRowFields((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const pickProductForActiveRow = (p: FoodProduct) => {
    const rowId = activeRowId ?? rows[0]?.id ?? null;
    if (!rowId) {
      return;
    }
    setRowFields((prev) => ({
      ...prev,
      [rowId]: {
        productId: p.id,
        grams: prev[rowId]?.grams ?? "",
      },
    }));
    setProductQuery("");
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-white/80">Состав</p>

      <div className="rounded-2xl border border-white/20 bg-white/[0.06] p-3 shadow-sm shadow-black/20">
        <p className="text-xs font-medium text-white/80">Поиск продукта</p>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.7rem] leading-snug text-white/55">
          <span className="inline-flex shrink-0 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-2 py-0.5 font-medium tabular-nums text-emerald-100/95">
            Строка {activeRowNumber}
          </span>
          <span>
            Выбор из списка ниже подставит продукт сюда. Другая строка — нажмите
            на неё или на поле веса.
          </span>
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
            placeholder="Название или бренд…"
            aria-label="Поиск продукта по названию или бренду"
            aria-controls={`${baseId}-autocomplete`}
            aria-expanded={autocompleteCandidates.length > 0}
          />
        </label>
        {autocompleteCandidates.length > 0 ? (
          <ul
            id={`${baseId}-autocomplete`}
            role="listbox"
            aria-label="Совпадения поиска"
            className="mt-2 max-h-52 overflow-y-auto overscroll-y-contain rounded-xl border border-white/12 bg-black/35 py-1"
          >
            {autocompleteCandidates.map((p) => (
              <li key={p.id} role="none">
                <button
                  type="button"
                  role="option"
                  disabled={disabled}
                  onClick={() => pickProductForActiveRow(p)}
                  className="flex w-full min-w-0 items-start gap-2 border-b border-white/[0.06] px-3 py-2.5 text-left text-sm text-white/90 last:border-b-0 hover:bg-white/[0.08] disabled:opacity-50 active:bg-white/[0.1]"
                >
                  <span className="min-w-0 flex-1 leading-snug">
                    <span className="font-medium text-white">
                      {getDisplayProductName(p.name)}
                    </span>
                    {isDrinkProduct(p) ? (
                      <span className="text-white/45"> · Напиток</span>
                    ) : null}
                    {p.brand ?
                      <span className="block text-[0.72rem] text-white/50">
                        {p.brand}
                      </span>
                    : null}
                  </span>
                </button>
              </li>
            ))}
            {filteredProducts.length > AUTOCOMPLETE_MAX_ITEMS ? (
              <li className="px-3 py-2 text-[0.65rem] text-white/40">
                Показаны первые {AUTOCOMPLETE_MAX_ITEMS} совпадений — уточните
                запрос или выберите в списке в строке.
              </li>
            ) : null}
          </ul>
        ) : null}
        {showNoResults ? (
          <p className="mt-2 text-sm text-white/50" role="status">
            Ничего не найдено
          </p>
        ) : null}
        {searchTrimmed === "" && products.length > 0 ? (
          <p className="mt-1.5 text-[0.7rem] text-white/40">
            Начните ввод — список для выбора появится здесь.
          </p>
        ) : null}
      </div>

      <ul className="space-y-3">
        {rows.map((row, index) => {
          const fields = rowFields[row.id] ?? {
            productId: "",
            grams: "",
          };
          const selectedId =
            fields.productId.trim() !== "" ? fields.productId : undefined;
          const rowOptions = optionsForRow(
            filteredProducts,
            products,
            selectedId
          );
          const isActiveRow = activeRowId === row.id;
          return (
            <li
              key={row.id}
              className={`rounded-2xl border bg-black/25 p-3 ${
                isActiveRow
                  ? "border-emerald-400/35 ring-1 ring-emerald-400/25"
                  : "border-white/10"
              }`}
            >
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1 space-y-2">
                  <label className="block text-xs text-white/55">
                    Продукт #{index + 1}
                    <select
                      name="food_product_id"
                      disabled={disabled}
                      value={fields.productId}
                      onFocus={() => setActiveRowId(row.id)}
                      onChange={(e) => {
                        const v = e.target.value;
                        setRowFields((prev) => ({
                          ...prev,
                          [row.id]: {
                            productId: v,
                            grams: prev[row.id]?.grams ?? "",
                          },
                        }));
                      }}
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
                      value={fields.grams}
                      onFocus={() => setActiveRowId(row.id)}
                      onChange={(e) => {
                        const v = e.target.value;
                        setRowFields((prev) => ({
                          ...prev,
                          [row.id]: {
                            productId: prev[row.id]?.productId ?? "",
                            grams: v,
                          },
                        }));
                      }}
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
