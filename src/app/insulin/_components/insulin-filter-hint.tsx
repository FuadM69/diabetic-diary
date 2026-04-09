"use client";

import { useState } from "react";
import type { GlucoseRangeKey } from "@/lib/types/glucose";

type InsulinFilterHintProps = {
  range: GlucoseRangeKey;
  rangeLabel: string;
  takenAtGteDisplay: string;
};

export function InsulinFilterHint({
  range,
  rangeLabel,
  takenAtGteDisplay,
}: InsulinFilterHintProps) {
  const storageKey = `diary:insulin-filter-hint-dismissed:${range}`;
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }
    try {
      return sessionStorage.getItem(storageKey) !== "1";
    } catch {
      return true;
    }
  });

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
        }}
        className="text-[0.65rem] text-white/40 underline decoration-white/20 underline-offset-2 hover:text-white/60"
      >
        Показать подсказку про фильтр
      </button>
    );
  }

  return (
    <div className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[0.7rem] leading-snug text-white/65">
      <p className="min-w-0 flex-1">
        Период «{rangeLabel}»: показаны введения не раньше{" "}
        <span className="tabular-nums text-white/80">{takenAtGteDisplay}</span>.
        Полный журнал — «Всё время».
      </p>
      <button
        type="button"
        aria-label="Скрыть подсказку"
        onClick={() => {
          try {
            sessionStorage.setItem(storageKey, "1");
          } catch {
            // ignore
          }
          setOpen(false);
        }}
        className="shrink-0 rounded-lg px-1.5 py-0.5 text-white/45 hover:bg-white/10 hover:text-white/75"
      >
        ×
      </button>
    </div>
  );
}
