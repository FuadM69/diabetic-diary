import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUser } from "@/lib/auth/getUser";
import { getInsulinEntries } from "@/lib/db/insulin";
import { getUserSettings } from "@/lib/db/settings";
import {
  getGlucoseRangeMeasuredAtLowerBound,
  parseGlucoseRangeParam,
} from "@/lib/utils/glucose";
import { parseInsulinQueryPrefill } from "@/lib/utils/insulin-form";
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
  const formKey = `${entries.length}-${range}-${queryPrefill ? `p-${queryPrefill.units}` : "np"}`;

  return (
    <AppShell title="Инсулин">
      <div className={PAGE_CONTAINER}>
        <header className="space-y-3">
          <InsulinRangeFilter activeRange={range} />
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
          <InsulinForm formKey={formKey} queryPrefill={queryPrefill} />
        </section>

        <section className="space-y-3">
          <h2 className={SECTION_TITLE}>Записи</h2>
          <InsulinList entries={entries} range={range} />
        </section>
      </div>
    </AppShell>
  );
}
