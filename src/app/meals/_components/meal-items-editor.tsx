"use client";

import { useEffect, useId, useMemo, useState } from "react";
import type { FoodProduct } from "@/lib/types/food";
import {
  getDisplayProductName,
  isDrinkProduct,
} from "@/lib/utils/food-product-kind";

type Row = { id: string };

type RowFieldValues = { productId: string; grams: string; query: string };

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
  "mt-1 box-border w-full min-w-0 max-w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2.5 text-base text-white outline-none focus:border-white/30 disabled:opacity-60";

const dropdownClass =
  "absolute inset-x-0 top-full z-20 mt-1 max-h-52 min-w-0 w-full max-w-full overflow-y-auto overscroll-y-contain rounded-xl border border-white/12 bg-black/90 py-1 shadow-lg shadow-black/50";

/** Cap autocomplete items for mobile performance. */
const AUTOCOMPLETE_MAX_ITEMS = 24;

export type MealItemEditorInitialRow = {
  /** Stable React key (e.g. existing `meal_items.id`). */
  key: string;
  foodProductId: string;
  grams: string;
};

function buildInitialRowValues(
  initialItems: MealItemEditorInitialRow[] | undefined,
  products: FoodProduct[]
): Record<string, RowFieldValues> {
  if (!initialItems?.length) {
    return {};
  }
  const m: Record<string, RowFieldValues> = {};
  const byId = new Map(products.map((p) => [p.id, p]));
  for (const it of initialItems) {
    const p = byId.get(it.foodProductId);
    const query =
      p ?
        `${getDisplayProductName(p.name)}${p.brand ? ` · ${p.brand}` : ""}`
      : "";
    m[it.key] = { productId: it.foodProductId, grams: it.grams, query };
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
  const [openDropdownRowId, setOpenDropdownRowId] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>(() => {
    if (initialItems && initialItems.length > 0) {
      return initialItems.map((it) => ({ id: it.key }));
    }
    return [{ id: newRowId() }];
  });

  const [rowFields, setRowFields] = useState<Record<string, RowFieldValues>>(
    () => buildInitialRowValues(initialItems, products)
  );

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
    setOpenDropdownRowId(id);
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
    const query = `${getDisplayProductName(p.name)}${p.brand ? ` · ${p.brand}` : ""}`;
    setRowFields((prev) => ({
      ...prev,
      [rowId]: {
        productId: p.id,
        grams: prev[rowId]?.grams ?? "",
        query,
      },
    }));
    setOpenDropdownRowId(null);
  };

  return (
    <div className="min-w-0 max-w-full space-y-3">
      <p className="text-sm font-medium text-white/80">Состав</p>

      <ul className="min-w-0 space-y-3">
        {rows.map((row, index) => {
          const fields = rowFields[row.id] ?? {
            productId: "",
            grams: "",
            query: "",
          };
          const selectedId =
            fields.productId.trim() !== "" ? fields.productId : undefined;
          const rowQueryTrimmed = fields.query.trim();
          const filteredProducts = filterProductsByQuery(products, rowQueryTrimmed);
          const autocompleteCandidates =
            rowQueryTrimmed === "" ? [] : filteredProducts.slice(0, AUTOCOMPLETE_MAX_ITEMS);
          const showNoResults =
            rowQueryTrimmed !== "" &&
            products.length > 0 &&
            autocompleteCandidates.length === 0;
          const rowOptions = optionsForRow(
            filteredProducts,
            products,
            selectedId
          );
          const isActiveRow = activeRowId === row.id;
          return (
            <li
              key={row.id}
              className={`min-w-0 max-w-full rounded-2xl border bg-black/25 p-3 ${
                isActiveRow
                  ? "border-emerald-400/35 ring-1 ring-emerald-400/25 ring-inset"
                  : "border-white/10"
              }`}
            >
              <div className="flex min-w-0 w-full items-start gap-2">
                <div className="min-w-0 max-w-full flex-1 space-y-2 overflow-x-hidden">
                  <label className="block min-w-0 text-xs text-white/55">
                    Продукт #{index + 1}
                    <div className="relative min-w-0 max-w-full">
                      <input
                        type="search"
                        disabled={disabled}
                        value={fields.query}
                        autoComplete="off"
                        onFocus={() => {
                          setActiveRowId(row.id);
                          setOpenDropdownRowId(row.id);
                        }}
                        onBlur={() => {
                          // Keep open briefly so tap on result is captured.
                          window.setTimeout(() => {
                            setOpenDropdownRowId((prev) =>
                              prev === row.id ? null : prev
                            );
                          }, 120);
                        }}
                        onChange={(e) => {
                          const q = e.target.value;
                          setActiveRowId(row.id);
                          setOpenDropdownRowId(row.id);
                          setRowFields((prev) => ({
                            ...prev,
                            [row.id]: {
                              productId: "",
                              grams: prev[row.id]?.grams ?? "",
                              query: q,
                            },
                          }));
                        }}
                        className={inputClass}
                        placeholder={
                          products.length === 0
                            ? "Сначала добавьте продукты в каталог"
                            : "Начните ввод: название или бренд"
                        }
                        aria-label={`Поиск продукта в строке ${index + 1}`}
                        aria-controls={`${baseId}-row-${row.id}-results`}
                        aria-expanded={
                          openDropdownRowId === row.id &&
                          autocompleteCandidates.length > 0
                        }
                      />
                      <input type="hidden" name="food_product_id" value={fields.productId} />
                      {openDropdownRowId === row.id && autocompleteCandidates.length > 0 ? (
                        <ul
                          id={`${baseId}-row-${row.id}-results`}
                          role="listbox"
                          className={dropdownClass}
                        >
                          {autocompleteCandidates.map((p) => (
                            <li key={p.id} role="none">
                              <button
                                type="button"
                                role="option"
                                disabled={disabled}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  setActiveRowId(row.id);
                                  pickProductForActiveRow(p);
                                }}
                                className="flex w-full min-w-0 items-start gap-2 border-b border-white/[0.06] px-3 py-2.5 text-left text-sm text-white/90 last:border-b-0 hover:bg-white/[0.08] disabled:opacity-50 active:bg-white/[0.1]"
                              >
                                <span className="min-w-0 flex-1 break-words leading-snug">
                                  <span className="font-medium text-white">
                                    {getDisplayProductName(p.name)}
                                  </span>
                                  {isDrinkProduct(p) ? (
                                    <span className="text-white/45"> · Напиток</span>
                                  ) : null}
                                  {p.brand ? (
                                    <span className="block text-[0.72rem] text-white/50">
                                      {p.brand}
                                    </span>
                                  ) : null}
                                </span>
                              </button>
                            </li>
                          ))}
                          {filteredProducts.length > AUTOCOMPLETE_MAX_ITEMS ? (
                            <li className="px-3 py-2 text-[0.65rem] text-white/40">
                              Показаны первые {AUTOCOMPLETE_MAX_ITEMS} совпадений.
                            </li>
                          ) : null}
                        </ul>
                      ) : null}
                      {showNoResults ? (
                        <p className="mt-1 text-[0.7rem] text-white/45" role="status">
                          Ничего не найдено
                        </p>
                      ) : null}
                    </div>
                    <select
                      name="_food_product_id_fallback"
                      disabled={disabled}
                      value={fields.productId}
                      onChange={(e) => {
                        const v = e.target.value;
                        const selected = products.find((p) => p.id === v);
                        const query =
                          selected ?
                            `${getDisplayProductName(selected.name)}${selected.brand ? ` · ${selected.brand}` : ""}`
                          : "";
                        setRowFields((prev) => ({
                          ...prev,
                          [row.id]: {
                            productId: v,
                            grams: prev[row.id]?.grams ?? "",
                            query,
                          },
                        }));
                      }}
                      className="sr-only"
                      tabIndex={-1}
                      aria-hidden="true"
                    >
                      <option value="">Выберите продукт</option>
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
                            query: prev[row.id]?.query ?? "",
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
        В поле продукта начните ввод названия или бренда и выберите вариант в
        выпадающем списке под строкой. Затем укажите вес/объём.
      </p>
    </div>
  );
}
