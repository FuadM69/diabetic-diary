import type { FoodProduct } from "@/lib/types/food";
import type { MealEntryWithItems } from "@/lib/types/meal";
import { EmptyState } from "@/components/ui/empty-state";
import { MealCard } from "./meal-card";

type MealListProps = {
  meals: MealEntryWithItems[];
  products: FoodProduct[];
};

export function MealList({ meals, products }: MealListProps) {
  if (meals.length === 0) {
    return (
      <EmptyState
        title="Пока нет приёмов пищи."
        description="Выберите продукты в каталоге, укажите вес порций — углеводы посчитаются сами. Начните с формы выше или откройте каталог продуктов."
        action={{ href: "/food", label: "Открыть продукты" }}
      />
    );
  }

  return (
    <ul className="space-y-3">
      {meals.map((m) => (
        <MealCard key={m.id} meal={m} products={products} />
      ))}
    </ul>
  );
}
