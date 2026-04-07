import Link from "next/link";
import type { GlucoseRangeKey } from "@/lib/types/glucose";
import { GLUCOSE_RANGE_OPTIONS } from "@/lib/types/glucose";
import { GLUCOSE_RANGE_LABEL } from "@/lib/utils/glucose";

type LogRangeFilterProps = {
  basePath: string;
  activeRange: GlucoseRangeKey;
  ariaLabel?: string;
};

/**
 * URL chips for log date ranges (today / 7d / … / all). Same keys/labels as glucose.
 */
export function LogRangeFilter({
  basePath,
  activeRange,
  ariaLabel = "Период отображения",
}: LogRangeFilterProps) {
  const path = basePath.replace(/\/$/, "");

  return (
    <nav className="flex flex-wrap gap-2" aria-label={ariaLabel}>
      {GLUCOSE_RANGE_OPTIONS.map((key) => {
        const isActive = key === activeRange;
        const href = `${path}?range=${encodeURIComponent(key)}`;

        return (
          <Link
            key={key}
            href={href}
            scroll={false}
            aria-current={isActive ? "page" : undefined}
            className={`rounded-2xl px-3 py-2 text-xs font-medium transition-colors ${
              isActive
                ? "bg-white text-black"
                : "border border-white/15 bg-white/[0.04] text-white/70 hover:border-white/25 hover:text-white/90"
            }`}
          >
            {GLUCOSE_RANGE_LABEL[key]}
          </Link>
        );
      })}
    </nav>
  );
}
