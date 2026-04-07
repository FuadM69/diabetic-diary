/**
 * Optional URL prefill for /bolus (form init only; not trusted as stored data).
 */
import { formatBolusDose } from "@/lib/utils/bolus";
import { GLUCOSE_INPUT_MAX } from "@/lib/utils/glucose";
import { INSULIN_NOTE_PREFILL_MAX } from "@/lib/utils/insulin-form";

/** Reasonable upper bound for "carbs this meal" in the helper (g). */
const BOLUS_PREFILL_CARBS_MAX = 2000;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type BolusUrlPrefill = {
  /** Initial field value for carbs (may be empty). */
  carbs: string;
  /** Initial field value for glucose (may be empty = user fills or uses latest). */
  glucose: string;
  /** Optional meal id from journal (for note / context only). */
  linkedMealId: string | null;
};

function firstQueryValue(
  v: string | string[] | undefined
): string | undefined {
  if (v === undefined) {
    return undefined;
  }
  return Array.isArray(v) ? v[0] : v;
}

function parseOptionalCarbs(raw: string | undefined): string {
  if (raw === undefined) {
    return "";
  }
  const s = raw.trim();
  if (!s) {
    return "";
  }
  const n = Number.parseFloat(s.replace(",", "."));
  if (
    !Number.isFinite(n) ||
    n < 0 ||
    n > BOLUS_PREFILL_CARBS_MAX
  ) {
    return "";
  }
  return String(n);
}

function parseOptionalGlucose(raw: string | undefined): string {
  if (raw === undefined) {
    return "";
  }
  const s = raw.trim();
  if (!s) {
    return "";
  }
  const n = Number.parseFloat(s.replace(",", "."));
  if (
    !Number.isFinite(n) ||
    n <= 0 ||
    n > GLUCOSE_INPUT_MAX
  ) {
    return "";
  }
  return String(n);
}

function parseOptionalMealId(raw: string | undefined): string | null {
  if (raw === undefined) {
    return null;
  }
  const t = raw.trim();
  if (!t || !UUID_RE.test(t)) {
    return null;
  }
  return t;
}

/**
 * Reads `carbs`, `glucose`, `mealId` from Next.js searchParams.
 * Invalid numbers are ignored (empty string); invalid meal id ignored.
 */
export function parseBolusUrlPrefill(
  raw: Record<string, string | string[] | undefined>
): BolusUrlPrefill {
  return {
    carbs: parseOptionalCarbs(firstQueryValue(raw.carbs)),
    glucose: parseOptionalGlucose(firstQueryValue(raw.glucose)),
    linkedMealId: parseOptionalMealId(firstQueryValue(raw.mealId)),
  };
}

export function hasBolusUrlPrefill(p: BolusUrlPrefill): boolean {
  return (
    p.carbs.length > 0 ||
    p.glucose.length > 0 ||
    p.linkedMealId != null
  );
}

/** Note for insulin journal when user chooses to log the estimate (non-authoritative). */
export function buildInsulinNoteFromBolusContext(params: {
  totalBolus: number;
  linkedMealId: string | null;
}): string {
  let s = `Болюс по оценке помощника: ${formatBolusDose(params.totalBolus)} УЕ. Проверьте дозу перед введением.`;
  if (params.linkedMealId) {
    s += " Связано с приёмом пищи из журнала.";
  }
  return s.slice(0, INSULIN_NOTE_PREFILL_MAX);
}

export function buildInsulinPrefillHref(params: {
  totalBolus: number;
  linkedMealId: string | null;
}): string {
  const note = buildInsulinNoteFromBolusContext(params);
  const q = new URLSearchParams();
  q.set("units", String(params.totalBolus));
  q.set("entry_type", "bolus");
  if (note.length > 0) {
    q.set("note", note);
  }
  return `/insulin?${q.toString()}#insulin-add`;
}
