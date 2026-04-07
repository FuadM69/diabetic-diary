import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUser } from "@/lib/auth/getUser";
import { getLatestGlucoseEntry } from "@/lib/db/glucose";
import { getRecentMealEntries } from "@/lib/db/meals";
import { getUserSettings } from "@/lib/db/settings";
import type { BolusRecentMealOption } from "@/lib/types/bolus";
import type { MealEntryWithItems, MealTypeKey } from "@/lib/types/meal";
import { MEAL_TYPE_LABEL_RU } from "@/lib/types/meal";
import {
  hasBolusUrlPrefill,
  parseBolusUrlPrefill,
} from "@/lib/utils/bolus-prefill";
import { bolusSettingsReady } from "@/lib/utils/bolus-form";
import { sumCarbsFromItems } from "@/lib/utils/meal-nutrition";
import { BolusForm } from "./_components/bolus-form";
import { CALLOUT_SUBTLE, INTRO_TEXT, PAGE_CONTAINER } from "@/lib/ui/page-patterns";

type BolusPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function toRecentMealOptions(
  meals: MealEntryWithItems[]
): BolusRecentMealOption[] {
  return meals.map((m) => {
    const totalCarbs = sumCarbsFromItems(m.meal_items);
    const mealTypeLabel =
      m.meal_type in MEAL_TYPE_LABEL_RU
        ? MEAL_TYPE_LABEL_RU[m.meal_type as MealTypeKey]
        : m.meal_type;
    return {
      id: m.id,
      eatenAt: m.eaten_at,
      mealType: m.meal_type,
      mealTypeLabel,
      totalCarbs,
    };
  });
}

export default async function BolusPage({ searchParams }: BolusPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const sp = searchParams ? await searchParams : {};
  const urlPrefill = parseBolusUrlPrefill(sp);
  const fromLink = hasBolusUrlPrefill(urlPrefill);

  const [settings, recentMealsRaw, latest] = await Promise.all([
    getUserSettings(user.id),
    getRecentMealEntries(user.id, 12),
    getLatestGlucoseEntry(user.id),
  ]);

  const recentMeals = toRecentMealOptions(recentMealsRaw);
  const bolusMathReady = bolusSettingsReady(settings);

  return (
    <AppShell title="Помощник болюса">
      <div className={PAGE_CONTAINER}>
        <header className="space-y-3">
          <p className={INTRO_TEXT}>
            Оценка болюса на еду и коррекцию по вашим{" "}
            <Link
              href="/settings"
              className="text-white/85 underline decoration-white/25 underline-offset-2"
            >
              настройкам
            </Link>
            : углеводный коэффициент, чувствительность и целевой диапазон
            глюкозы. Сервис не подключается к помпе и не пишет дозы в журнал
            автоматически.
          </p>
          <div className={CALLOUT_SUBTLE} role="note">
            <strong className="font-medium text-white/70">Важно:</strong> это
            вспомогательный расчёт, а не медицинская рекомендация. Проверяйте
            дозу самостоятельно; при сомнениях обратитесь к врачу.
          </div>
          {!bolusMathReady ? (
            <p className={CALLOUT_SUBTLE} role="status">
              Расчёт недоступен, пока в настройках не заполнены оба поля:
              углеводный коэффициент и чувствительность к инсулину.
            </p>
          ) : null}
          {fromLink ? (
            <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs leading-relaxed text-white/55">
              Поля ниже подставлены из ссылки (например, с карточки приёма
              пищи). Это только удобство ввода — всегда проверьте цифры перед
              расчётом.
            </p>
          ) : null}
        </header>

        <BolusForm
          settings={settings}
          recentMeals={recentMeals}
          urlPrefill={urlPrefill}
          latestGlucose={
            latest && typeof latest.glucose_value === "number"
              ? latest.glucose_value
              : null
          }
          latestGlucoseMeasuredAt={latest?.measured_at ?? null}
        />
      </div>
    </AppShell>
  );
}
