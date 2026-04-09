import Link from "next/link";
import { FEEDBACK_ERROR } from "@/lib/ui/page-patterns";
import type { BolusEstimate } from "@/lib/utils/bolus";
import { formatBolusDose } from "@/lib/utils/bolus";
import { formatGlucoseValue } from "@/lib/utils/glucose";

type BolusResultCardProps = {
  estimate: BolusEstimate | null;
  /** Validation / other user-facing message */
  message: string | null;
  /** Opens /insulin with prefilled draft; user must still submit the form. */
  insulinPrefillHref?: string | null;
};

const rowClass =
  "flex items-baseline justify-between gap-3 border-b border-white/10 py-2.5 last:border-b-0";

export function BolusResultCard({
  estimate,
  message,
  insulinPrefillHref = null,
}: BolusResultCardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
      <h2 className="text-sm font-medium text-white/85">Оценка болюса</h2>
      <p className="mt-1 text-xs leading-snug text-white/45">
        Ориентир по вашим настройкам. Настоящую дозу подтверждайте сами (врач /
        инструкция / опыт). Это не назначение лечения.
      </p>

      {message ? (
        <p className={`mt-3 ${FEEDBACK_ERROR}`} role="alert">
          {message}
        </p>
      ) : null}

      {estimate && !message ? (
        <>
          <p className="mt-3 text-xs text-emerald-200/85" role="status">
            Статус: шаг 1 из 3 — оценка рассчитана.
          </p>
          <dl className="mt-2 text-sm">
          <div className={rowClass}>
            <dt className="text-white/55">Цель для коррекции</dt>
            <dd className="tabular-nums font-medium text-white">
              {formatGlucoseValue(estimate.targetGlucose)}
            </dd>
          </div>
          <div className={rowClass}>
            <dt className="text-white/55">Болюс на еду</dt>
            <dd className="tabular-nums text-lg font-semibold text-white">
              {formatBolusDose(estimate.mealBolus)} ед.
            </dd>
          </div>
          <div className={rowClass}>
            <dt className="text-white/55">Коррекция</dt>
            <dd className="tabular-nums text-lg font-semibold text-white">
              {formatBolusDose(estimate.correctionBolus)} ед.
            </dd>
          </div>
          <div className={`${rowClass} border-b-0 pt-1`}>
            <dt className="font-medium text-white/75">Итого (оценка)</dt>
            <dd className="tabular-nums text-xl font-semibold text-white">
              {formatBolusDose(estimate.totalBolus)} ед.
            </dd>
          </div>
          </dl>
        </>
      ) : null}

      {estimate && !message && estimate.totalBolus <= 0 ? (
        <p className="mt-3 text-xs text-white/40">
          Нулевая оценка — перенос в журнал инсулина здесь не предлагается.
        </p>
      ) : null}

      {insulinPrefillHref ? (
        <div className="mt-4 border-t border-white/10 pt-4">
          <p className="text-xs leading-relaxed text-white/45">
            Журнал инсулина не меняется сам. Ниже — только черновик для
            записи: вы сами подтверждаете дозу и время перед сохранением.
          </p>
          <Link
            href={insulinPrefillHref}
            className="mt-3 flex w-full items-center justify-center rounded-2xl border border-white/20 bg-white/[0.06] px-4 py-3 text-center text-sm font-medium text-white/90 transition-colors hover:border-white/30 hover:bg-white/[0.09]"
            prefetch={false}
          >
            Шаг 2: перенести в форму инсулина…
          </Link>
          <p className="mt-2 text-center text-[0.65rem] text-white/35">
            Это действие лишь открывает форму с подставленными полями, не
            назначение лечения.
          </p>
        </div>
      ) : null}
    </div>
  );
}
