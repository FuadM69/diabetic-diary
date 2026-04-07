"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  GlucoseChartPoint,
  GlucoseRangeKey,
  UserSettings,
} from "@/lib/types/glucose";
import {
  formatGlucoseDate,
  formatGlucoseValue,
  getGlucoseChartEmptyLabel,
  getGlucoseChartYDomain,
  GLUCOSE_CHART_STATUS_LABEL,
} from "@/lib/utils/glucose";

type GlucoseChartProps = {
  points: GlucoseChartPoint[];
  settings: UserSettings;
  range: GlucoseRangeKey;
  /** Shorter chart for dashboard preview */
  compact?: boolean;
};

/** Calm teal band + edges: readable on black, not competing with the glucose line. */
const TARGET_BAND_FILL = "rgba(45, 212, 191, 0.16)";
const TARGET_BAND_STROKE = "rgba(110, 231, 183, 0.32)";
const TARGET_EDGE_COLOR = "rgba(167, 243, 208, 0.42)";

const tickStyle = { fill: "rgba(255,255,255,0.52)", fontSize: 11 };
const axisLine = { stroke: "rgba(255,255,255,0.14)" };

export function GlucoseChart({
  points,
  settings,
  range,
  compact = false,
}: GlucoseChartProps) {
  const labelById = useMemo(
    () => new Map(points.map((p) => [p.id, p.shortLabel] as const)),
    [points]
  );

  const [yMin, yMax] = useMemo(
    () =>
      getGlucoseChartYDomain(
        points,
        settings.glucose_target_min,
        settings.glucose_target_max
      ),
    [points, settings.glucose_target_min, settings.glucose_target_max]
  );

  const bandLow = Math.min(
    settings.glucose_target_min,
    settings.glucose_target_max
  );
  const bandHigh = Math.max(
    settings.glucose_target_min,
    settings.glucose_target_max
  );

  if (points.length === 0) {
    return (
      <div
        className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-10 text-center text-sm text-white/50"
        role="status"
      >
        {getGlucoseChartEmptyLabel(range)}
      </div>
    );
  }

  const chartHeight = compact ? 176 : 248;

  const margin = compact
    ? { top: 8, right: 2, left: 0, bottom: 12 }
    : { top: 12, right: 4, left: 0, bottom: 16 };

  return (
    <div className="w-full touch-pan-y" style={{ height: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={margin}>
          {/* Target band behind grid so horizontal grid lines stay visible. */}
          <ReferenceArea
            y1={bandLow}
            y2={bandHigh}
            fill={TARGET_BAND_FILL}
            stroke={TARGET_BAND_STROKE}
            strokeWidth={1}
            ifOverflow="visible"
            zIndex={1}
          />
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <ReferenceLine
            y={bandLow}
            stroke={TARGET_EDGE_COLOR}
            strokeWidth={1}
            strokeDasharray="4 4"
            ifOverflow="extendDomain"
            zIndex={50}
          />
          <ReferenceLine
            y={bandHigh}
            stroke={TARGET_EDGE_COLOR}
            strokeWidth={1}
            strokeDasharray="4 4"
            ifOverflow="extendDomain"
            zIndex={50}
          />
          <XAxis
            dataKey="id"
            type="category"
            tick={{ ...tickStyle, fontSize: compact ? 10 : 11 }}
            tickLine={false}
            axisLine={axisLine}
            interval="preserveStartEnd"
            minTickGap={compact ? 18 : 24}
            tickMargin={6}
            tickFormatter={(id: string) => labelById.get(id) ?? ""}
          />
          <YAxis
            domain={[yMin, yMax]}
            tick={{ ...tickStyle, fontSize: compact ? 10 : 11 }}
            tickLine={false}
            axisLine={axisLine}
            width={compact ? 34 : 40}
            tickMargin={4}
            tickFormatter={(v) => String(v)}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) {
                return null;
              }
              const item = payload[0];
              const raw = item?.payload;
              if (!raw || typeof raw.value !== "number") {
                return null;
              }
              const p = raw as GlucoseChartPoint;
              return (
                <div className="max-w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-white/18 bg-neutral-950/97 px-3 py-2.5 text-sm shadow-xl backdrop-blur-md">
                  <p className="font-semibold tabular-nums text-white">
                    {formatGlucoseValue(p.value)}
                  </p>
                  <p className="mt-1 text-[0.8125rem] leading-snug text-white/70">
                    {formatGlucoseDate(p.measuredAt)}
                  </p>
                  <p className="mt-1 text-xs text-white/48">
                    {GLUCOSE_CHART_STATUS_LABEL[p.status]}
                  </p>
                </div>
              );
            }}
            cursor={{
              stroke: "rgba(255,255,255,0.2)",
              strokeWidth: 1,
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="rgb(245 245 245)"
            strokeWidth={2.25}
            dot={{
              r: compact ? 3.25 : 4,
              fill: "rgb(250 250 250)",
              strokeWidth: 0,
            }}
            activeDot={{ r: compact ? 5 : 6, fill: "white" }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
