import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUser } from "@/lib/auth/getUser";
import { getFoodProducts } from "@/lib/db/food";
import { parseFoodSearchParam } from "@/lib/utils/food-search";
import { FoodProductForm } from "./_components/food-product-form";
import { FoodProductList } from "./_components/food-product-list";
import { FoodSearchBar } from "./_components/food-search-bar";
import {
  INTRO_TEXT,
  PAGE_CONTAINER,
  SECTION_TITLE,
  SURFACE_CARD,
} from "@/lib/ui/page-patterns";

type FoodPageProps = {
  searchParams?: Promise<{ q?: string | string[] }>;
};

export default async function FoodPage({ searchParams }: FoodPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const params = searchParams ? await searchParams : {};
  const q = parseFoodSearchParam(params.q);
  const hasSearch = q.length > 0;

  const products = await getFoodProducts(user.id, {
    search: hasSearch ? q : null,
  });

  const formKey = `${products.length}|${q}`;

  return (
    <AppShell title="Продукты">
      <div className={PAGE_CONTAINER}>
        <header>
          <p className={INTRO_TEXT}>
            Продукты нужны, чтобы собирать приёмы пищи: ищите в общем каталоге
            или добавьте свои. Стартовый набор уже доступен для быстрого ввода;
            свои позиции по умолчанию видны только вам.
          </p>
        </header>

        <FoodSearchBar query={q} />

        <section className={SURFACE_CARD}>
          <FoodProductForm formKey={formKey} />
        </section>

        <section className="space-y-3">
          <h2 className={SECTION_TITLE}>
            Каталог
            {hasSearch ? (
              <span className="ml-2 font-normal text-white/45">
                · поиск: «{q}»
              </span>
            ) : null}
          </h2>
          <FoodProductList products={products} hasSearch={hasSearch} />
        </section>
      </div>
    </AppShell>
  );
}
