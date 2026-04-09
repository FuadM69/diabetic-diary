import { extractLinkedMealIdFromInsulinNote } from "@/lib/utils/bolus-prefill";
import { datetimeLocalInUserTimezoneToUtcIso } from "@/lib/utils/datetime-local-tz";
import { insulinNoteWithOptionalMealLink } from "@/lib/utils/insulin-meal-link-note";
import { parseGlucoseEntryId } from "@/lib/utils/glucose";
import {
  INSULIN_ENTRY_TYPES,
  type InsulinEntryType,
} from "@/lib/types/insulin";
import {
  DEFAULT_INSULIN_DOSE_STEP,
  insulinPrefillUnitsOrFallback,
  roundInsulinDoseToStep,
  type InsulinDoseStep,
} from "@/lib/utils/insulin-dose-step";

export type { InsulinDoseStep };

/** Upper bound for units (typical pump/pen diary). */
export const INSULIN_UNITS_MAX = 300;

/**
 * Server-only: set `INSULIN_DEBUG=1` in `.env.local` (restart dev server).
 * Logs FormData → parsed payload → DB insert (user_id, entry_type, taken_at UTC).
 * Does not log secrets; safe for staging. Remove or unset when done.
 */
export function isInsulinDebugLogEnabled(): boolean {
  return process.env.INSULIN_DEBUG === "1";
}

/** Rounds prefilled units to the user’s pen/pump step (default 0,5 ед.). */
export function roundInsulinPrefillUnits(
  totalBolus: number,
  step: InsulinDoseStep = DEFAULT_INSULIN_DOSE_STEP
): number {
  return roundInsulinDoseToStep(totalBolus, step);
}

const ENTRY_TYPE_SET = new Set<string>(INSULIN_ENTRY_TYPES);

export type InsulinFormParsed = {
  taken_at: string;
  entry_type: InsulinEntryType;
  units: number;
  insulin_name: string | null;
  note: string | null;
};

export type InsulinUpdateFormParsed = InsulinFormParsed & {
  entryId: string;
};

export type ParseInsulinCreateFormResult =
  | { ok: true; data: InsulinFormParsed }
  | { ok: false; message: string };

export type ParseInsulinUpdateFormResult =
  | { ok: true; data: InsulinUpdateFormParsed }
  | { ok: false; message: string };

function normalizeOptionalText(
  raw: FormDataEntryValue | null
): string | null {
  if (raw === null || typeof raw !== "string") {
    return null;
  }
  const t = raw.trim();
  return t.length > 0 ? t : null;
}

function parseTakenAt(
  raw: FormDataEntryValue | null,
  savedTimezone: string | null
): { ok: true; iso: string } | { ok: false; message: string } {
  return datetimeLocalInUserTimezoneToUtcIso(raw, savedTimezone, {
    empty: "Укажите дату и время введения.",
    invalidFormat: "Некорректная дата или время.",
  });
}

/**
 * Shared validation for FormData and URL/query prefills (same bounds as submit).
 */
export function parseInsulinUnitsString(str: string):
  | { ok: true; value: number }
  | { ok: false; message: string } {
  const trimmed = str.trim();
  if (!trimmed) {
    return { ok: false, message: "Укажите количество единиц." };
  }
  const value = Number.parseFloat(trimmed.replace(",", "."));
  if (!Number.isFinite(value)) {
    return { ok: false, message: "Введите корректное число для единиц." };
  }
  if (value <= 0) {
    return { ok: false, message: "Количество единиц должно быть больше нуля." };
  }
  if (value > INSULIN_UNITS_MAX) {
    return {
      ok: false,
      message: `Слишком большое значение (не более ${INSULIN_UNITS_MAX} ед.).`,
    };
  }
  return { ok: true, value };
}

function parseUnits(raw: FormDataEntryValue | null):
  | { ok: true; value: number }
  | { ok: false; message: string } {
  if (raw === null || typeof raw !== "string") {
    return { ok: false, message: "Укажите количество единиц." };
  }
  return parseInsulinUnitsString(raw);
}

function parseEntryType(raw: FormDataEntryValue | null):
  | { ok: true; value: InsulinEntryType }
  | { ok: false; message: string } {
  if (raw === null || typeof raw !== "string") {
    return { ok: false, message: "Выберите тип введения." };
  }
  const v = raw.trim();
  if (!ENTRY_TYPE_SET.has(v)) {
    return { ok: false, message: "Некорректный тип введения." };
  }
  return { ok: true, value: v as InsulinEntryType };
}

