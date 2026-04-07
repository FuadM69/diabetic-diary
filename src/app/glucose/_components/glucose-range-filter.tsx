import { LogRangeFilter } from "@/components/filters/log-range-filter";
import type { GlucoseRangeKey } from "@/lib/types/glucose";

type GlucoseRangeFilterProps = {
  activeRange: GlucoseRangeKey;
};

export function GlucoseRangeFilter({ activeRange }: GlucoseRangeFilterProps) {
  return <LogRangeFilter basePath="/glucose" activeRange={activeRange} />;
}
