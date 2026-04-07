import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUser } from "@/lib/auth/getUser";
import { getGlucoseEntries } from "@/lib/db/glucose";
import { getUserSettings } from "@/lib/db/settings";
import {
  buildLogRangeDebugPayload,
  isDiaryLogRangeDebugEnabled,
  logLogRangeDebugToConsole,
} from "@/lib/utils/log-range-bounds";
import {
  getGlucoseRangeMeasuredAtLowerBound,
  getGlucoseStats,
  mapGlucoseEntriesToChartPoints,
  parseGlucoseRangeParam,
} from "@/lib/utils/glucose";
import { GlucoseRangeDebugPanel } from "./_components/glucose-range-debug-panel";
import { GlucoseChart } from "./_components/GlucoseChart";
import { GlucoseForm } from "./_components/glucose-form";
import { GlucoseList } from "./_components/glucose-list";
import { GlucoseRangeFilter } from "./_components/glucose-range-filter";
import { GlucoseStats } from "./_components/glucose-stats";
import {
  INTRO_TEXT,
  PAGE_CONTAINER,
  SECTION_TITLE,
  SURFACE_CARD,
  SURFACE_INSET,
} from "@/lib/ui/page-patterns";

type GlucosePageProps = {
  searchParams?: Promise<{ range?: string | string[] }>;
};

export default async function GlucosePage({ searchParams }: GlucosePageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const params = searchParams ? await searchParams : {};
  const range = parseGlucoseRangeParam(params.range);
  const settings = await getUserSettings(user.id);
  const boundOptions = { timezone: settings.timezone };
  const measuredAtGte = getGlucoseRangeMeasuredAtLowerBound(
    range,
    boundOptions
  );

  const entries = await getGlucoseEntries(user.id, { measuredAtGte });

  const rangeDebugPayload =
    isDiaryLogRangeDebugEnabled() ?
      buildLogRangeDebugPayload(
        range,
        boundOptions,
        measuredAtGte,
        entries.map((e) => e.measured_at)
      )
    : null;

  if (rangeDebugPayload) {
    logLogRangeDebugToConsole("glucose-page", rangeDebugPayload);
  }

  const stats = getGlucoseStats(entries, settings);
  const chartPoints = mapGlucoseEntriesToChartPoints(entries, settings);

  return (
    <AppShell title="Глюкоза">
      <div className={PAGE_CONTAINER}>
        <header className="space-y-3">
          <GlucoseRangeFilter activeRange={range} />
          <p className={INTRO_TEXT}>
            Целевой диапазон{" "}
            <span className="tabular-nums text-white/85">
              {settings.glucose_target_min}–{settings.glucose_target_max}
            </span>
            . Записи ниже подсвечиваются относительно этих границ.
          </p>
        </header>

        {rangeDebugPayload ? (
          <GlucoseRangeDebugPanel payload={rangeDebugPayload} />
        ) : null}

        <section
          id="add-glucose"
          className={`${SURFACE_CARD} scroll-mt-24`}
          aria-label="Добавить запись глюкозы"
        >
          <GlucoseForm formKey={`${entries.length}|${range}`} />
        </section>

        <section className="space-y-3">
          <h2 className={SECTION_TITLE}>Сводка</h2>
          <GlucoseStats stats={stats} range={range} />
        </section>

        <section className="space-y-2">
          <div>
            <h2 className={SECTION_TITLE}>График</h2>
            <p className="mt-1 text-xs leading-snug text-white/50">
              Динамика по времени. Подсвеченная полоса — ваш целевой диапазон
              (границы отмечены пунктиром).
            </p>
          </div>
          <div className={SURFACE_INSET}>
            <GlucoseChart
              points={chartPoints}
              settings={settings}
              range={range}
            />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className={SECTION_TITLE}>Последние значения</h2>
          <GlucoseList entries={entries} settings={settings} range={range} />
        </section>
      </div>
    </AppShell>
  );
}
