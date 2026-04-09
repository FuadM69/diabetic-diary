import { stripLinkedMealMarkerFromInsulinNote } from "@/lib/utils/bolus-prefill";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Same cap as bolus prefill / insulin notes (`INSULIN_NOTE_PREFILL_MAX`). */
const INSULIN_NOTE_STORAGE_MAX = 450;

/**
 * Re-appends internal `[meal:uuid]` for storage after the user edits the visible note only.
 */
export function insulinNoteWithOptionalMealLink(
  body: string | null,
  linkedMealId: string | null | undefined
): string | null {
  if (!linkedMealId || !UUID_RE.test(linkedMealId)) {
    return body;
  }
  const marker = ` [meal:${linkedMealId}]`;
  const baseRaw = stripLinkedMealMarkerFromInsulinNote(body) ?? body;
  const base = baseRaw != null ? baseRaw.trim() : "";
  let combined = base.length > 0 ? `${base}${marker}` : marker.trim();
  if (combined.length <= INSULIN_NOTE_STORAGE_MAX) {
    return combined.length > 0 ? combined : null;
  }
  const maxBase = Math.max(0, INSULIN_NOTE_STORAGE_MAX - marker.length);
  const trimmedBase = base.slice(0, maxBase).trimEnd();
  combined =
    trimmedBase.length > 0 ? `${trimmedBase}${marker}` : marker.trim();
  return combined.length > 0 ? combined : null;
}
