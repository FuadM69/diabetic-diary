import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUser } from "@/lib/auth/getUser";
import { getGlucoseEntries } from "@/lib/db/glucose";
import { getInsulinEntries } from "@/lib/db/insulin";
import { getMealEntries } from "@/lib/db/meals";
import { getUserSettings } from "@/lib/db/settings";
import {
  extractLinkedMealIdFromInsulinNote,
  stripLinkedMealMarkerFromInsulinNote,
} from "@/lib/utils/bolus-prefill";
import { formatUtcIsoForUserDisplay } from "@/lib/utils/datetime-local-tz";
import { getDisplayProductName } from "@/lib/utils/food-product-kind";
import { formatGlucoseValue } from "@/lib/utils/glucose";
import {
  readZonedWallClockParts,
  resolveLogRangeTimeZone,
} from "@/lib/utils/log-range-bounds";
import { sumCaloriesFromItems, sumCarbsFromItems } from "@/lib/utils/meal-nutrition";
import { INSULIN_ENTRY_TYPE_LABEL_RU } from "@/lib/utils/insulin";

type TimelineItem =
  | {
      id: string;
      type: "glucose";
      occurredAt: string;
      data: Awaited<ReturnType<typeof getGlucoseEntries>>[number];
    }
  | {
      id: string;
      type: "meal";
      occurredAt: string;
      data: Awaited<ReturnType<typeof getMealEntries>>[number];
    }
  | {
      id: string;
      type: "insulin";
      occurredAt: string;
      data: Awaited<ReturnType<typeof getInsulinEntries>>[number];
    };

