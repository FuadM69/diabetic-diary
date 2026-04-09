import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUser } from "@/lib/auth/getUser";
import {
  getLatestGlucoseEntry,
  getLatestGlucoseEntryAtOrBefore,
} from "@/lib/db/glucose";
import { getMealEntryDetails, getRecentMealEntries } from "@/lib/db/meals";
import { getUserSettings } from "@/lib/db/settings";
import type {
  BolusGlucoseSuggestion,
  BolusMealContext,
  BolusRecentMealOption,
} from "@/lib/types/bolus";
import type { MealEntryWithItems, MealTypeKey } from "@/lib/types/meal";
import { MEAL_TYPE_LABEL_RU } from "@/lib/types/meal";
import {
  hasBolusUrlPrefill,
  parseBolusUrlPrefill,
} from "@/lib/utils/bolus-prefill";
import { bolusSettingsReady } from "@/lib/utils/bolus-form";
import { formatGlucoseDate } from "@/lib/utils/glucose";
import { sumCarbsFromItems } from "@/lib/utils/meal-nutrition";
import { BolusForm } from "./_components/bolus-form";
import { CALLOUT_SUBTLE, INTRO_TEXT, PAGE_CONTAINER } from "@/lib/ui/page-patterns";

type BolusPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

async function buildRecentMealOptions(
  userId: string,
  meals: MealEntryWithItems[]
): Promise<BolusRecentMealOption[]> {
  return Promise.all(
    meals.map(async (m) => {
      const totalCarbs = sumCarbsFromItems(m.meal_items);
      const mealTypeLabel =
        m.meal_type in MEAL_TYPE_LABEL_RU
          ? MEAL_TYPE_LABEL_RU[m.meal_type as MealTypeKey]
          : m.meal_type;
      const g = await getLatestGlucoseEntryAtOrBefore(userId, m.eaten_at);
      const badTime = g && g.measured_at > m.eaten_at;
      const v = badTime ? undefined : g?.glucose_value;
      return {
        id: m.id,
        eatenAt: m.eaten_at,
        mealType: m.meal_type,
        mealTypeLabel,
        totalCarbs,
        suggestGlucoseValue:
          typeof v === "number" && Number.isFinite(v) ? v : null,
        suggestGlucoseMeasuredAt:
          !badTime && g ? g.measured_at : null,
      };
    })
  );
}

async function resolveBolusMealContextFromUrl(
  userId: string,
  linkedMealId: string | null,
  recentMealsRaw: MealEntryWithItems[]
): Promise<{
  initialMealContext: BolusMealContext | null;
  linkedMealMissing: boolean;
  linkedMealEatenAtIso: string | null;
}> {
  if (!linkedMealId) {
    return {
      initialMealContext: null,
      linkedMealMissing: false,
      linkedMealEatenAtIso: null,
    };
  }

  const fromRecent = recentMealsRaw.find((m) => m.id === linkedMealId);
  const meal =
    fromRecent ?? (await getMealEntryDetails(userId, linkedMealId));

  if (!meal) {
    return {
      initialMealContext: null,
      linkedMealMissing: true,
      linkedMealEatenAtIso: null,
    };
  }

  const mealTypeLabel =
    meal.meal_type in MEAL_TYPE_LABEL_RU
      ? MEAL_TYPE_LABEL_RU[meal.meal_type as MealTypeKey]
      : meal.meal_type;

  const carbsGrams = sumCarbsFromItems(meal.meal_items);

  return {
    initialMealContext: {
      mealTypeLabel,
      eatenAtDisplay: formatGlucoseDate(meal.eaten_at),
      carbsGrams,
    },
    linkedMealMissing: false,
    linkedMealEatenAtIso: meal.eaten_at,
  };
}

export default async function BolusPage({ searchParams }: BolusPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const sp = searchParams ? await searchParams : {};
  const urlPrefill = parseBolusUrlPrefill(sp);
  const fromLink = hasBolusUrlPrefill(urlPrefill);

  const [settings, recentMealsRaw, latestGlobal] = await Promise.all([
    getUserSettings(user.id),
    getRecentMealEntries(user.id, 12),
    getLatestGlucoseEntry(user.id),
  ]);

  const bolusMathReady = bolusSettingsReady(settings);

  const { initialMealContext, linkedMealMissing, linkedMealEatenAtIso } =
    await resolveBolusMealContextFromUrl(
      user.id,
      urlPrefill.linkedMealId,
      recentMealsRaw
    );

  const glucoseAnchorIso =
    linkedMealEatenAtIso ??
    (urlPrefill.linkedMealId != null ? urlPrefill.linkedMealTimeIso : null);

  const [recentMeals, glucoseAtOrBeforeAnchor] = await Promise.all([
    buildRecentMealOptions(user.id, recentMealsRaw),
    glucoseAnchorIso ?
      getLatestGlucoseEntryAtOrBefore(user.id, glucoseAnchorIso)
    : Promise.resolve(null),
  ]);

  let glucoseRow = glucoseAtOrBeforeAnchor;
  if (
    glucoseRow &&
    glucoseAnchorIso &&
    glucoseRow.measured_at > glucoseAnchorIso
  ) {
    glucoseRow = null;
  }

  let defaultGlucoseSuggestion: BolusGlucoseSuggestion | null = null;

  if (glucoseAnchorIso) {
    const v = glucoseRow?.glucose_value;
    if (typeof v === "number" && Number.isFinite(v)) {
      defaultGlucoseSuggestion = {
        value: v,
        measuredAt: glucoseRow!.measured_at,
        scope: "at_or_before_meal",
      };
    }
  } else {
    const v = latestGlobal?.glucose_value;
    if (typeof v === "number" && Number.isFinite(v)) {
      defaultGlucoseSuggestion = {
        value: v,
        measuredAt: latestGlobal!.measured_at,
        scope: "latest_global",
      };
    }
  }

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
          initialMealContext={initialMealContext}
          linkedMealMissing={linkedMealMissing}
          mealGlucoseReferenceIso={glucoseAnchorIso}
          defaultGlucoseSuggestion={defaultGlucoseSuggestion}
        />
      </div>
    </AppShell>
  );
}
