import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { LogRangeFilter } from "@/components/filters/log-range-filter";
import { getCurrentUser } from "@/lib/auth/getUser";
import {
  getGlucoseEntries,
  getLatestGlucoseEntry,
} from "@/lib/db/glucose";
import { getInsulinEntries } from "@/lib/db/insulin";
import { getMealEntries } from "@/lib/db/meals";
import { getUserSettings } from "@/lib/db/settings";
import { formatUtcIsoForUserDisplay } from "@/lib/utils/datetime-local-tz";
import { GlucoseChart } from "./glucose/_components/GlucoseChart";
import { GlucoseStats } from "./glucose/_components/glucose-stats";
import { DashboardGreeting } from "./_components/dashboard/dashboard-greeting";
import { DashboardOnboarding } from "./_components/dashboard/dashboard-onboarding";
import { DashboardQuickActions } from "./_components/dashboard/dashboard-quick-actions";
import { DashboardRefreshButton } from "./_components/dashboard/dashboard-refresh-button";
import { DashboardTodaySection } from "./_components/dashboard/dashboard-today-section";
import {
  filterGlucoseEntriesMeasuredAtGte,
  formatGlucoseValue,
  GLUCOSE_RANGE_LABEL,
  getGlucoseRangeMeasuredAtLowerBound,
  parseGlucoseRangeParam,
  getGlucoseStats,
  mapGlucoseEntriesToChartPoints,
} from "@/lib/utils/glucose";
import { MEAL_TYPE_LABEL_RU, type MealTypeKey } from "@/lib/types/meal";
import { INSULIN_ENTRY_TYPE_LABEL_RU } from "@/lib/utils/insulin";
import { sumCarbsFromItems } from "@/lib/utils/meal-nutrition";
import {
  PAGE_CONTAINER,
  SECTION_TITLE,
  SURFACE_INSET,
} from "@/lib/ui/page-patterns";

type HomePageProps = {
  searchParams?: Promise<{ range?: string | string[] }>;
};

type TodayEvent = {
  id: string;
  whenIso: string;
  label: string;
  value: string;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  const params = searchParams ? await searchParams : {};
  const activeRange = parseGlucoseRangeParam(params.range);

  const displayNameRaw = user.user_metadata?.full_name;
  const displayName =
    typeof displayNameRaw === "string" && displayNameRaw.trim().length > 0
      ? displayNameRaw.trim()
      : user.email?.split("@")[0] ?? null;

  const [latest, settings] = await Promise.all([
    getLatestGlucoseEntry(user.id),
    getUserSettings(user.id),
  ]);

  const todayLower = getGlucoseRangeMeasuredAtLowerBound("today", {
    timezone: settings.timezone,
  });
  const chartLower = getGlucoseRangeMeasuredAtLowerBound(activeRange, {
    timezone: settings.timezone,
  });

  const [chartEntries, todayMeals, todayInsulin] = await Promise.all([
    getGlucoseEntries(user.id, {
      measuredAtGte: chartLower,
    }),
    getMealEntries(user.id, { eatenAtGte: todayLower }),
    getInsulinEntries(user.id, { takenAtGte: todayLower }),
  ]);

  const todayEntries =
    typeof todayLower === "string"
      ? filterGlucoseEntriesMeasuredAtGte(chartEntries, todayLower)
      : [];

  const todayStats = getGlucoseStats(todayEntries, settings);
  const statsForRange = getGlucoseStats(chartEntries, settings);
  const chartPoints = mapGlucoseEntriesToChartPoints(chartEntries, settings);

  const isOnboarding = latest === null;
  const todayEventsAll: TodayEvent[] = [
    ...todayEntries.map((entry) => ({
      id: `g-${entry.id}`,
      whenIso: entry.measured_at,
      label: "Глюкоза",
      value: formatGlucoseValue(entry.glucose_value),
    })),
    ...todayMeals.map((meal) => ({
      id: `m-${meal.id}`,
      whenIso: meal.eaten_at,
      label:
        meal.meal_type in MEAL_TYPE_LABEL_RU
          ? MEAL_TYPE_LABEL_RU[meal.meal_type as MealTypeKey]
          : "Приём пищи",
      value: `${sumCarbsFromItems(meal.meal_items)} г УВ`,
    })),
    ...todayInsulin.map((entry) => ({
      id: `i-${entry.id}`,
      whenIso: entry.taken_at,
      label: INSULIN_ENTRY_TYPE_LABEL_RU[entry.entry_type],
      value: `${entry.units} ед.`,
    })),
  ].sort((a, b) => b.whenIso.localeCompare(a.whenIso));
  const todayEvents = todayEventsAll.slice(0, 3);
  const moreTodayCount = Math.max(0, todayEventsAll.length - todayEvents.length);

  return (
    <AppShell title="Главная">
      <div className={PAGE_CONTAINER}>
        <DashboardGreeting
          displayName={displayName}
          isOnboarding={isOnboarding}
        />

        {isOnboarding ? (
          <DashboardOnboarding />
        ) : (
          <>
            <DashboardTodaySection
              latest={latest}
              todayStats={todayStats}
              userTimezone={settings.timezone}
              trailing={<DashboardRefreshButton />}
            />

            <section className="space-y-2">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className={SECTION_TITLE}>Динамика</h3>
                <span className="text-[0.65rem] text-white/40">
                  {GLUCOSE_RANGE_LABEL[activeRange]}
                </span>
              </div>
              <LogRangeFilter basePath="/" activeRange={activeRange} />
              <div className={SURFACE_INSET}>
                <GlucoseChart
                  points={chartPoints}
                  settings={settings}
                  range={activeRange}
                  compact
                />
              </div>
            </section>

            <section className="space-y-2">
              <h3 className={SECTION_TITLE}>Сводка</h3>
              <GlucoseStats stats={statsForRange} range={activeRange} />
            </section>

            <section className="space-y-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className={SECTION_TITLE}>Сегодня кратко</h3>
                <Link
                  href="/history"
                  className="text-xs text-white/50 underline decoration-white/20 underline-offset-2 hover:text-white/75"
                >
                  Полная история
                </Link>
              </div>
              {todayEvents.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/55">
                  За сегодня пока нет событий.
                </div>
              ) : (
                <ul className="rounded-3xl border border-white/10 bg-white/[0.03] divide-y divide-white/10">
                  {todayEvents.map((event) => (
                    <li
                      key={event.id}
                      className="flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm text-white/85">{event.label}</p>
                        <p className="text-xs text-white/45">{event.value}</p>
                      </div>
                      <span className="shrink-0 tabular-nums text-xs text-white/55">
                        {formatUtcIsoForUserDisplay(event.whenIso, settings.timezone, {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {moreTodayCount > 0 ? (
                <p className="text-center text-[0.7rem] text-white/45">
                  И ещё {moreTodayCount} — в{" "}
                  <Link
                    href="/history"
                    className="text-white/65 underline decoration-white/25 underline-offset-2"
                  >
                    истории
                  </Link>
                  .
                </p>
              ) : null}
            </section>
          </>
        )}

        <DashboardQuickActions variant={isOnboarding ? "onboarding" : "default"} />
      </div>
    </AppShell>
  );
}
