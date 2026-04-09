-- Optional time-of-day bolus settings (additive, nullable).
-- Keeps existing single-ratio behavior intact via app-level fallback.

ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS carb_ratio_morning double precision,
  ADD COLUMN IF NOT EXISTS carb_ratio_day double precision,
  ADD COLUMN IF NOT EXISTS carb_ratio_evening double precision,
  ADD COLUMN IF NOT EXISTS carb_ratio_night double precision,
  ADD COLUMN IF NOT EXISTS insulin_sensitivity_morning double precision,
  ADD COLUMN IF NOT EXISTS insulin_sensitivity_day double precision,
  ADD COLUMN IF NOT EXISTS insulin_sensitivity_evening double precision,
  ADD COLUMN IF NOT EXISTS insulin_sensitivity_night double precision;
