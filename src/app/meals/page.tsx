import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUser } from "@/lib/auth/getUser";
import { getInsulinEntries } from "@/lib/db/insulin";
import { getMealEntries, getSelectableFoodProducts } from "@/lib/db/meals";
import { getUserSettings } from "@/lib/db/settings";
import { extractLinkedMealIdFromInsulinNote } from "@/lib/utils/bolus-prefill";
import { defaultDatetimeLocalForUserSettings } from "@/lib/utils/datetime-local-tz";
import { MealForm } from "./_components/meal-form";
import { MealList } from "./_components/meal-list";
import { SECTION_TITLE, SURFACE_CARD } from "@/lib/ui/page-patterns";

export default async function MealsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const [meals, products, settings, insulinEntries] = await Promise.all([
    getMealEntries(user.id),
    getSelectableFoodProducts(user.id),
    getUserSettings(user.id),
    getInsulinEntries(user.id, { entryTypes: ["bolus"] }),
  ]);

  const linkedBolusByMealId = new Map<string, number>();
  for (const e of insulinEntries) {
    if (e.entry_type !== "bolus") {
      continue;
    }
    const mealId = extractLinkedMealIdFromInsulinNote(e.note);
    if (!mealId || linkedBolusByMealId.has(mealId)) {
      continue;
    }
    linkedBolusByMealId.set(mealId, e.units);
  }

  /** Stable across new rows in the journal so the create form keeps success UI after save. */
  const createFormKey = `meal-create|${products.length}`;
  const eatenAtDefault = defaultDatetimeLocalForUserSettings(settings.timezone);

  return (
    <AppShell title="Еда">
      <div className="mx-auto w-full max-w-lg space-y-3 pb-4 sm:space-y-5">
        <p className="text-xs leading-snug text-white/60 sm:text-sm sm:leading-relaxed">
          Приём из <span className="text-white/75">вашего списка</span> продуктов:
          УВ и ккал по граммам порции. Добавляйте и правьте позиции в разделе
          «Продукты».
        </p>

        <section
          id="add-meal"
          className={`${SURFACE_CARD} space-y-4 scroll-mt-24`}
          aria-label="Новый приём пищи"
        >
          <h2 className="text-sm font-medium text-white/85">Новый приём пищи</h2>
          <MealForm
            products={products}
            formKey={createFormKey}
            defaultEatenAt={eatenAtDefault.ok ? eatenAtDefault.value : ""}
            timezoneConfigError={
              eatenAtDefault.ok ? null : eatenAtDefault.message
            }
            savedUserTimezone={settings.timezone}
          />
        </section>

        <section id="meal-journal" className="scroll-mt-24 space-y-3">
          <h2 className={SECTION_TITLE}>Журнал</h2>
          <MealList
            meals={meals}
            products={products}
            userTimezone={settings.timezone}
            linkedBolusByMealId={linkedBolusByMealId}
          />
        </section>
      </div>
    </AppShell>
  );
}
