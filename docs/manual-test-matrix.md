# Manual test matrix (v1 release)

Practical checks before shipping. Run on **at least one phone** (or narrow viewport) and **one desktop browser**. Mark each row when done.

**Environment, migrations, RLS:** see [`docs/release-checklist.md`](./release-checklist.md).

**Legend:** `[ ]` = not run · `[x]` = pass · Note failures in your issue tracker.

---

## Authentication

| # | Scenario | Expected | Done |
|---|----------|----------|------|
| A1 | **Sign up** (if enabled) | New user can register; lands in app or login as designed | [ ] |
| A2 | **Sign in** with valid credentials | Session established; redirect away from `/login` | [ ] |
| A3 | **Sign in** with invalid credentials | Clear error; no partial session | [ ] |
| A4 | **Sign out** (header button) | Redirect to login; protected URLs no longer accessible without signing in again | [ ] |
| A5 | Open **`/glucose`** (or `/settings`) while logged out | Redirect to **`/login`** (or equivalent) | [ ] |

---

## First-run onboarding

| # | Scenario | Expected | Done |
|---|----------|----------|------|
| O1 | **Dashboard** with no glucose data | Onboarding card: purpose, steps, CTAs (Настройки, Глюкоза, Еда, Болюс); «Другие разделы» without duplicating primary actions | [ ] |
| O2 | **Dashboard** after first glucose reading | Stats / chart / «Сегодня» appear; onboarding card hidden | [ ] |
| O3 | **Settings** intro | Explains targets vs bolus fields (коэффициент / чувствительность) | [ ] |
| O4 | **Glucose** list empty (`Всё время`) | Empty state + short guidance + CTA (e.g. к форме) | [ ] |
| O5 | **Meals** journal empty | Empty state + link to продукты | [ ] |
| O6 | **Insulin** list empty | Empty state + note that logging ≠ auto dose | [ ] |
| O7 | **Food** catalog (after DB seed) | Starter public products visible without search | [ ] |
| O8 | **Export** with zero rows in range | Calm «нечего выгружать» message; PDF/CSV cards disabled where designed | [ ] |

---

## Settings

| # | Scenario | Expected | Done |
|---|----------|----------|------|
| S1 | Save **valid** targets + optional carb ratio / ISF | Success message; values persist after refresh | [ ] |
| S2 | Submit **invalid** values (if server rejects) | Red error; no silent save | [ ] |
| S3 | Change **glucose_target_min / max** | Glucose list/card colors and **stats** (% in range) reflect new band | [ ] |
| S4 | Change targets | **Chart** target band (teal area / reference lines) matches new range | [ ] |
| S5 | Leave **carb_ratio** or **insulin_sensitivity** empty | Saves OK; **bolus helper** shows that calculation is unavailable until both filled | [ ] |

---

## Glucose

| # | Scenario | Expected | Done |
|---|----------|----------|------|
| G1 | **Create** reading (value + optional note) | Success feedback; row appears; form clears after save | [ ] |
| G2 | **Edit** reading (value / note) | Updates in list; dialog closes | [ ] |
| G3 | **Delete** reading | Row removed | [ ] |
| G4 | **Range** filter (Сегодня / 7д / … / Всё) | List + chart + stats scoped to period; empty state if none | [ ] |
| G5 | **Chart** with several points | Line renders; **target band** visible | [ ] |
| G6 | **Stats** (avg, min, max, % in range) | Match visible data for selected range | [ ] |
| G7 | **Source / note** in UI & export | `source` (e.g. manual) and `note` stored; CSV columns populated (not placeholders) | [ ] |

---

## Food

| # | Scenario | Expected | Done |
|---|----------|----------|------|
| F1 | **Starter** public products | Listed without needing user-created rows (after migration) | [ ] |
| F2 | **Search** (`q`) | Filters list; empty search shows full catalog again | [ ] |
| F3 | **Create private** product | Appears for you; `is_public` behavior per app (private by default) | [ ] |
| F4 | **Visibility** | You see public + your own; another user (if testable) does not see your private products as theirs | [ ] |

---

## Meals

