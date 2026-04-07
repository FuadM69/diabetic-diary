import Link from "next/link";
import type { GlucoseRangeKey } from "@/lib/types/glucose";

type ExportKind = "glucose" | "insulin" | "meals" | "all";

type ExportDownloadCardProps = {
  title: string;
  description: string;
  kind: ExportKind;
  range: GlucoseRangeKey;
  count: number;
  /** For combined export: total rows across datasets */
  totalCount?: number;
};

const base =
  "block rounded-2xl border px-4 py-4 transition-colors sm:px-5 sm:py-5";
const active =
  "border-white/18 bg-white/[0.06] hover:border-white/28 hover:bg-white/[0.08]";
const disabled =
  "cursor-not-allowed border-white/8 bg-white/[0.02] text-white/45";

export function ExportDownloadCard({
  title,
  description,
  kind,
  range,
  count,
  totalCount,
}: ExportDownloadCardProps) {
  const effective = kind === "all" ? (totalCount ?? count) : count;
  const empty = effective === 0;
  const href = `/api/export/csv?kind=${encodeURIComponent(kind)}&range=${encodeURIComponent(range)}`;

  if (empty) {
    return (
      <div
        className={`${base} ${disabled}`}
        aria-disabled="true"
      >
        <h3 className="text-sm font-medium text-white/55">{title}</h3>
        <p className="mt-1.5 text-xs leading-relaxed text-white/38">
          {description}
        </p>
        <p className="mt-3 text-xs text-white/35">Нет данных за выбранный период.</p>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={`${base} ${active}`}
      prefetch={false}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium text-white">{title}</h3>
        <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[0.65rem] text-white/65">
          {kind === "all"
            ? `${totalCount ?? 0} стр.`
            : `${count} стр.`}
        </span>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-white/55">{description}</p>
      <p className="mt-3 text-xs font-medium text-emerald-200/90">
        Скачать CSV →
      </p>
    </Link>
  );
}
