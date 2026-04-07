import { EmptyState } from "@/components/ui/empty-state";
import type {
  GlucoseRangeKey,
  GlucoseStats as GlucoseStatsModel,
} from "@/lib/types/glucose";
import { getGlucoseStatsEmptyLabel } from "@/lib/utils/glucose";

type GlucoseStatsProps = {
  stats: GlucoseStatsModel;
  range: GlucoseRangeKey;
};

function Card({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string | number;
  suffix?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 sm:px-4 sm:py-3">
      <p className="text-[0.65rem] font-medium uppercase tracking-wide text-white/40">
        {label}
      </p>
      <p className="mt-0.5 tabular-nums text-base font-semibold text-white/90 sm:text-lg">
        {value}
        {suffix ? (
          <span className="text-sm font-semibold text-white/70">{suffix}</span>
        ) : null}
      </p>
    </div>
  );
}

export function GlucoseStats({ stats, range }: GlucoseStatsProps) {
  if (stats.isEmpty) {
    return (
      <EmptyState
        variant="muted"
        title={getGlucoseStatsEmptyLabel(range)}
        description="Добавьте замер в форме выше или выберите другой период."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <Card label="Average" value={stats.average} />
        <Card label="Min" value={stats.min} />
        <Card label="Max" value={stats.max} />
        <Card label="In range" value={stats.inRangePercent} suffix="%" />
      </div>
      <p className="text-center text-xs tabular-nums text-white/45">
        Based on {stats.totalCount}{" "}
        {stats.totalCount === 1 ? "entry" : "entries"}
      </p>
    </div>
  );
}
