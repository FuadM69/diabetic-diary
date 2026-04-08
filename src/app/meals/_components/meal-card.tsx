import Link from "next/link";
import type { FoodProduct } from "@/lib/types/food";
import type { MealEntryWithItems } from "@/lib/types/meal";
import { MEAL_TYPE_LABEL_RU } from "@/lib/types/meal";
import {
  sumCaloriesFromItems,
  sumCarbsFromItems,
} from "@/lib/utils/meal-nutrition";
import { DeleteMealButton } from "./delete-meal-button";
import { EditMealDialog } from "./edit-meal-dialog";

function formatEatenAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

type MealCardProps = {
  meal: MealEntryWithItems;
  products: FoodProduct[];
};

export function MealCard({ meal, products }: MealCardProps) {
  const typeLabel =
    meal.meal_type in MEAL_TYPE_LABEL_RU
      ? MEAL_TYPE_LABEL_RU[meal.meal_type as keyof typeof MEAL_TYPE_LABEL_RU]
      : meal.meal_type;

  const carbs = sumCarbsFromItems(meal.meal_items);
  const kcal = sumCaloriesFromItems(meal.meal_items);

  const bolusHref = `/bolus?${new URLSearchParams({
    carbs: String(carbs),
    mealId: meal.id,
  }).toString()}`;

  return (
    <li className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-white/45">
            {typeLabel}
          </p>
          <p className="mt-1 text-sm text-white/70">{formatEatenAt(meal.eaten_at)}</p>
        </div>
        <div className="text-right">
          <p className="tabular-nums text-lg font-semibold text-white">
            {carbs}
            <span className="ml-1 text-xs font-normal text-white/45">г УДВ</span>
          </p>
          <p className="tabular-nums text-sm text-white/55">{kcal} ккал</p>
        </div>
      </div>

      {meal.note ? (
        <p className="mt-3 border-t border-white/10 pt-3 text-sm text-white/55">
          {meal.note}
        </p>
      ) : null}

      <ul className="mt-3 space-y-2 border-t border-white/10 pt-3">
        {meal.meal_items.map((it) => (
          <li
            key={it.id}
            className="flex flex-wrap items-baseline justify-between gap-2 text-sm"
          >
            <span className="text-white/80">
              {it.productName}
              {it.productBrand ? (
                <span className="text-white/45"> · {it.productBrand}</span>
              ) : null}
              <span className="text-white/45"> — {it.grams} г</span>
            </span>
            <span className="tabular-nums text-xs text-white/50">
              {it.carbs_total} г · {it.calories_total} ккал
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-3 space-y-3 border-t border-white/10 pt-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <EditMealDialog meal={meal} products={products} />
          <DeleteMealButton mealEntryId={meal.id} />
        </div>
        <div>
          <Link
            href={bolusHref}
            className="inline-flex w-full items-center justify-center rounded-2xl border border-white/18 bg-white/[0.07] px-3 py-2.5 text-center text-sm font-medium text-white/90 transition-colors hover:border-white/28 hover:bg-white/[0.1] sm:w-auto sm:justify-center"
            prefetch={false}
          >
            Рассчитать болюс
          </Link>
          <p className="mt-2 text-[0.65rem] leading-snug text-white/38">
            Откроется помощник с подставленными углеводами; глюкозу и дозу вы
            проверяете сами.
          </p>
        </div>
      </div>
    </li>
  );
}
