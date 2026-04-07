-- Starter public foods for first-run UX (modest catalog, not a medical DB).
-- Rows: is_public = true, created_by = null.
-- Idempotent: skips names that already exist as public catalog rows (same lower(name)).

INSERT INTO public.food_products (
  name,
  brand,
  carbs_per_100g,
  calories_per_100g,
  protein_per_100g,
  fat_per_100g,
  created_by,
  is_public
)
SELECT
  v.name,
  v.brand,
  v.carbs_per_100g,
  v.calories_per_100g,
  v.protein_per_100g,
  v.fat_per_100g,
  NULL::uuid,
  TRUE
FROM (
  VALUES
    -- name, brand, carbs, kcal, protein, fat (per 100g) — rounded typical values
    ('Apple', NULL::text, 14.0, 52, 0.3, 0.2),
    ('Banana', NULL::text, 23.0, 89, 1.1, 0.3),
    ('Bread (white)', NULL::text, 49.0, 265, 9.0, 3.2),
    ('Rice (white, cooked)', NULL::text, 28.0, 130, 2.7, 0.3),
    ('Oats (rolled, dry)', NULL::text, 66.0, 389, 17.0, 7.0),
    ('Milk (2%)', NULL::text, 4.9, 51, 3.3, 2.0),
    ('Yogurt (plain)', NULL::text, 4.5, 61, 3.5, 3.3),
    ('Potato (boiled)', NULL::text, 20.0, 87, 1.9, 0.1),
    ('Pasta (cooked)', NULL::text, 25.0, 131, 5.0, 1.1),
    ('Egg (whole)', NULL::text, 1.1, 143, 12.6, 9.5),
    ('Chicken breast (cooked)', NULL::text, 0.0, 165, 31.0, 3.6),
    ('Cheese (cheddar)', NULL::text, 1.3, 403, 23.0, 33.0),
    ('Tomato', NULL::text, 3.9, 18, 0.9, 0.2),
    ('Cucumber', NULL::text, 3.6, 15, 0.7, 0.1),
    ('Vegetable soup', NULL::text, 5.0, 35, 1.2, 0.8)
) AS v (
  name,
  brand,
  carbs_per_100g,
  calories_per_100g,
  protein_per_100g,
  fat_per_100g
)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.food_products fp
  WHERE fp.is_public = TRUE
    AND fp.created_by IS NULL
    AND lower(fp.name) = lower(v.name)
);
