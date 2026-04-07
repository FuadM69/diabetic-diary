import type {
  GlucoseEntry,
  GlucoseRangeKey,
  UserSettings,
} from "@/lib/types/glucose";
import { getGlucoseListEmptyMessage, getGlucoseStatus } from "@/lib/utils/glucose";
import { EmptyState } from "@/components/ui/empty-state";
import { GlucoseCard } from "./glucose-card";

type GlucoseListProps = {
  entries: GlucoseEntry[];
  settings: UserSettings;
  range: GlucoseRangeKey;
};

export function GlucoseList({ entries, settings, range }: GlucoseListProps) {
  if (entries.length === 0) {
    const empty = getGlucoseListEmptyMessage(range);
    const action =
      range === "all"
        ? { href: "#add-glucose", label: "К форме добавления" }
        : { href: "/glucose?range=all", label: "Показать всё время" };
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
        <GlucoseCard
          key={entry.id}
          entry={entry}
          status={getGlucoseStatus(
            entry.glucose_value,
            settings.glucose_target_min,
            settings.glucose_target_max
          )}
        />
      ))}
    </ul>
  );
}
