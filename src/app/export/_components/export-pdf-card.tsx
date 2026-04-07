import Link from "next/link";
import type { GlucoseRangeKey } from "@/lib/types/glucose";

type ExportPdfCardProps = {
  range: GlucoseRangeKey;
  /** Total rows across glucose + insulin + meals for the selected range */
  combinedCount: number;
};

const base =
  "block rounded-2xl border px-4 py-4 transition-colors sm:px-5 sm:py-5";
const active =
  "border-emerald-500/30 bg-emerald-500/[0.08] hover:border-emerald-400/40 hover:bg-emerald-500/[0.1]";
const disabled =
  "cursor-not-allowed border-white/8 bg-white/[0.02] text-white/45";

export function ExportPdfCard({ range, combinedCount }: ExportPdfCardProps) {
  const empty = combinedCount === 0;
  const href = `/api/export/pdf?range=${encodeURIComponent(range)}`;

  if (empty) {
    return (
      <div className={`${base} ${disabled}`} aria-disabled="true">
        <h3 className="text-sm font-medium text-white/55">Отчёт PDF</h3>
        <p className="mt-1.5 text-xs leading-relaxed text-white/38">
          Сводка по глюкозе (среднее, min, max, % в диапазоне), таблицы замеров,
          инсулина и приёмов пищи за выбранный период. Удобно для врача или
          личного архива.
        </p>
        <p className="mt-3 text-xs text-white/35">
          Нет данных за выбранный период — выберите другой интервал или добавьте
          записи.
        </p>
      </div>
    );
  }

  return (
    <Link href={href} className={`${base} ${active}`} prefetch={false}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium text-white">Отчёт PDF</h3>
        <span className="shrink-0 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[0.65rem] text-emerald-100/90">
          A4
        </span>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-white/60">
        Сводка по глюкозе (среднее, min, max, % в диапазоне), таблицы замеров,
        инсулина и приёмов пищи за выбранный период. Удобно для врача или
        личного архива.
      </p>
      <p className="mt-3 text-xs font-medium text-emerald-200/95">
        Скачать PDF →
      </p>
    </Link>
  );
}
