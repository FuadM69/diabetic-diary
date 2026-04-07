export const INSULIN_ENTRY_TYPES = ["basal", "bolus", "correction"] as const;

export type InsulinEntryType = (typeof INSULIN_ENTRY_TYPES)[number];

/** Row from `public.insulin_entries` (selected columns). */
export type InsulinEntry = {
  id: string;
  user_id: string;
  taken_at: string;
  insulin_name: string | null;
  entry_type: InsulinEntryType;
  units: number;
  note: string | null;
};