function buildTimeline(
  glucoseEntries: Awaited<ReturnType<typeof getGlucoseEntries>>,
  mealEntries: Awaited<ReturnType<typeof getMealEntries>>,
  insulinEntries: Awaited<ReturnType<typeof getInsulinEntries>>
): TimelineItem[] {
  const timelineItems: TimelineItem[] = [
    ...glucoseEntries.map((entry) => ({
      id: `glucose-${entry.id}`,
      type: "glucose" as const,
      occurredAt: entry.measured_at,
      data: entry,
    })),
    ...mealEntries.map((meal) => ({
      id: `meal-${meal.id}`,
      type: "meal" as const,
      occurredAt: meal.eaten_at,
      data: meal,
    })),
    ...insulinEntries.map((entry) => ({
      id: `insulin-${entry.id}`,
      type: "insulin" as const,
      occurredAt: entry.taken_at,
      data: entry,
    })),
  ];

  timelineItems.sort(
    (a, b) => b.occurredAt.localeCompare(a.occurredAt)
  );

  return timelineItems;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function userDaySortKey(iso: string, ianaTimeZone: string): string {
  const p = readZonedWallClockParts(new Date(iso), ianaTimeZone);
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)}`;
}

function groupTimelineByUserCalendarDay(
  items: TimelineItem[],
  savedTimezone: string | null
): { dayLabel: string; dayKey: string; items: TimelineItem[] }[] {
  const zone = resolveLogRangeTimeZone(savedTimezone);
  const byDay = new Map<string, TimelineItem[]>();
  for (const item of items) {
    const dayKey = userDaySortKey(item.occurredAt, zone);
    const list = byDay.get(dayKey);
    if (list) {
      list.push(item);
    } else {
      byDay.set(dayKey, [item]);
    }
  }
  const groups = [...byDay.entries()].map(([dayKey, dayItems]) => ({
    dayKey,
    dayLabel: formatUtcIsoForUserDisplay(dayItems[0]!.occurredAt, savedTimezone, {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    items: dayItems.sort((a, b) =>
      b.occurredAt.localeCompare(a.occurredAt)
    ),
  }));
  groups.sort((a, b) => b.dayKey.localeCompare(a.dayKey));
  return groups;
}

export default async function HistoryPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const [settings, glucoseEntries, mealEntries, insulinEntries] = await Promise.all([
    getUserSettings(user.id),
    getGlucoseEntries(user.id),
    getMealEntries(user.id),
    getInsulinEntries(user.id),
  ]);

  const timeline = buildTimeline(glucoseEntries, mealEntries, insulinEntries);
  const timelineByDay = groupTimelineByUserCalendarDay(
    timeline,
    settings.timezone
  );
  const linkedBolusByMealId = new Map<string, number>();
  for (const e of insulinEntries) {
    if (e.entry_type !== "bolus") {
      continue;
    }
    const mealId = extractLinkedMealIdFromInsulinNote(e.note);
    if (!mealId || linkedBolusByMealId.has(mealId)) {
      continue;
    }
    linkedBolusByMealId.set(mealId, e.units);
  }

  return (
    <AppShell title="История">
      <div className="space-y-5">
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <h2 className="text-xl font-semibold">Единый дневник</h2>
          <p className="mt-1.5 text-sm text-white/60">
            Глюкоза, приемы пищи и инсулин в одной ленте
          </p>
        </section>

        {timeline.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center">
            <p className="text-sm text-white/70">Записей пока нет</p>
            <p className="mt-1 text-xs text-white/45">
              Добавьте первый замер, приём пищи или запись инсулина.
            </p>
          </section>
        ) : (
          <div className="space-y-4">
            {timelineByDay.map((group, groupIndex) => (
              <details
                key={group.dayKey}
                className="group rounded-3xl border border-white/10 bg-white/[0.02] open:bg-white/[0.03]"
                open={groupIndex < 2}
              >
                <summary className="cursor-pointer list-none px-4 py-3 [&::-webkit-details-marker]:hidden">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-white/88">
                      {group.dayLabel}
                    </span>
                    <span className="text-[0.65rem] text-white/45">
                      {group.items.length}{" "}
                      {group.items.length === 1 ? "запись" : "записей"}
                      <span className="ml-1 text-white/35 group-open:hidden">
                        ▼
                      </span>
                      <span className="ml-1 hidden text-white/35 group-open:inline">
                        ▲
                      </span>
                    </span>
                  </div>
                </summary>
                <div className="space-y-3.5 border-t border-white/10 px-3 pb-3 pt-3">
                  {group.items.map((item) => {
              if (item.type === "glucose") {
                return (
                  <section
                    key={item.id}
                    className="rounded-3xl border border-red-500/25 bg-red-500/[0.06] p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="rounded-full border border-red-400/35 bg-red-400/12 px-2.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-red-100/90">
                        Глюкоза
                      </p>
                      <p className="shrink-0 tabular-nums text-[0.72rem] text-white/55">
                        {formatUtcIsoForUserDisplay(
                          item.occurredAt,
                          settings.timezone,
                          {
                            dateStyle: "medium",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          }
                        )}
                      </p>
                    </div>
                    <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-white">
                      {formatGlucoseValue(item.data.glucose_value)}
                    </p>
                    {item.data.note ? (
                      <p className="mt-2 border-t border-white/10 pt-2 text-sm text-white/72">
                        {item.data.note}
                      </p>
                    ) : null}
                  </section>
                );
              }

              if (item.type === "meal") {
                return (
                  <section
                    key={item.id}
                    className="rounded-3xl border border-sky-500/25 bg-sky-500/[0.06] p-4"
                  >
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <p className="rounded-full border border-sky-400/35 bg-sky-400/12 px-2.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-sky-100/90">
                        Приём пищи
                      </p>
                      <p className="shrink-0 tabular-nums text-[0.72rem] text-white/55">
                        {formatUtcIsoForUserDisplay(
                          item.occurredAt,
                          settings.timezone,
                          {
                            dateStyle: "medium",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          }
                        )}
                      </p>
                      {linkedBolusByMealId.has(item.data.id) ? (
                        <p className="text-xs text-emerald-200/90">
                          Болюс:{" "}
                          <span className="tabular-nums font-medium">
                            {linkedBolusByMealId.get(item.data.id)}
                          </span>{" "}
                          ед.
                        </p>
                      ) : null}
                    </div>

                    <div className="mt-2.5 space-y-1 text-sm text-white/82">
                      {item.data.meal_items.map((mealItem) => (
                        <p key={mealItem.id}>
                          {getDisplayProductName(mealItem.productName)} -{" "}
                          {mealItem.grams} г
                        </p>
                      ))}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <p className="rounded-xl border border-white/10 bg-black/30 px-2.5 py-1 text-xs text-white/70">
                        Калории:{" "}
                        <span className="tabular-nums">
                          {sumCaloriesFromItems(item.data.meal_items).toFixed(2)}
                        </span>
                      </p>
                      <p className="rounded-xl border border-white/10 bg-black/30 px-2.5 py-1 text-xs text-white/70">
                        Углеводы:{" "}
                        <span className="tabular-nums">
                          {sumCarbsFromItems(item.data.meal_items).toFixed(2)}
                        </span>
                      </p>
                    </div>
                    {item.data.note ? (
                      <p className="mt-2 border-t border-white/10 pt-2 text-sm text-white/72">
                        {item.data.note}
                      </p>
                    ) : null}
                  </section>
                );
              }

              const noteForDisplay = stripLinkedMealMarkerFromInsulinNote(
                item.data.note
              );
              return (
                <section
                  key={item.id}
                  className="rounded-3xl border border-zinc-400/20 bg-zinc-500/[0.06] p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="inline-flex rounded-full border border-zinc-400/28 bg-zinc-400/10 px-2.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-zinc-100/90">
                      Инсулин
                    </p>
                    <p className="shrink-0 tabular-nums text-[0.72rem] text-white/55">
                      {formatUtcIsoForUserDisplay(item.occurredAt, settings.timezone, {
                        dateStyle: "medium",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-white/72">
                    {INSULIN_ENTRY_TYPE_LABEL_RU[item.data.entry_type]}
                  </p>
                  {item.data.insulin_name ? (
                    <p className="mt-1 text-lg font-semibold text-white">
                      {item.data.insulin_name}
                    </p>
                  ) : null}
                  <p className="mt-1 text-sm text-white/84">
                    {item.data.units} ед.
                  </p>
                  {noteForDisplay ? (
                    <p className="mt-2 border-t border-white/10 pt-2 text-sm text-white/72">
                      {noteForDisplay}
                    </p>
                  ) : null}
                </section>
              );
                  })}
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
