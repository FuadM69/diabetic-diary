import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUser } from "@/lib/auth/getUser";
import { getInsulinEntries } from "@/lib/db/insulin";
import { getUserSettings } from "@/lib/db/settings";
import {
  defaultDatetimeLocalForUserSettings,
  formatUtcIsoForUserDisplay,
} from "@/lib/utils/datetime-local-tz";
import {
  GLUCOSE_RANGE_LABEL,
  getGlucoseRangeMeasuredAtLowerBound,
  parseGlucoseRangeParam,
} from "@/lib/utils/glucose";
import {
  isInsulinDebugLogEnabled,
  parseInsulinQueryPrefill,
} from "@/lib/utils/insulin-form";
import { InsulinForm } from "./_components/insulin-form";
import { InsulinList } from "./_components/insulin-list";
import { InsulinFilterHint } from "./_components/insulin-filter-hint";
import { InsulinRangeFilter } from "./_components/insulin-range-filter";
import {
  PAGE_CONTAINER,
  SECTION_TITLE,
  SURFACE_CARD,
} from "@/lib/ui/page-patterns";

type InsulinPageProps = {
  searchParams?: Promise<{
    range?: string | string[];
    units?: string | string[];
    entry_type?: string | string[];
    note?: string | string[];
    flow?: string | string[];
    fromMeal?: string | string[];
  }>;
};

export default async function InsulinPage({ searchParams }: InsulinPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const params = searchParams ? await searchParams : {};
  const range = parseGlucoseRangeParam(params.range);
  const settings = await getUserSettings(user.id);
  const takenAtGte = getGlucoseRangeMeasuredAtLowerBound(range, {
    timezone: settings.timezone,
  });

  const entries = await getInsulinEntries(user.id, { takenAtGte });
  const queryPrefill = parseInsulinQueryPrefill(
    params,
    settings.insulin_dose_step
  );
  const flowRaw = Array.isArray(params.flow) ? params.flow[0] : params.flow;
  const fromMealRaw =
    Array.isArray(params.fromMeal) ? params.fromMeal[0] : params.fromMeal;
  const prefillFromBolusFlow = flowRaw === "bolus";
  const prefillFromMeal = fromMealRaw === "1";
  /** Do not key the form by `entries.length` — it hid success feedback and confused users when back-dated rows were filtered out. */
  const formKey = `${range}-${queryPrefill ? `p-${queryPrefill.units}` : "np"}`;
  const takenAtDefault = defaultDatetimeLocalForUserSettings(settings.timezone);

  if (isInsulinDebugLogEnabled()) {
    console.log(
      "[insulin][page]",
      JSON.stringify({
        range,
        takenAtGte,
        entryCount: entries.length,
        queryPrefill,
        takenAtDefault,
      })
    );
  }

  return (
    <AppShell title="Инсулин">
      <div className={PAGE_CONTAINER}>
        <header className="space-y-2">
          <InsulinRangeFilter activeRange={range} />
          {range !== "all" && takenAtGte ? (
            <InsulinFilterHint
              range={range}
              rangeLabel={GLUCOSE_RANGE_LABEL[range]}
              takenAtGteDisplay={formatUtcIsoForUserDisplay(
                takenAtGte,
                settings.timezone,
                {
                  dateStyle: "medium",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                }
              )}
            />
          ) : null}
          <details className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs leading-relaxed text-white/50">
            <summary className="cursor-pointer list-none font-medium text-white/60 [&::-webkit-details-marker]:hidden">
              О журнале{" "}
              <span className="font-normal text-white/35">▼</span>
            </summary>
            <p className="mt-2">
              Базальный, болюс и коррекция. Запись появляется только после
              сохранения — автоматически доза не назначается.
            </p>
          </details>
        </header>

        <section
          id="insulin-add"
          className={`${SURFACE_CARD} scroll-mt-24`}
          aria-label="Добавить введение инсулина"
        >
          <InsulinForm
            key={formKey}
            queryPrefill={queryPrefill}
            defaultTakenAtLocal={
              takenAtDefault.ok ? takenAtDefault.value : ""
            }
            timezoneConfigError={
              takenAtDefault.ok ? null : takenAtDefault.message
            }
            savedUserTimezone={settings.timezone}
            activeRange={range}
            activeRangeLabel={GLUCOSE_RANGE_LABEL[range]}
            prefillFromBolusFlow={prefillFromBolusFlow}
            prefillFromMeal={prefillFromMeal}
          />
        </section>

        <section className="space-y-3">
          <h2 className={SECTION_TITLE}>Записи</h2>
          <InsulinList
            entries={entries}
            range={range}
            userTimezone={settings.timezone}
          />
        </section>
      </div>
    </AppShell>
  );
}
