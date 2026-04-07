import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUser } from "@/lib/auth/getUser";
import {
  getGlucoseEntries,
  getLatestGlucoseEntry,
} from "@/lib/db/glucose";
import { getUserSettings } from "@/lib/db/settings";
import { GlucoseChart } from "./glucose/_components/GlucoseChart";
import { GlucoseStats } from "./glucose/_components/glucose-stats";
import { DashboardGreeting } from "./_components/dashboard/dashboard-greeting";
import { DashboardOnboarding } from "./_components/dashboard/dashboard-onboarding";
import { DashboardQuickActions } from "./_components/dashboard/dashboard-quick-actions";
import { DashboardTodaySection } from "./_components/dashboard/dashboard-today-section";
import {
  filterGlucoseEntriesMeasuredAtGte,
  getGlucoseRangeMeasuredAtLowerBound,
  getGlucoseStats,
  mapGlucoseEntriesToChartPoints,
} from "@/lib/utils/glucose";
import {
  PAGE_CONTAINER,
  SECTION_TITLE,
  SURFACE_INSET,
} from "@/lib/ui/page-patterns";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const displayNameRaw = user.user_metadata?.full_name;
  const displayName =
    typeof displayNameRaw === "string" && displayNameRaw.trim().length > 0
      ? displayNameRaw.trim()
      : user.email?.split("@")[0] ?? null;

  const todayLower = getGlucoseRangeMeasuredAtLowerBound("today");
  const sevenLower = getGlucoseRangeMeasuredAtLowerBound("7d");

  const [latest, entries7d, settings] = await Promise.all([
    getLatestGlucoseEntry(user.id),
    getGlucoseEntries(user.id, { measuredAtGte: sevenLower }),
    getUserSettings(user.id),
  ]);

  const todayEntries =
    typeof todayLower === "string"
      ? filterGlucoseEntriesMeasuredAtGte(entries7d, todayLower)
      : [];

  const todayStats = getGlucoseStats(todayEntries, settings);
  const stats7d = getGlucoseStats(entries7d, settings);
  const chartPoints = mapGlucoseEntriesToChartPoints(entries7d, settings);

  const isOnboarding = latest === null;

  return (
    <AppShell title="Главная">
      <div className={PAGE_CONTAINER}>
        <DashboardGreeting displayName={displayName} isOnboarding={isOnboarding} />

        {isOnboarding ? (
          <DashboardOnboarding />
        ) : (
          <>
            <DashboardTodaySection
              latest={latest}
              todayStats={todayStats}
              settings={settings}
            />

            <section className="space-y-2">
              <h3 className={SECTION_TITLE}>За 7 дней</h3>
              <GlucoseStats stats={stats7d} range="7d" />
            </section>

            <section className="space-y-2">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className={SECTION_TITLE}>Динамика</h3>
                <span className="text-[0.65rem] text-white/40">7 дн.</span>
              </div>
              <div className={SURFACE_INSET}>
                <GlucoseChart
                  points={chartPoints}
                  settings={settings}
                  range="7d"
                  compact
                />
              </div>
            </section>
          </>
        )}

        <DashboardQuickActions variant={isOnboarding ? "onboarding" : "default"} />
      </div>
    </AppShell>
  );
}
