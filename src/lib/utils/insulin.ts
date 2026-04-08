import type { GlucoseRangeKey } from "@/lib/types/glucose";
import type { InsulinEntryType } from "@/lib/types/insulin";
import { INSULIN_ENTRY_TYPES } from "@/lib/types/insulin";
import { explainLogRangeTimeZone } from "@/lib/utils/log-range-bounds";

const ENTRY_TYPE_SET = new Set<string>(INSULIN_ENTRY_TYPES);

/**
 * Normalize `entry_type` from Supabase/Postgres (casing or driver quirks) so UI
 * maps (`TYPE_PRESENTATION`, labels) always resolve.
 */
export function normalizeInsulinEntryType(
  raw: unknown
): InsulinEntryType | null {
  if (typeof raw !== "string") {
    return null;
  }
  const v = raw.trim().toLowerCase();
  return ENTRY_TYPE_SET.has(v) ? (v as InsulinEntryType) : null;
}

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

/**
 * Short caption for the insulin datetime-local field: which timezone interprets the digits.
 */
export function getInsulinTakenAtTimezoneCaption(
  savedTimezone: string | null | undefined
): string {
  const info = explainLogRangeTimeZone(savedTimezone);
  if (!info.savedTrimmed) {
    return `Часовой пояс не задан в настройках — дата и время переводятся в хранилище как «${info.resolvedTimeZone}». Задайте пояс в профиле, чтобы совпадало с вашим местным временем.`;
  }
  if (info.resolution === "saved_iana") {
    return `Эта дата и время — в поясе из настроек профиля: ${info.resolvedTimeZone}.`;
  }
  if (info.resolution === "mapped_utc_offset") {
    return `Пояс из настроек (${info.savedTrimmed}) сохраняется как ${info.resolvedTimeZone} — так и трактуется поле ниже.`;
  }
  return `Пояс в настройках не распознан; сейчас используется «${info.resolvedTimeZone}». Укажите IANA (например, Europe/Moscow) в профиле.`;
}

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
    description:
      "Смените период, откройте «всё время» или добавьте введение выше. Если вы только что сохранили введение с датой вне этого периода, оно уже в журнале — переключите фильтр, чтобы увидеть его.",
  };
}
