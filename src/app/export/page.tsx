import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUser } from "@/lib/auth/getUser";
import { getExportCounts } from "@/lib/export/export-counts";
import {
  getGlucoseRangeMeasuredAtLowerBound,
  parseGlucoseRangeParam,
} from "@/lib/utils/glucose";
import { ExportDownloadCard } from "./_components/export-download-card";
import { ExportPdfCard } from "./_components/export-pdf-card";
import { ExportRangeFilter } from "./_components/export-range-filter";
import {
  CALLOUT_SUBTLE,
  INTRO_TEXT,
  PAGE_CONTAINER,
  SECTION_TITLE,
} from "@/lib/ui/page-patterns";

type ExportPageProps = {
  searchParams?: Promise<{ range?: string | string[] }>;
};

export default async function ExportPage({ searchParams }: ExportPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const params = searchParams ? await searchParams : {};
  const range = parseGlucoseRangeParam(params.range);
  const bound = getGlucoseRangeMeasuredAtLowerBound(range);

  const counts = await getExportCounts(user.id, bound);
  const combinedTotal = counts.glucose + counts.insulin + counts.meals;

  return (
    <AppShell title="Экспорт данных">
      <div className={PAGE_CONTAINER}>
        <header className="space-y-3">
          <ExportRangeFilter activeRange={range} />
          <p className={INTRO_TEXT}>
            Выгрузка ваших записей: CSV (UTF‑8, Excel) и PDF‑отчёт для просмотра
            или визита к врачу. Файлы формируются на сервере только для вашего
            аккаунта; период такой же, как в журналах глюкозы и инсулина
            (сегодня, 7 / 14 / 30 дней или всё время).
          </p>
          <p className={CALLOUT_SUBTLE}>
            Данные носят личный характер. При передаче врачу проверьте содержимое
            файла и соблюдайте конфиденциальность.
          </p>
          {combinedTotal === 0 ? (
            <p className={CALLOUT_SUBTLE} role="status">
              Пока нечего выгружать за выбранный период — сначала добавьте записи
              глюкозы, еды или инсулина. Экспорт удобен после накопления данных.
            </p>
          ) : null}
        </header>

        <section className="space-y-3" aria-label="Варианты экспорта">
          <h2 className={SECTION_TITLE}>Скачать</h2>
          <div className="grid gap-3">
            <ExportPdfCard range={range} combinedCount={combinedTotal} />
            <ExportDownloadCard
              title="Глюкоза (CSV)"
              description="Время замера, значение, источник (сейчас: manual), примечание (если появится в приложении)."
              kind="glucose"
              range={range}
              count={counts.glucose}
            />
            <ExportDownloadCard
              title="Инсулин (CSV)"
              description="Время введения, название, тип, единицы, заметка. Дополнительно колонка с подписью типа на русском."
              kind="insulin"
              range={range}
              count={counts.insulin}
            />
            <ExportDownloadCard
              title="Приёмы пищи (CSV)"
              description="Время, тип приёма, суммарные углеводы и калории по позициям блюда, заметка."
              kind="meals"
              range={range}
              count={counts.meals}
            />
            <ExportDownloadCard
              title="Все данные (один CSV)"
              description="Один файл: колонка dataset (glucose / insulin / meal). Удобно фильтровать в Excel."
              kind="all"
              range={range}
              count={counts.glucose}
              totalCount={combinedTotal}
            />
          </div>
        </section>
      </div>
    </AppShell>
  );
}
