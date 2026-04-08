import type { GlucoseRangeKey } from "@/lib/types/glucose";
import type { InsulinEntry } from "@/lib/types/insulin";
import { GLUCOSE_RANGE_LABEL } from "@/lib/utils/glucose";
import { getInsulinListEmptyMessage } from "@/lib/utils/insulin";
import { EmptyState } from "@/components/ui/empty-state";
import { InsulinCard } from "./insulin-card";

type InsulinListProps = {
  entries: InsulinEntry[];
  range: GlucoseRangeKey;
  userTimezone: string | null;
};

export function InsulinList({
  entries,
  range,
  userTimezone,
}: InsulinListProps) {
  const rangeLabel = GLUCOSE_RANGE_LABEL[range];
  if (entries.length === 0) {
    const empty = getInsulinListEmptyMessage(range);
    const action =
      range === "all"
        ? { href: "#insulin-add", label: "К форме добавления" }
        : { href: "/insulin?range=all", label: "Показать всё время" };
    return (
      <EmptyState
        title={empty.title}
        description={empty.description}
        action={action}
      />
    );
  }

  return (
    <ul className="space-y-3">
      {entries.map((entry) => (
        <InsulinCard
          key={entry.id}
          entry={entry}
          userTimezone={userTimezone}
          activeRange={range}
          activeRangeLabel={rangeLabel}
        />
      ))}
    </ul>
  );
}
