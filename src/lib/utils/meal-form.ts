import type {
  MealCreateInput,
  MealCreateItemInput,
  MealTypeKey,
} from "@/lib/types/meal";
import { datetimeLocalInUserTimezoneToUtcIso } from "@/lib/utils/datetime-local-tz";
import { MEAL_TYPE_KEYS } from "@/lib/types/meal";

export type ParseMealFormResult =
  | { ok: true; data: MealCreateInput }
  | { ok: false; message: string };

export type MealUpdateParsed = MealCreateInput & { mealEntryId: string };

export type ParseMealUpdateFormResult =
  | { ok: true; data: MealUpdateParsed }
  | { ok: false; message: string };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MAX_ITEMS = 40;
const GRAMS_MAX = 20_000;
const NOTE_MAX = 500;

function parseEatenAt(
  raw: FormDataEntryValue | null,
  savedTimezone: string | null
): { ok: true; iso: string } | { ok: false; message: string } {
  return datetimeLocalInUserTimezoneToUtcIso(raw, savedTimezone, {
    empty: "Укажите дату и время приёма пищи.",
    invalidFormat: "Некорректная дата или время.",
  });
}

function parseMealType(
  raw: FormDataEntryValue | null
): { ok: true; value: MealTypeKey } | { ok: false; message: string } {
  if (raw === null || typeof raw !== "string") {
    return { ok: false, message: "Выберите тип приёма пищи." };
  }
  const v = raw.trim() as MealTypeKey;
  if (!MEAL_TYPE_KEYS.includes(v)) {
    return { ok: false, message: "Некорректный тип приёма пищи." };
  }
  return { ok: true, value: v };
}

function parseNote(
  raw: FormDataEntryValue | null
): { ok: true; value: string | null } | { ok: false; message: string } {
  if (raw === null || typeof raw !== "string") {
    return { ok: true, value: null };
  }
  const s = raw.trim();
  if (s === "") {
    return { ok: true, value: null };
  }
  if (s.length > NOTE_MAX) {
    return {
      ok: false,
      message: `Комментарий слишком длинный (макс. ${NOTE_MAX} символов).`,
    };
  }
  return { ok: true, value: s };
}

function isUuid(id: string): boolean {
  return UUID_RE.test(id);
}

/** Validates meal id from FormData (edit/delete). */
export function parseMealEntryId(
  raw: FormDataEntryValue | null
): { ok: true; mealEntryId: string } | { ok: false; message: string } {
  if (raw === null || typeof raw !== "string") {
    return { ok: false, message: "Не указан приём пищи." };
  }
  const id = raw.trim();
  if (!id || !isUuid(id)) {
    return { ok: false, message: "Не указан приём пищи." };
  }
  return { ok: true, mealEntryId: id };
}

function parseMealItemsAndMeta(
  formData: FormData,
  savedTimezone: string | null
): ParseMealFormResult {
  const eaten = parseEatenAt(formData.get("eaten_at"), savedTimezone);
  if (!eaten.ok) {
    return { ok: false, message: eaten.message };
  }

  const mt = parseMealType(formData.get("meal_type"));
  if (!mt.ok) {
    return { ok: false, message: mt.message };
  }

  const noteP = parseNote(formData.get("note"));
  if (!noteP.ok) {
    return { ok: false, message: noteP.message };
  }

  const idList = formData
    .getAll("food_product_id")
    .filter((v): v is string => typeof v === "string");
  const gramList = formData
    .getAll("grams")
    .filter((v): v is string => typeof v === "string");

  if (idList.length !== gramList.length) {
    return {
      ok: false,
      message: "Заполните продукт и вес в каждой строке или удалите лишнюю.",
    };
  }

  const items: MealCreateItemInput[] = [];

  for (let i = 0; i < idList.length; i++) {
    const pid = idList[i].trim();
    const gRaw = gramList[i].trim();

    if (pid === "" && gRaw === "") {
      continue;
    }

    if (pid === "" || gRaw === "") {
      return {
        ok: false,
        message: `Строка ${i + 1}: укажите и продукт, и вес (граммы).`,
      };
    }

    if (!isUuid(pid)) {
      return {
        ok: false,
        message: `Строка ${i + 1}: неверный идентификатор продукта.`,
      };
    }

    const grams = Number.parseFloat(gRaw);
    if (!Number.isFinite(grams)) {
      return {
        ok: false,
        message: `Строка ${i + 1}: вес должен быть числом.`,
      };
    }

    if (grams <= 0) {
      return {
        ok: false,
        message: `Строка ${i + 1}: вес должен быть больше нуля.`,
      };
    }

    if (grams > GRAMS_MAX) {
      return {
        ok: false,
        message: `Строка ${i + 1}: вес слишком большой (макс. ${GRAMS_MAX} г).`,
      };
    }

    items.push({ food_product_id: pid, grams });
  }

  if (items.length === 0) {
    return {
      ok: false,
      message: "Добавьте хотя бы один продукт и укажите вес в граммах.",
    };
  }

  if (items.length > MAX_ITEMS) {
    return {
      ok: false,
      message: `Слишком много позиций (макс. ${MAX_ITEMS}).`,
    };
  }

  return {
    ok: true,
    data: {
      eaten_at: eaten.iso,
      meal_type: mt.value,
      note: noteP.value,
      items,
    },
  };
}

export function parseMealCreationForm(
  formData: FormData,
  savedTimezone: string | null
): ParseMealFormResult {
  return parseMealItemsAndMeta(formData, savedTimezone);
}

export function parseMealUpdateForm(
  formData: FormData,
  savedTimezone: string | null
): ParseMealUpdateFormResult {
  const idParsed = parseMealEntryId(formData.get("mealEntryId"));
  if (!idParsed.ok) {
    return { ok: false, message: idParsed.message };
  }

  const body = parseMealItemsAndMeta(formData, savedTimezone);
  if (!body.ok) {
    return body;
  }

  return {
    ok: true,
    data: {
      mealEntryId: idParsed.mealEntryId,
      ...body.data,
    },
  };
}
