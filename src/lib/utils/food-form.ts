import type { FoodProductInsert } from "@/lib/types/food";

export type ParseFoodProductFormResult =
  | { ok: true; data: FoodProductInsert }
  | { ok: false; message: string };

const NAME_MAX = 200;
const BRAND_MAX = 120;
const NUTRITION_MAX = 1000;

function parseRequiredName(
  raw: FormDataEntryValue | null
): { ok: true; value: string } | { ok: false; message: string } {
  if (raw === null || typeof raw !== "string") {
    return { ok: false, message: "Введите название продукта." };
  }
  const s = raw.trim();
  if (s === "") {
    return { ok: false, message: "Введите название продукта." };
  }
  if (s.length > NAME_MAX) {
    return {
      ok: false,
      message: `Название слишком длинное (макс. ${NAME_MAX} символов).`,
    };
  }
  return { ok: true, value: s };
}

function parseOptionalBrand(
  raw: FormDataEntryValue | null
): { ok: true; value: string | null } | { ok: false; message: string } {
  if (raw === null || typeof raw !== "string") {
    return { ok: true, value: null };
  }
  const s = raw.trim();
  if (s === "") {
    return { ok: true, value: null };
  }
  if (s.length > BRAND_MAX) {
    return {
      ok: false,
      message: `Бренд слишком длинный (макс. ${BRAND_MAX} символов).`,
    };
  }
  return { ok: true, value: s };
}

function parseNutritionField(
  raw: FormDataEntryValue | null,
  label: string
): { ok: true; value: number } | { ok: false; message: string } {
  if (raw === null || typeof raw !== "string") {
    return { ok: false, message: `Укажите «${label}».` };
  }
  const s = raw.trim();
  if (s === "") {
    return { ok: false, message: `Укажите «${label}».` };
  }
  const n = Number.parseFloat(s);
  if (!Number.isFinite(n)) {
    return { ok: false, message: `«${label}» должно быть числом.` };
  }
  if (n < 0) {
    return { ok: false, message: `«${label}» не может быть отрицательным.` };
  }
  if (n > NUTRITION_MAX) {
    return {
      ok: false,
      message: `«${label}» слишком большое (макс. ${NUTRITION_MAX}).`,
    };
  }
  return { ok: true, value: n };
}

export function parseFoodProductForm(
  formData: FormData
): ParseFoodProductFormResult {
  const nameP = parseRequiredName(formData.get("name"));
  if (!nameP.ok) {
    return { ok: false, message: nameP.message };
  }

  const brandP = parseOptionalBrand(formData.get("brand"));
  if (!brandP.ok) {
    return { ok: false, message: brandP.message };
  }

  const carbsP = parseNutritionField(
    formData.get("carbs_per_100g"),
    "Углеводы на 100 г"
  );
  if (!carbsP.ok) {
    return { ok: false, message: carbsP.message };
  }

  const calP = parseNutritionField(
    formData.get("calories_per_100g"),
    "Ккал на 100 г"
  );
  if (!calP.ok) {
    return { ok: false, message: calP.message };
  }

  const protP = parseNutritionField(
    formData.get("protein_per_100g"),
    "Белки на 100 г"
  );
  if (!protP.ok) {
    return { ok: false, message: protP.message };
  }

  const fatP = parseNutritionField(formData.get("fat_per_100g"), "Жиры на 100 г");
  if (!fatP.ok) {
    return { ok: false, message: fatP.message };
  }

  return {
    ok: true,
    data: {
      name: nameP.value,
      brand: brandP.value,
      carbs_per_100g: carbsP.value,
      calories_per_100g: calP.value,
      protein_per_100g: protP.value,
      fat_per_100g: fatP.value,
    },
  };
}
