import type { GlucoseEntry, GlucoseStatus } from "@/lib/types/glucose";
import {
  formatGlucoseDate,
  formatGlucoseValue,
} from "@/lib/utils/glucose";
import { DeleteGlucoseButton } from "./delete-glucose-button";
import { EditGlucoseDialog } from "./edit-glucose-dialog";

const STATUS_PRESENTATION: Record<
  GlucoseStatus,
  { label: string; card: string; badge: string }
> = {
  low: {
    label: "Low",
    card: "border-red-500/35 bg-red-500/10",
    badge: "bg-red-500/20 text-red-200 ring-1 ring-red-400/40",
  },
  in_range: {
    label: "In range",
    card: "border-emerald-500/35 bg-emerald-500/10",
    badge: "bg-emerald-500/20 text-emerald-100 ring-1 ring-emerald-400/35",
  },
  high: {
    label: "High",
    card: "border-amber-500/40 bg-amber-500/10",
    badge: "bg-amber-500/25 text-amber-100 ring-1 ring-amber-400/40",
  },
};

type GlucoseCardProps = {
  entry: GlucoseEntry;
  status: GlucoseStatus;
};

export function GlucoseCard({ entry, status }: GlucoseCardProps) {
  const ui = STATUS_PRESENTATION[status];

  return (
    <li className={`rounded-2xl border p-4 transition-colors ${ui.card}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-3xl font-semibold tabular-nums tracking-tight text-white">
            {formatGlucoseValue(entry.glucose_value)}
          </p>
          <p className="mt-1 text-sm text-white/55">
            {formatGlucoseDate(entry.measured_at)}
          </p>
          {entry.note ? (
            <p className="mt-1 line-clamp-2 text-xs text-white/50">{entry.note}</p>
          ) : null}
          {entry.source && entry.source !== "manual" ? (
            <p className="mt-0.5 text-[0.65rem] uppercase tracking-wide text-white/35">
              {entry.source}
            </p>
          ) : null}
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${ui.badge}`}
        >
          {ui.label}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/10 pt-3">
        <EditGlucoseDialog entry={entry} />
        <DeleteGlucoseButton entryId={entry.id} />
      </div>
    </li>
  );
}
