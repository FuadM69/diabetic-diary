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

## Production debugging (why “yesterday” could still show as “today”)

1. **`UTC+3` / `GMT+3` in settings**  
   V8/Node **`Intl` does not accept** strings like `UTC+3` as `timeZone` (it throws). The UI previously suggested that form; the app now **maps** `UTC±N` / `GMT±N` to fixed-offset IANA ids **`Etc/GMT∓N`** (sign inverted per IANA rules), e.g. `UTC+3` → `Etc/GMT-3` (same offset as `Europe/Moscow` when MSK is +3).

2. **Silent fallback to the host zone**  
   Any other invalid saved string still falls back to **`resolvedOptions().timeZone`** (often **`UTC`** on Netlify). Debug output shows `resolution: "host_fallback"` when that happens.

3. **`measured_at` / `eaten_at` / `taken_at` from `datetime-local` on the server**  
   Previously, parsing used **`new Date(string)`**, which follows the **server** zone. That skewed stored UTC vs the user’s intent. **Current behavior:** `src/lib/utils/datetime-local-tz.ts` interprets the form value as wall time in **`user_settings.timezone`** (IANA or mapped `UTC±N` → `Etc/GMT-*`), then converts to UTC ISO. Enable **`DIARY_LOG_RANGE_DEBUG=1`** to log each conversion: `datetimeLocal`, `timezoneUsed`, `storedUtcIso`.

## Temporary debug on `/glucose`

- **When:** `NODE_ENV === 'development'` **or** server env **`DIARY_LOG_RANGE_DEBUG=1`** (set in Netlify for a short window).
- **What:** A yellow **«Отладка диапазона дат»** block lists range, saved vs resolved timezone, `today` bound ISO, query `measured_at` lower bound, and all loaded `measured_at` values. Server logs: `[diary:log-range:glucose-page]` JSON and `[glucose][getGlucoseEntries] .gte(measured_at, bound)`.
