import type { FoodProduct } from "@/lib/types/food";

export const DRINK_NAME_PREFIX = "[drink] ";

const DRINK_KEYWORDS = [
  "drink",
  "напит",
  "сок",
  "чай",
  "коф",
  "молок",
  "кефир",
  "йогурт пить",
  "лимонад",
  "кола",
  "вода",
  "морс",
  "компот",
  "энергет",
];

function hasDrinkKeyword(value: string): boolean {
  const t = value.trim().toLowerCase();
  if (!t) {
    return false;
  }
  return DRINK_KEYWORDS.some((keyword) => t.includes(keyword));
}

export function isDrinkName(name: string): boolean {
  const normalized = name.trim().toLowerCase();
  if (normalized.startsWith(DRINK_NAME_PREFIX.trim())) {
    return true;
  }
  return hasDrinkKeyword(normalized);
}

export function isDrinkProduct(product: Pick<FoodProduct, "name" | "brand">): boolean {
  if (isDrinkName(product.name)) {
    return true;
  }
  return product.brand ? hasDrinkKeyword(product.brand) : false;
}

export function getDisplayProductName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.toLowerCase().startsWith(DRINK_NAME_PREFIX.trim())) {
    return trimmed.slice(DRINK_NAME_PREFIX.length).trim();
  }
  return trimmed;
}

export function withDrinkMarker(name: string, isDrink: boolean): string {
  const clean = getDisplayProductName(name);
  if (!isDrink) {
    return clean;
  }
  return `${DRINK_NAME_PREFIX}${clean}`;
}
