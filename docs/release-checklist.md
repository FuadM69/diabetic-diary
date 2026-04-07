# Release checklist (Дневник диабетика)

Short checklist before shipping or tagging a release.

**Step-by-step scenarios:** see [`docs/manual-test-matrix.md`](./manual-test-matrix.md). **Commands:** `npm run lint`, `npm run typecheck`, `npm run build`.

## Environment

- [ ] `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` set (e.g. Netlify / Vercel project env).
- [ ] `.env.local` present for local dev; **never** commit secrets.

## Supabase Auth

- [ ] Email/password (or chosen provider) enabled.
- [ ] Site URL / redirect URLs include production and preview origins (e.g. Netlify `https://<site>.netlify.app`).
- [ ] Session cookies work over HTTPS in production.

## Schema and migrations

- [ ] Tables exist: `glucose_entries`, `food_products`, `meal_entries`, `meal_items`, `insulin_entries`, `user_settings`.
- [ ] Run repo migrations in order — include `20260407120000_…` (glucose/meals columns & RLS) and `20260407140000_starter_food_products.sql` (starter catalog).
- [ ] Column names match app selects (see `docs/supabase-schema-notes.md`).

## RLS verification

- [ ] RLS enabled on all user data tables.
- [ ] Unauthenticated client cannot read/write another user’s rows (spot-check in Supabase **Table Editor** with RLS on).
- [ ] `meal_items` uses owner rows: `user_id` populated and policy `user_id = auth.uid()` (see schema notes).
- [ ] Export APIs **`/api/export/csv`** and **`/api/export/pdf`** return data only for the logged-in user (server `getUser()` + scoped queries).

## Code quality (before tag)

- [ ] `npm run lint` — same as `eslint src --max-warnings 0`.
- [ ] `npm run typecheck` — same as `tsc --noEmit`.
- [ ] `npm run build` — Next.js production build completes (includes typecheck).

## Build and deploy (e.g. Netlify)

- [ ] `npm run build` passes locally.
- [ ] Production build on CI/hosting succeeds.
- [ ] Middleware / Edge: cookies + Supabase SSR refresh behave on the deployed domain.

## Known non-blocking limitations (v1)

- **`/history` and `/calculator` (legacy):** use browser `localStorage`, not Supabase. The timeline / settings refresh on `storage` events (e.g. another tab) and on remount; **writes in the same tab** may not update the UI until navigation or refresh. Main app flows use the server-backed journals (`/glucose`, `/meals`, `/insulin`).
- **PDF export:** requires `src/lib/export/fonts/NotoSans-*.ttf` in the deployed artifact; missing fonts return 500 from `/api/export/pdf`.

## PWA

- [ ] App manifest loads at **`/manifest.webmanifest`** (from `src/app/manifest.ts`).
- [ ] Icons `public/icon-192.png`, `public/icon-512.png`, `public/apple-icon.png` present.
- [ ] On a real phone: “Add to Home Screen” opens in standalone or browser as expected; theme/safe areas acceptable.

## Export

- [ ] Log in, open `/export`, pick range, download glucose / insulin / meals / all CSV.
- [ ] Download PDF report when there is data: `/api/export/pdf?range=…` (linked from the page). Repo must include `src/lib/export/fonts/NotoSans-Regular.ttf` and `NotoSans-Bold.ttf` (Noto Sans, OFL) for Cyrillic.
- [ ] Open CSV in Excel / LibreOffice: encoding readable (UTF‑8 BOM), columns as expected.

## First-user flow (mobile)

- [ ] Register or log in on a narrow viewport (375px or real device).
- [ ] On **Главная**, onboarding card and links work; **«Другие разделы»** does not crowd primary CTAs.
- [ ] Deep links **`#add-glucose`**, **`#add-meal`**, **`#insulin-add`**: target section scrolls into view and is not fully hidden under the sticky header (`scroll-mt-24` on those blocks).
- [ ] Add first glucose reading; form clears after save (server `formKey` from `entries.length`).
- [ ] Add meal: time defaults from server; form resets after save via `formKey`.
- [ ] Bottom nav: all five primary links tappable, active state correct, no overlap with home indicator (main uses `env(safe-area-inset-bottom)` padding).
- [ ] **Изменить** on a glucose card: dialog scrolls on small height; safe-area bottom padding acceptable.
- [ ] `/settings` save shows success copy; errors show red feedback.
- [ ] `/bolus` shows estimate only after button; missing carb/ISF shows clear callout + link to settings.
- [ ] `/export`: CSV/PDF when data exists; empty-period copy when counts are zero.

## Smoke tests (optional but useful)

- [ ] Create meal with products; totals match expectations.
- [ ] Insulin create / edit / delete for current range.
- [ ] Glucose chart shows target band for a few points.

## Documentation

- [ ] `docs/supabase-schema-notes.md` updated if schema diverges from this checklist.
