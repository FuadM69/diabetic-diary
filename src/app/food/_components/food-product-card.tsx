import type { FoodProduct } from "@/lib/types/food";
import { EditFoodProductDialog } from "./edit-food-product-dialog";
import {
  getDisplayProductName,
  isDrinkProduct,
} from "@/lib/utils/food-product-kind";

type FoodProductCardProps = {
  product: FoodProduct;
};

/** Only user-created private rows can be updated (not the public catalog). */
function canEditFoodProduct(product: FoodProduct): boolean {
  return !product.is_public && product.created_by != null;
}

export function FoodProductCard({ product }: FoodProductCardProps) {
  const showEdit = canEditFoodProduct(product);
  const drink = isDrinkProduct(product);
  const brandLine = product.brand ? (
    <p className="text-xs text-white/50">{product.brand}</p>
  ) : null;

  const badge = product.is_public ? (
    <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[0.65rem] text-white/55">
      Общий
    </span>
  ) : (
    <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[0.65rem] text-white/55">
      Мой
    </span>
  );

  return (
    <li className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium text-white">
              {getDisplayProductName(product.name)}
            </h3>
            {badge}
            {drink ? (
              <span className="shrink-0 rounded-full bg-sky-400/20 px-2 py-0.5 text-[0.65rem] text-sky-200">
                Напиток
              </span>
            ) : null}
          </div>
          {brandLine}
        </div>
        <div className="shrink-0 text-right">
          <p className="tabular-nums text-xl font-semibold text-white">
            {product.carbs_per_100g}
            <span className="ml-0.5 text-sm font-normal text-white/50">
              г УДВ
            </span>
          </p>
          <p className="text-[0.65rem] text-white/40">на 100 г</p>
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-white/10 pt-3 text-xs text-white/50">
        <div>
          <dt className="text-white/35">Ккал</dt>
          <dd className="tabular-nums text-white/70">
            {product.calories_per_100g}
          </dd>
        </div>
        <div>
          <dt className="text-white/35">Белки</dt>
          <dd className="tabular-nums text-white/70">
            {product.protein_per_100g} г
          </dd>
        </div>
        <div>
          <dt className="text-white/35">Жиры</dt>
          <dd className="tabular-nums text-white/70">{product.fat_per_100g} г</dd>
        </div>
      </dl>
      {showEdit ? (
        <div className="mt-3 border-t border-white/10 pt-3">
          <EditFoodProductDialog product={product} />
        </div>
      ) : null}
    </li>
  );
}
