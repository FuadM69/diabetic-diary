import Link from "next/link";
import { FEEDBACK_ERROR } from "@/lib/ui/page-patterns";
import type { BolusEstimate } from "@/lib/utils/bolus";
import { formatBolusDose } from "@/lib/utils/bolus";
import {
  formatInsulinDoseStepRu,
  insulinPrefillUnitsOrFallback,
  type InsulinDoseStep,
} from "@/lib/utils/insulin-dose-step";
import { formatGlucoseValue } from "@/lib/utils/glucose";

type BolusResultCardProps = {
  estimate: BolusEstimate | null;
  /** Validation / other user-facing message */
  message: string | null;
  /** Opens /insulin with prefilled draft; user must still submit the form. */
  insulinPrefillHref?: string | null;
  glucoseTargetMin: number;
  glucoseTargetMax: number;
  doseStep: InsulinDoseStep;
};

const rowClass =
  "flex items-baseline justify-between gap-3 border-b border-white/10 py-2.5 last:border-b-0";

export function BolusResultCard({
  estimate,
  message,
  insulinPrefillHref = null,
  glucoseTargetMin,
  glucoseTargetMax,
  doseStep,
}: BolusResultCardProps) {
  const totalRounded =
    estimate ?
      insulinPrefillUnitsOrFallback(estimate.totalBolus, doseStep)
    : 0;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
      <h2 className="text-sm font-medium text-white/85">Оценка болюса</h2>

      {message ? (
        <p className={`mt-3 ${FEEDBACK_ERROR}`} role="alert">
          {message}
        </p>
      ) : null}

      {estimate && !message ? (
        <>
          <div
            className="mt-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.08] px-4 py-3"
            role="status"
          >
            <p className="text-[0.65rem] font-medium uppercase tracking-wide text-emerald-100/80">
              Итого — к вводу
            </p>
            <p className="mt-1 tabular-nums text-3xl font-semibold tracking-tight text-white">
              {formatBolusDose(totalRounded)}{" "}
              <span className="text-lg font-medium text-white/55">ед.</span>
            </p>
            <p className="mt-2 tabular-nums text-sm text-white/45">
              расчёт без округления:{" "}
              <span className="text-white/55">
                {formatBolusDose(estimate.totalBolus)} ед.
              </span>
              {" · шаг "}
              <span className="text-white/55">
                {formatInsulinDoseStepRu(doseStep)}
              </span>
            </p>
            <p className="mt-1 text-[0.7rem] leading-snug text-white/40">
              Округление до {formatInsulinDoseStepRu(doseStep)} — ближайший шаг
              на сетке; в форму инсулина подставляется практическая доза.
            </p>
          </div>

          <p className="mt-2 text-[0.7rem] text-emerald-200/80" role="status">
            Шаг 1 из 3 — оценка рассчитана.
          </p>

          <dl className="mt-3 text-sm">
            <div className={rowClass}>
              <dt className="text-white/55">Болюс на еду</dt>
              <dd className="tabular-nums font-medium text-white">
                {formatBolusDose(estimate.mealBolus)} ед.
              </dd>
            </div>
            <div className={rowClass}>
              <dt className="text-white/55">Коррекция</dt>
              <dd className="tabular-nums font-medium text-white">
                {formatBolusDose(estimate.correctionBolus)} ед.
              </dd>
            </div>
            <div className={rowClass}>
              <dt className="text-white/55">Итого (расчёт)</dt>
              <dd className="tabular-nums font-medium text-white">
                {formatBolusDose(estimate.totalBolus)} ед.
              </dd>
            </div>
            <div className={`${rowClass} border-b-0`}>
              <dt className="text-white/55">Цель коррекции</dt>
              <dd className="text-right text-sm leading-snug text-white/80">
                <span className="tabular-nums">
                  {formatGlucoseValue(glucoseTargetMin)}–
                  {formatGlucoseValue(glucoseTargetMax)}
                </span>
                <span className="block text-xs text-white/45">
                  сейчас для расчёта взято{" "}
                  <span className="tabular-nums text-white/55">
                    {formatGlucoseValue(estimate.targetGlucose)}
                  </span>
                </span>
              </dd>
            </div>
          </dl>

          <details className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[0.7rem] leading-snug text-white/50">
            <summary className="cursor-pointer text-white/60">
              Оценка по вашим коэффициентам (не назначение лечения)
            </summary>
            <p className="mt-2">
              Ориентир по сохранённым настройкам. Итоговую дозу подтверждаете вы;
              при сомнениях обратитесь к врачу.
            </p>
          </details>
        </>
      ) : null}

      {estimate && !message && estimate.totalBolus <= 0 ? (
        <p className="mt-3 text-xs text-white/40">
          Итог расчёта 0 ед. — перенос в журнал инсулина здесь не
          предлагается.
        </p>
      ) : null}

      {insulinPrefillHref ? (
        <div className="mt-4 border-t border-white/10 pt-4">
          <Link
            href={insulinPrefillHref}
            className="flex w-full items-center justify-center rounded-2xl border border-white/20 bg-white/[0.06] px-4 py-3 text-center text-sm font-medium text-white/90 transition-colors hover:border-white/30 hover:bg-white/[0.09]"
            prefetch={false}
          >
            Шаг 2: перенести в форму инсулина…
          </Link>
          <details className="mt-2 text-[0.65rem] text-white/40">
            <summary className="cursor-pointer text-white/45">
              Про журнал инсулина
            </summary>
            <p className="mt-1.5 leading-relaxed">
              Запись в журнал не создаётся автоматически — только черновик в
              форме, который вы сохраняете сами.
            </p>
          </details>
        </div>
      ) : null}
    </div>
  );
}
