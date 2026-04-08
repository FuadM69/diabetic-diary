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
import { InsulinRangeFilter } from "./_components/insulin-range-filter";
import {
  INTRO_TEXT,
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
  const queryPrefill = parseInsulinQueryPrefill(params);
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
        <header className="space-y-3">
          <InsulinRangeFilter activeRange={range} />
          {range !== "all" && takenAtGte ? (
            <p
              className="rounded-2xl border border-amber-500/25 bg-amber-950/20 px-3 py-2 text-xs leading-relaxed text-amber-50/90"
              role="note"
            >
              <strong className="font-medium text-amber-100">
                Список обрезан фильтром «{GLUCOSE_RANGE_LABEL[range]}»
              </strong>
              . Показываются только введения <strong>не раньше</strong> этой
              отметки (время введения, как в настройках профиля):{" "}
              <span className="tabular-nums font-semibold text-white">
                {formatUtcIsoForUserDisplay(takenAtGte, settings.timezone)}
              </span>
              . Более старые записи в таблице не скрыты навсегда — выберите
              период «Всё время», чтобы увидеть полный журнал.
            </p>
          ) : null}
          <p className={INTRO_TEXT}>
            Журнал введений: базальный, болюс и коррекция. Запись здесь не
            означает автоматическую дозу — вы подтверждаете введение сами.
            Первую запись добавьте формой ниже.
          </p>
        </header>

        <section
          id="insulin-add"
          className={`${SURFACE_CARD} scroll-mt-24`}
          aria-label="Добавить введение инсулина"
        >
          {queryPrefill ? (
            <p className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs leading-relaxed text-white/55">
              Поля ниже подставлены из ссылки (например, после помощника
              болюса). Это только черновик — проверьте дозу и время перед
              сохранением.
            </p>
          ) : null}
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
