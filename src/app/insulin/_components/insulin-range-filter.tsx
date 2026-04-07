import { LogRangeFilter } from "@/components/filters/log-range-filter";
import type { GlucoseRangeKey } from "@/lib/types/glucose";

type InsulinRangeFilterProps = {
  activeRange: GlucoseRangeKey;
};

export function InsulinRangeFilter({ activeRange }: InsulinRangeFilterProps) {
  return (
    <LogRangeFilter
      basePath="/insulin"
      activeRange={activeRange}
      ariaLabel="Период журнала инсулина"
    />
  );
}
