import type { FoodProduct } from "@/lib/types/food";
import { EmptyState } from "@/components/ui/empty-state";
import { FoodProductCard } from "./food-product-card";

type FoodProductListProps = {
  products: FoodProduct[];
  hasSearch: boolean;
};

export function FoodProductList({ products, hasSearch }: FoodProductListProps) {
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

  return (
    <ul className="space-y-3">
      {products.map((p) => (
        <FoodProductCard key={p.id} product={p} />
      ))}
    </ul>
  );
}
