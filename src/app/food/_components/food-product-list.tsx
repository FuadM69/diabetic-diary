"use client";

import { useMemo, useState } from "react";
import type { FoodProduct } from "@/lib/types/food";
import { EmptyState } from "@/components/ui/empty-state";
import { FoodProductCard } from "./food-product-card";
import { isDrinkProduct } from "@/lib/utils/food-product-kind";

type FoodProductListProps = {
  products: FoodProduct[];
  hasSearch: boolean;
};

type ProductScope = "all" | "food" | "drink";

export function FoodProductList({ products, hasSearch }: FoodProductListProps) {
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

  if (products.length === 0) {
    if (hasSearch) {
      return (
        <EmptyState
          title="Ничего не найдено."
          description="Попробуйте другой запрос или добавьте продукт вручную в форме ниже."
        />
      );
    }
    return (
      <EmptyState
        title="Каталог пока пуст."
        description="Обычно здесь есть общие продукты (миграция в Supabase). Пока список пуст — добавьте свой продукт формой выше."
        variant="muted"
      />
    );
  }

  const scopeLabel =
    scope === "all" ? "все" : scope === "food" ? "еда" : "напитки";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
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

      {scopedProducts.length === 0 ? (
        <EmptyState
          title="В этом разделе пока пусто."
          description={`По текущему поиску нет результатов в категории «${scopeLabel}».`}
          variant="muted"
        />
      ) : (
        <ul className="space-y-3">
          {scopedProducts.map((p) => (
            <FoodProductCard key={p.id} product={p} />
          ))}
        </ul>
      )}
    </div>
  );
}
