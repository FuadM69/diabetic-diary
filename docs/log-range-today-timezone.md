# “Сегодня” / `today` log range — timezone

## Root cause (fixed)

The lower bound for **`today`** used to be **start of the current UTC calendar day**. Stored timestamps are UTC ISO strings, so a reading taken “yesterday evening” in e.g. `Europe/Moscow` could still be **after** that UTC midnight and incorrectly appear under **today**.

## Current behavior

- **`today`** = first instant of the **current local calendar day** in the user’s **IANA timezone** from `user_settings.timezone` (e.g. `Europe/Moscow`), implemented in `src/lib/utils/log-range-bounds.ts`.
- If `timezone` is **null** or **invalid**, the app uses **`Intl.DateTimeFormat().resolvedOptions().timeZone`** (host/runtime default). On many serverless hosts this is **`UTC`**, so users who care about local “today” should set timezone in **Настройки**.

Rolling ranges **`7d` / `14d` / `30d`** are unchanged (milliseconds from `now`). **`all`** still means no lower bound.

## Where it applies

Glucose, insulin, export (page + CSV/PDF API), and the home dashboard “today” slice all pass `settings.timezone` into `getGlucoseRangeMeasuredAtLowerBound` / `getLogRangeMeasuredAtLowerBound`.

## Manual verification

Prerequisites: set **timezone** in settings to a zone you understand (e.g. `Europe/Moscow`).

1. Add a glucose entry with **date/time of measurement** just **before** local midnight (e.g. 23:50 “yesterday”).
2. Add another with **date/time** just **after** local midnight (“today”).
3. Open **Глюкоза**, choose **Сегодня**.

**Expected:** only the second entry appears. The first appears under **7 дн.** / **Всё**, not **Сегодня**.

Repeat the same idea for **Инсулин** and **Экспорт** with range **Сегодня** if those entry types are in scope.
