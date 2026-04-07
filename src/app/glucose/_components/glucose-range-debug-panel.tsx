import type { LogRangeDebugPayload } from "@/lib/utils/log-range-bounds";

type GlucoseRangeDebugPanelProps = {
  payload: LogRangeDebugPayload;
};

/**
 * Server-only diagnostics (shown when `NODE_ENV === 'development'` or `DIARY_LOG_RANGE_DEBUG=1`).
 */
export function GlucoseRangeDebugPanel({ payload }: GlucoseRangeDebugPanelProps) {
  return (
    <section
      className="rounded-2xl border border-amber-500/40 bg-amber-950/40 p-4 text-left"
      aria-label="Отладка фильтра «Сегодня»"
    >
      <h2 className="text-sm font-medium text-amber-100">
        Отладка диапазона дат (только dev / DIARY_LOG_RANGE_DEBUG=1)
      </h2>
      <p className="mt-1 text-xs leading-snug text-amber-100/70">
        Сохранённый часовой пояс, фактически используемая зона, граница «сегодня» в UTC и
        measured_at загруженных записей.
      </p>
      <pre className="mt-3 max-h-[min(50vh,28rem)] overflow-auto whitespace-pre-wrap break-all text-[0.65rem] leading-relaxed text-amber-50/95">
        {JSON.stringify(payload, null, 2)}
      </pre>
    </section>
  );
}