| # | Scenario | Expected | Done |
|---|----------|----------|------|
| M1 | **Create meal** with items | Saves; appears in journal | [ ] |
| M2 | **Meal items** (grams + product) | **Carbs / calories** totals consistent with per-100g math | [ ] |
| M3 | **Empty** journal | Empty state + guidance | [ ] |
| M4 | **Meal → bolus** link on card | Opens `/bolus?carbs=…&mealId=…`; carbs prefilled; user still enters glucose and confirms estimate | [ ] |

---

## Bolus helper

| # | Scenario | Expected | Done |
|---|----------|----------|------|
| B1 | **Valid** carb ratio + ISF + glucose + carbs | Estimate shows meal + correction + total | [ ] |
| B2 | **Missing** ratio or ISF | Clear message + link/settings callout; no fake numbers | [ ] |
| B3 | **Prefill** from meal URL | Carbs (and meal context for insulin note) applied; banner that link prefilled | [ ] |
| B4 | **Prefill latest glucose** button | Fills glucose field when reading exists | [ ] |
| B5 | After estimate | **No automatic** insulin row; only optional link to insulin form | [ ] |

---

## Insulin

| # | Scenario | Expected | Done |
|---|----------|----------|------|
| I1 | **Create** entry | Appears in list; success feedback | [ ] |
| I2 | **Edit** entry | Updates correctly | [ ] |
| I3 | **Delete** entry | Removed | [ ] |
| I4 | **Range** filter | List matches period | [ ] |
| I5 | **Bolus prefill** from helper | `/insulin?units=…&entry_type=bolus&note=…#insulin-add` opens form with draft; **submit** still required to save | [ ] |

---

## Export

| # | Scenario | Expected | Done |
|---|----------|----------|------|
| E1 | **CSV glucose** (with data) | Downloads; UTF-8 readable; columns include value, **source**, **note** | [ ] |
| E2 | **CSV insulin** | Correct columns and RU labels where applicable | [ ] |
| E3 | **CSV meals** | Totals per meal row | [ ] |
| E4 | **Combined CSV** | `dataset` column distinguishes rows | [ ] |
| E5 | **PDF** (with data) | Opens/downloads; sections + tables; Cyrillic OK (fonts present) | [ ] |
| E6 | **No data** for range | Disabled cards and/or messaging; no crash | [ ] |

---

## Mobile UX

| # | Scenario | Expected | Done |
|---|----------|----------|------|
| U1 | **Bottom nav** | All primary links tappable; active state correct; no overlap with home indicator | [ ] |
| U2 | **Safe areas** | Header/footer clear notch / home bar (`env(safe-area-inset-*)`) | [ ] |
| U3 | **Anchors** `#add-glucose`, `#add-meal`, `#insulin-add` | Target section visible (not hidden under sticky header) | [ ] |
| U4 | **Edit glucose dialog** | Usable on ~375px width; scroll if tall; bottom padding acceptable | [ ] |
| U5 | **PWA** | Manifest loads; icons present; «Add to Home Screen» opens app (smoke) | [ ] |

---

## Release blockers

**Do not release v1 if any of these are broken:**

1. **Authentication** — cannot sign in/out reliably, or protected data visible while logged out.
2. **RLS / data isolation** — user A can read or write user B’s glucose, meals, insulin, or settings (spot-check in Supabase + app).
3. **Core CRUD** — cannot **create**, **edit**, or **delete** glucose, meals, or insulin where the UI promises it (persistent errors or data loss).
4. **Export** — CSV or PDF returns wrong user’s data, or **500** for normal «happy path» with data and fonts deployed.
5. **Mobile navigation** — bottom nav unusable on a common phone size, or main flows unreachable.
6. **Glucose range logic** — stats/chart/list clearly disagree with selected period or target band (logic bug).

Non-blockers for v1 if called out in docs: legacy **`/history`** / **`/calculator`** (localStorage-only), PDF dependency on shipped font files, same-tab localStorage refresh quirks.

---

## Quick smoke (5 minutes)

- [ ] Log in → add glucose → see dashboard update  
- [ ] Settings save → bolus works or blocks clearly  
- [ ] One meal → bolus prefill → optional insulin draft → save insulin  
- [ ] Export CSV + PDF once  

---

*Last aligned with app areas: auth, onboarding, settings, glucose, food, meals, bolus, insulin, export, mobile shell. Adjust rows if a feature is removed or renamed.*
