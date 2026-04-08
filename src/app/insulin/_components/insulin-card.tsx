import type { GlucoseRangeKey } from "@/lib/types/glucose";
import type { InsulinEntry, InsulinEntryType } from "@/lib/types/insulin";
import { formatUtcIsoForUserDisplay } from "@/lib/utils/datetime-local-tz";
import {
  formatInsulinUnits,
  INSULIN_ENTRY_TYPE_LABEL_RU,
} from "@/lib/utils/insulin";
import { DeleteInsulinButton } from "./delete-insulin-button";
import { EditInsulinDialog } from "./edit-insulin-dialog";

const TYPE_PRESENTATION: Record<
  InsulinEntryType,
  { card: string; badge: string }
> = {
  basal: {
    card: "border-sky-500/25 bg-sky-500/[0.07]",
    badge: "bg-sky-500/15 text-sky-100 ring-1 ring-sky-400/28",
  },
  bolus: {
    card: "border-violet-500/25 bg-violet-500/[0.07]",
    badge: "bg-violet-500/15 text-violet-100 ring-1 ring-violet-400/28",
  },
  correction: {
    card: "border-amber-500/28 bg-amber-500/[0.07]",
    badge: "bg-amber-500/14 text-amber-100 ring-1 ring-amber-400/30",
  },
};

type InsulinCardProps = {
  entry: InsulinEntry;
  userTimezone: string | null;
  activeRange: GlucoseRangeKey;
  activeRangeLabel: string;
};

export function InsulinCard({
  entry,
  userTimezone,
  activeRange,
  activeRangeLabel,
}: InsulinCardProps) {
  const ui =
    TYPE_PRESENTATION[entry.entry_type] ?? TYPE_PRESENTATION.bolus;
  const typeLabel =
    INSULIN_ENTRY_TYPE_LABEL_RU[entry.entry_type] ?? entry.entry_type;

  return (
    <li
      className={`rounded-2xl border p-4 transition-colors ${ui.card}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <p className="text-3xl font-semibold tabular-nums tracking-tight text-white">
              {formatInsulinUnits(entry.units)}
              <span className="ml-1 text-lg font-medium text-white/55">
                ед.
              </span>
            </p>
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${ui.badge}`}
            >
              {typeLabel}
            </span>
          </div>
          {entry.insulin_name ? (
            <p className="truncate text-sm text-white/60">{entry.insulin_name}</p>
          ) : null}
          <p className="text-xs text-white/48">
            {formatUtcIsoForUserDisplay(entry.taken_at, userTimezone)}
          </p>
        </div>
      </div>

      {entry.note ? (
        <p className="mt-3 border-t border-white/10 pt-3 text-sm leading-relaxed text-white/65">
          {entry.note}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/10 pt-3">
        <EditInsulinDialog
          entry={entry}
          userTimezone={userTimezone}
          activeRange={activeRange}
          activeRangeLabel={activeRangeLabel}
        />
        <DeleteInsulinButton entryId={entry.id} />
      </div>
    </li>
  );
}
