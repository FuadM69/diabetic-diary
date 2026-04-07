# Supabase schema (developer reference)

The repo includes SQL migrations under `supabase/migrations/`. Apply them with the Supabase CLI or paste into the SQL editor (in order). The app expects the **final** shapes below.

## Tables and app selects

| Table | Columns the app selects (representative) | TypeScript |
|-------|------------------------------------------|------------|
| `glucose_entries` | `id, user_id, glucose_value, measured_at, source, note` | `GlucoseEntry` |
| `food_products` | `id, name, brand, carbs_per_100g, calories_per_100g, protein_per_100g, fat_per_100g, created_by, is_public` | `FoodProduct` |
| `meal_entries` | `id, user_id, eaten_at, meal_type, note` | `MealEntryRow` / `MealEntryWithItems` |
| `meal_items` | `id, user_id, meal_entry_id, food_product_id, grams, carbs_total, calories_total` | `MealItemRow` |
| `insulin_entries` | `id, user_id, taken_at, insulin_name, entry_type, units, note` | `InsulinEntry` |
| `user_settings` | `glucose_target_min, glucose_target_max, carb_ratio, insulin_sensitivity, timezone` (keyed by `user_id`) | `UserSettings` |

## `glucose_entries`: `source` and `note`

- **`source`**: `text NOT NULL`, default `'manual'` (hand-entered readings use `manual`; other values are reserved for future sync/device sources).
- **`note`**: `text` nullable.
- Inserts and updates go through `src/lib/db/glucose.ts`; server actions parse optional note and source (`src/lib/utils/glucose.ts`). CSV export reads real `source` / `note` from rows (`src/lib/export/build-export-csv.ts`).

Canonical migration: `supabase/migrations/20260407120000_glucose_source_note_meal_items_user_id.sql`.

## `meal_items.user_id` and RLS

**Why `user_id` on each `meal_item` row:** Row-level security can use a single equality check (`auth.uid() = user_id`) without a subquery to `meal_entries` on every policy evaluation. That keeps policies simple, tends to perform better at scale, and matches how the app already scopes data by authenticated user. Each insert sets `user_id` to the same UUID as the parent `meal_entries.user_id`.

- Column: **`user_id uuid NOT NULL`**, FK to `auth.users(id)` **ON DELETE CASCADE** (`meal_items_user_id_fkey`).
- Index: **`meal_items_user_id_idx`** on `(user_id)`.
- **RLS**: enabled; policy **`meal_items_all_own`** — `FOR ALL` with `USING` / `WITH CHECK` `(user_id = auth.uid())`.

Application code: `createMealEntry` in `src/lib/db/meals.ts` includes `user_id` on every inserted item row.

Canonical migration: same file as glucose (`20260407120000_glucose_source_note_meal_items_user_id.sql`). The migration backfills `user_id` from `meal_entries`, deletes orphan items (no parent meal), then enforces NOT NULL and the FK.

## `glucose_entries` RLS

Enabled; split policies (names used in migration):

- `glucose_entries_select_own` — SELECT, `user_id = auth.uid()`
- `glucose_entries_insert_own` — INSERT, `WITH CHECK (user_id = auth.uid())`
- `glucose_entries_update_own` — UPDATE, `USING` + `WITH CHECK` `user_id = auth.uid()`
- `glucose_entries_delete_own` — DELETE, `user_id = auth.uid()`

If you added extra policies manually, reconcile or drop duplicates so behavior stays predictable.

## `food_products` filter

Reads use `.or(\`is_public.eq.true,created_by.eq.${userId}\`)`. Always pass the authenticated user’s UUID from Supabase Auth, never raw client-supplied IDs for authorization.

## Starter public food catalog

A small **idempotent** seed ships in `supabase/migrations/20260407140000_starter_food_products.sql`.

- Inserts modest “starter” rows with `is_public = true` and `created_by = null` (typical macros per 100g; not clinical-grade data).
- **Re-runs are safe:** each name is inserted only if no existing **public catalog** row already matches `lower(name)` with `created_by IS NULL`. Private/user rows (`created_by = user id`, `is_public = false`) are ignored by that check, so users are not blocked from keeping their own products.
- After migration, `/food` search and meal/bolus pickers show these alongside user-created entries (existing queries already include `is_public`).

**Extending the catalog later:** add another migration (same `INSERT … SELECT … WHERE NOT EXISTS` pattern), use the Supabase SQL editor for one-off public rows, or let users add private products in the app (still `is_public = false` by default).

## Other tables (not fully duplicated here)

`meal_entries`, `insulin_entries`, and `user_settings` should follow the same ownership pattern: **`user_id = auth.uid()`** on RLS. The migration in this repo only defines policies for `glucose_entries` and `meal_items`; configure `meal_entries` / `insulin_entries` / `user_settings` / `food_products` in Supabase if not already present.

Example sketches (verify names and combine with your existing policies):

```sql
-- meal_entries
create policy "meal_entries_own"
  on public.meal_entries for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- insulin_entries
create policy "insulin_entries_own"
  on public.insulin_entries for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- user_settings
create policy "user_settings_own"
  on public.user_settings for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- food_products: public read + own write (example)
create policy "food_products_read"
  on public.food_products for select
  using (is_public = true or created_by = auth.uid());

create policy "food_products_insert_own"
  on public.food_products for insert
  with check (created_by = auth.uid());
```

Test with the SQL editor and a real JWT; policies are starting points for development, not legal or medical advice.
