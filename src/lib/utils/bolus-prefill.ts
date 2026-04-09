/**
 * Optional URL prefill for /bolus (form init only; not trusted as stored data).
 */
import { formatBolusDose } from "@/lib/utils/bolus";
import { GLUCOSE_INPUT_MAX } from "@/lib/utils/glucose";
import {
  INSULIN_NOTE_PREFILL_MAX,
  roundInsulinPrefillUnits,
} from "@/lib/utils/insulin-form";

/** Reasonable upper bound for "carbs this meal" in the helper (g). */
const BOLUS_PREFILL_CARBS_MAX = 2000;

/** Postgres / Supabase `uuid`; do not restrict RFC version bits — strict patterns dropped valid ids and broke meal-linked bolus. */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type BolusUrlPrefill = {
  /** Initial field value for carbs (may be empty). */
  carbs: string;
  /** Initial field value for glucose (may be empty = user fills or uses latest). */
  glucose: string;
  /** Optional meal id from journal (for note / context only). */
  linkedMealId: string | null;
  /**
   * Optional meal `eaten_at` (UTC ISO) from the journal link — anchors glucose “at or before”
   * when the id is present, even if the row is not in the recent list.
   */
  linkedMealTimeIso: string | null;
};

const LINKED_MEAL_NOTE_MARKER_PREFIX = "[meal:";
const LINKED_MEAL_NOTE_MARKER_SUFFIX = "]";

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

/** `mealTime` query: must parse to a finite instant (UTC ISO round-trip). */
function parseOptionalMealTimeIso(raw: string | undefined): string | null {
  if (raw === undefined) {
    return null;
  }
  const t = raw.trim();
  if (!t) {
    return null;
  }
  const ms = Date.parse(t);
  if (!Number.isFinite(ms)) {
    return null;
  }
  return new Date(ms).toISOString();
}

/**
 * Reads `carbs`, `glucose`, `mealId`, `mealTime` from Next.js searchParams.
 * Invalid numbers are ignored (empty string); invalid meal id ignored.
 */
export function parseBolusUrlPrefill(
  raw: Record<string, string | string[] | undefined>
): BolusUrlPrefill {
  return {
    carbs: parseOptionalCarbs(firstQueryValue(raw.carbs)),
    glucose: parseOptionalGlucose(firstQueryValue(raw.glucose)),
    linkedMealId: parseOptionalMealId(firstQueryValue(raw.mealId)),
    linkedMealTimeIso: parseOptionalMealTimeIso(firstQueryValue(raw.mealTime)),
  };
}

export function hasBolusUrlPrefill(p: BolusUrlPrefill): boolean {
  return (
    p.carbs.length > 0 ||
    p.glucose.length > 0 ||
    p.linkedMealId != null ||
    p.linkedMealTimeIso != null
  );
}

/** Note for insulin journal when user chooses to log the estimate (non-authoritative). */
export function buildInsulinNoteFromBolusContext(params: {
  totalBolus: number;
  linkedMealId: string | null;
}): string {
  let s = `Болюс по оценке помощника: ${formatBolusDose(params.totalBolus)} УЕ. Проверьте дозу перед введением.`;
  if (params.linkedMealId && UUID_RE.test(params.linkedMealId)) {
    const marker = `${LINKED_MEAL_NOTE_MARKER_PREFIX}${params.linkedMealId}${LINKED_MEAL_NOTE_MARKER_SUFFIX}`;
    const markerSuffix = ` ${marker}`;
    const maxBase = Math.max(0, INSULIN_NOTE_PREFILL_MAX - markerSuffix.length);
    s = s.slice(0, maxBase);
    s += markerSuffix;
  }
  return s.slice(0, INSULIN_NOTE_PREFILL_MAX);
}

export function extractLinkedMealIdFromInsulinNote(
  note: string | null | undefined
): string | null {
  if (!note || typeof note !== "string") {
    return null;
  }
  const m = note.match(/\[meal:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\]/i);
  if (!m) {
    return null;
  }
  const id = m[1];
  return UUID_RE.test(id) ? id : null;
}

const MEAL_MARKER_IN_NOTE_RE =
  /\s*\[meal:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\]/gi;

export function stripLinkedMealMarkerFromInsulinNote(
  note: string | null | undefined
): string | null {
  if (!note || typeof note !== "string") {
    return null;
  }
  const cleaned = note
    .replace(MEAL_MARKER_IN_NOTE_RE, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return cleaned.length > 0 ? cleaned : null;
}

export function buildInsulinPrefillHref(params: {
  totalBolus: number;
  linkedMealId: string | null;
}): string {
  const note = buildInsulinNoteFromBolusContext(params);
  const q = new URLSearchParams();
  q.set("units", String(roundInsulinPrefillUnits(params.totalBolus)));
  q.set("entry_type", "bolus");
  q.set("flow", "bolus");
  if (params.linkedMealId) {
    q.set("fromMeal", "1");
  }
  if (note.length > 0) {
    q.set("note", note);
  }
  return `/insulin?${q.toString()}#insulin-add`;
}