function parseInsulinFormFields(
  formData: FormData,
  savedTimezone: string | null
): ParseInsulinCreateFormResult {
  const takenP = parseTakenAt(formData.get("taken_at"), savedTimezone);
  if (!takenP.ok) {
    return { ok: false, message: takenP.message };
  }

  const typeParsed = parseEntryType(formData.get("entry_type"));
  if (!typeParsed.ok) {
    return { ok: false, message: typeParsed.message };
  }

  const unitsParsed = parseUnits(formData.get("units"));
  if (!unitsParsed.ok) {
    return { ok: false, message: unitsParsed.message };
  }

  const noteBody = normalizeOptionalText(formData.get("note"));
  const linkRaw = formData.get("linked_meal_id");
  const linkFromField =
    typeof linkRaw === "string" && linkRaw.trim().length > 0 ?
      linkRaw.trim()
    : null;
  const linkFromNote =
    noteBody != null ? extractLinkedMealIdFromInsulinNote(noteBody) : null;
  const linkedMealId = linkFromField ?? linkFromNote;
  const note = insulinNoteWithOptionalMealLink(noteBody, linkedMealId);

  return {
    ok: true,
    data: {
      taken_at: takenP.iso,
      entry_type: typeParsed.value,
      units: unitsParsed.value,
      insulin_name: normalizeOptionalText(formData.get("insulin_name")),
      note,
    },
  };
}

/** Max note length when accepting prefilled text from URL (defensive). */
export const INSULIN_NOTE_PREFILL_MAX = 450;

export type InsulinQueryPrefill = {
  units: string;
  entry_type: InsulinEntryType;
  note: string;
};

function firstQueryValue(
  v: string | string[] | undefined
): string | undefined {
  if (v === undefined) {
    return undefined;
  }
  return Array.isArray(v) ? v[0] : v;
}

/**
 * Safe query-only prefill for /insulin. Does not persist; values must pass
 * the same unit checks as the form on submit.
 * `doseStep` should be the signed-in user’s шаг дозы из настроек — тот же
 * сетка, что при построении ссылок из болюса/глюкозы/калькулятора.
 */
export function parseInsulinQueryPrefill(
  raw: Record<string, string | string[] | undefined>,
  doseStep: InsulinDoseStep = DEFAULT_INSULIN_DOSE_STEP
): InsulinQueryPrefill | null {
  const unitsRaw = firstQueryValue(raw.units)?.trim();
  if (!unitsRaw) {
    return null;
  }

  const unitsParsed = parseInsulinUnitsString(unitsRaw);
  if (!unitsParsed.ok) {
    return null;
  }

  const typeRaw = firstQueryValue(raw.entry_type)?.trim();
  let entry_type: InsulinEntryType = "bolus";
  if (typeRaw && ENTRY_TYPE_SET.has(typeRaw)) {
    entry_type = typeRaw as InsulinEntryType;
  }

  const noteRaw = firstQueryValue(raw.note);
  let note = "";
  if (typeof noteRaw === "string" && noteRaw.trim().length > 0) {
    note = noteRaw.trim().slice(0, INSULIN_NOTE_PREFILL_MAX);
  }

  return {
    units: String(
      insulinPrefillUnitsOrFallback(unitsParsed.value, doseStep)
    ),
    entry_type,
    note,
  };
}

/** Validate FormData for creating an insulin entry (server actions). */
export function parseInsulinCreateForm(
  formData: FormData,
  savedTimezone: string | null
): ParseInsulinCreateFormResult {
  return parseInsulinFormFields(formData, savedTimezone);
}

/** Validate FormData for updating an insulin entry (server actions). */
export function parseInsulinUpdateForm(
  formData: FormData,
  savedTimezone: string | null
): ParseInsulinUpdateFormResult {
  const idParsed = parseGlucoseEntryId(formData.get("entryId"));
  if (!idParsed.ok) {
    return { ok: false, message: idParsed.message };
  }

  const rest = parseInsulinFormFields(formData, savedTimezone);
  if (!rest.ok) {
    return rest;
  }

  return {
    ok: true,
    data: {
      ...rest.data,
      entryId: idParsed.entryId,
    },
  };
}
