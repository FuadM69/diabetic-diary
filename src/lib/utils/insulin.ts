import type { GlucoseRangeKey } from "@/lib/types/glucose";
import type { InsulinEntryType } from "@/lib/types/insulin";

export function formatInsulinUnits(units: number): string {
  if (!Number.isFinite(units)) {
    return "—";
  }
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(units);
}

export const INSULIN_ENTRY_TYPE_LABEL_RU: Record<InsulinEntryType, string> = {
  basal: "Базальный",
  bolus: "Болюс",
  correction: "Коррекция",
};

export function getInsulinListEmptyMessage(
  range: GlucoseRangeKey
): { title: string; description?: string } {
  if (range === "all") {
    return {
      title: "Пока нет записей об инсулине.",
      description:
        "Здесь учёт введений (базальный, болюс, коррекция). Добавьте первую запись в форме выше — это только журнал, не автоматическая доза.",
    };
  }
  return {
    title: "Нет записей за выбранный период.",
    description: "Смените период или добавьте введение — форма на этой странице.",
  };
}
