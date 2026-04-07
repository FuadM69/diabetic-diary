-- Aligns schema with app: glucose_entries.source/note and meal_items.user_id + RLS.
-- Intended to run once per environment; uses IF NOT EXISTS / DROP IF EXISTS where practical.

-- -----------------------------------------------------------------------------
-- 1) glucose_entries: source (default 'manual'), note (nullable)
-- -----------------------------------------------------------------------------
ALTER TABLE public.glucose_entries
  ADD COLUMN IF NOT EXISTS source text;

ALTER TABLE public.glucose_entries
  ADD COLUMN IF NOT EXISTS note text;

UPDATE public.glucose_entries
SET source = 'manual'
WHERE source IS NULL OR trim(source) = '';

ALTER TABLE public.glucose_entries
  ALTER COLUMN source SET DEFAULT 'manual';

ALTER TABLE public.glucose_entries
  ALTER COLUMN source SET NOT NULL;

-- -----------------------------------------------------------------------------
-- 2) meal_items.user_id: nullable column → backfill → drop bad rows → NOT NULL → FK
-- -----------------------------------------------------------------------------
ALTER TABLE public.meal_items
  ADD COLUMN IF NOT EXISTS user_id uuid;

UPDATE public.meal_items mi
SET user_id = me.user_id
FROM public.meal_entries me
WHERE mi.meal_entry_id = me.id
  AND mi.user_id IS NULL;

-- Defensive: remove items whose meal row is missing (cannot infer owner).
DELETE FROM public.meal_items mi
WHERE NOT EXISTS (
  SELECT 1 FROM public.meal_entries e WHERE e.id = mi.meal_entry_id
);

DELETE FROM public.meal_items WHERE user_id IS NULL;

ALTER TABLE public.meal_items
  ALTER COLUMN user_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'meal_items_user_id_fkey'
      AND conrelid = 'public.meal_items'::regclass
  ) THEN
    ALTER TABLE public.meal_items
      ADD CONSTRAINT meal_items_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS meal_items_user_id_idx ON public.meal_items (user_id);

-- -----------------------------------------------------------------------------
-- 3) RLS: glucose_entries + meal_items (owner = auth.uid())
-- -----------------------------------------------------------------------------
ALTER TABLE public.glucose_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "glucose_entries_select_own" ON public.glucose_entries;
DROP POLICY IF EXISTS "glucose_entries_insert_own" ON public.glucose_entries;
DROP POLICY IF EXISTS "glucose_entries_update_own" ON public.glucose_entries;
DROP POLICY IF EXISTS "glucose_entries_delete_own" ON public.glucose_entries;

CREATE POLICY "glucose_entries_select_own"
  ON public.glucose_entries FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "glucose_entries_insert_own"
  ON public.glucose_entries FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "glucose_entries_update_own"
  ON public.glucose_entries FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "glucose_entries_delete_own"
  ON public.glucose_entries FOR DELETE
  USING (user_id = auth.uid());

ALTER TABLE public.meal_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "meal_items_all_own" ON public.meal_items;

CREATE POLICY "meal_items_all_own"
  ON public.meal_items FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
