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

/** Substrings that must not match inside longer words (e.g. «руккола» contains «кола»). */
const DRINK_KEYWORDS_WHOLE_TOKEN = new Set([
  "drink",
  "сок",
  "чай",
  "коф",
  "кола",
]);

function escapeForUnicodePropertyClass(s: string): string {
  return s.replace(/[\^$\\.*+?()[\]{}|]/g, "\\$&");
}

/**
 * True if `keyword` appears as its own token — not as a substring of a longer letter run
 * (Latin or Cyrillic letters).
 */
function wholeLetterTokenHasKeyword(text: string, keyword: string): boolean {
  const k = escapeForUnicodePropertyClass(keyword.toLowerCase());
  const re = new RegExp(`(?<![\\p{L}])${k}(?![\\p{L}])`, "iu");
  return re.test(text);
}

function hasDrinkKeyword(value: string): boolean {
  const t = value.trim().toLowerCase();
  if (!t) {
    return false;
  }
  for (const keyword of DRINK_KEYWORDS) {
    if (DRINK_KEYWORDS_WHOLE_TOKEN.has(keyword)) {
      if (wholeLetterTokenHasKeyword(t, keyword)) {
        return true;
      }
    } else if (t.includes(keyword)) {
      return true;
    }
  }
  return false;
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
