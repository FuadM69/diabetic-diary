-- Insulin dose rounding step for pen/pump (UI + prefill). App default 0.5 U if column missing (older envs).

ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS insulin_dose_step double precision;

UPDATE public.user_settings
SET insulin_dose_step = 0.5
WHERE insulin_dose_step IS NULL;

ALTER TABLE public.user_settings
  ALTER COLUMN insulin_dose_step SET DEFAULT 0.5;
