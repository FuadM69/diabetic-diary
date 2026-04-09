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
  userTimezone: string | null;
};

export function GlucoseList({
  entries,
  settings,
  range,
  userTimezone,
}: GlucoseListProps) {
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
          userTimezone={userTimezone}
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
