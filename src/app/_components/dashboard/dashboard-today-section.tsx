import Link from "next/link";
import type { GlucoseEntry, GlucoseStats } from "@/lib/types/glucose";
import { formatUtcIsoForUserDisplay } from "@/lib/utils/datetime-local-tz";
import { formatGlucoseValue } from "@/lib/utils/glucose";

type DashboardTodaySectionProps = {
  latest: GlucoseEntry;
  todayStats: GlucoseStats;
  userTimezone: string | null;
};

export function DashboardTodaySection({
  latest,
  todayStats,
  userTimezone,
}: DashboardTodaySectionProps) {
  const readingsToday = todayStats.isEmpty ? 0 : todayStats.totalCount;

  return (
    <section className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-white/45">
            Сегодня
          </p>
          {readingsToday === 0 ? (
            <p className="mt-2 text-sm leading-relaxed text-white/55">
              Пока нет замеров за сегодня.{" "}
              <Link
                href="/glucose#add-glucose"
                className="text-white/75 underline decoration-white/25 underline-offset-2"
              >
                Добавить замер
              </Link>
            </p>
          ) : (
            <>
              <p className="mt-2 tabular-nums text-2xl font-semibold text-white">
                {todayStats.average}
                <span className="ml-1 text-sm font-normal text-white/50">
                  в среднем
                </span>
              </p>
              <p className="mt-1 text-xs text-white/45">
                {readingsToday}{" "}
                {readingsToday === 1 ? "замер" : "замеров"} за сегодня
              </p>
            </>
          )}
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-white/45">
            Последний замер
          </p>
          <p className="mt-2 tabular-nums text-2xl font-semibold text-white">
            {formatGlucoseValue(latest.glucose_value)}
          </p>
          <p className="mt-1 text-xs text-white/50">
            {formatUtcIsoForUserDisplay(latest.measured_at, userTimezone, {
              dateStyle: "medium",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })}
          </p>
        </div>
      </div>
    </section>
  );
}
