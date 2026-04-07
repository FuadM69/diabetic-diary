import { parseGlucoseEntryId } from "@/lib/utils/glucose";
import {
  INSULIN_ENTRY_TYPES,
  type InsulinEntryType,
} from "@/lib/types/insulin";

/** Upper bound for units (typical pump/pen diary). */
export const INSULIN_UNITS_MAX = 300;

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

function parseTakenAt(raw: FormDataEntryValue | null): string | null {
  if (raw === null || typeof raw !== "string") {
    return null;
  }
  const s = raw.trim();
  if (!s) {
    return null;
  }
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  return d.toISOString();
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

function parseInsulinFormFields(formData: FormData): ParseInsulinCreateFormResult {
  const takenAt = parseTakenAt(formData.get("taken_at"));
  if (!takenAt) {
    return {
      ok: false,
      message: "Укажите дату и время введения.",
    };
  }

  const typeParsed = parseEntryType(formData.get("entry_type"));
  if (!typeParsed.ok) {
    return { ok: false, message: typeParsed.message };
  }

  const unitsParsed = parseUnits(formData.get("units"));
  if (!unitsParsed.ok) {
    return { ok: false, message: unitsParsed.message };
  }

  return {
    ok: true,
    data: {
      taken_at: takenAt,
      entry_type: typeParsed.value,
      units: unitsParsed.value,
      insulin_name: normalizeOptionalText(formData.get("insulin_name")),
      note: normalizeOptionalText(formData.get("note")),
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
 */
export function parseInsulinQueryPrefill(
  raw: Record<string, string | string[] | undefined>
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
    units: String(unitsParsed.value),
    entry_type,
    note,
  };
}

/** Validate FormData for creating an insulin entry (server actions). */
export function parseInsulinCreateForm(
  formData: FormData
): ParseInsulinCreateFormResult {
  return parseInsulinFormFields(formData);
}

/** Validate FormData for updating an insulin entry (server actions). */
export function parseInsulinUpdateForm(
  formData: FormData
): ParseInsulinUpdateFormResult {
  const idParsed = parseGlucoseEntryId(formData.get("entryId"));
  if (!idParsed.ok) {
    return { ok: false, message: idParsed.message };
  }

  const rest = parseInsulinFormFields(formData);
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
