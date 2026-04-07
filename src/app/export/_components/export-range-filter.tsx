import { LogRangeFilter } from "@/components/filters/log-range-filter";
import type { GlucoseRangeKey } from "@/lib/types/glucose";

type ExportRangeFilterProps = {
  activeRange: GlucoseRangeKey;
};

export function ExportRangeFilter({ activeRange }: ExportRangeFilterProps) {
  return (
    <LogRangeFilter
      basePath="/export"
      activeRange={activeRange}
      ariaLabel="Период экспорта"
    />
  );
}
