"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import type { FoodProduct } from "@/lib/types/food";
import { MEAL_TYPE_KEYS, MEAL_TYPE_LABEL_RU } from "@/lib/types/meal";
import { createMealEntryAction, type MealActionResult } from "../actions";
import { FEEDBACK_ERROR } from "@/lib/ui/page-patterns";
import {
  MealItemsEditor,
  type MealItemEditorInitialRow,
} from "./meal-items-editor";

const initial: MealActionResult = {
  success: false,
  error: null,
};

const fieldClass =
  "w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-base text-white outline-none placeholder:text-white/40 focus:border-white/30 disabled:opacity-60";

const bolusLinkClass =
  "inline-flex w-full items-center justify-center rounded-2xl bg-white px-4 py-3 text-center text-sm font-medium text-black transition-opacity hover:opacity-90 sm:w-auto";

const journalLinkClass =
  "inline-flex w-full items-center justify-center rounded-2xl border border-white/20 px-4 py-3 text-center text-sm font-medium text-white/90 transition-colors hover:bg-white/5 sm:w-auto";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-65"
    >
      {pending ? "Сохранение…" : "Сохранить приём пищи"}
    </button>
  );
}

type MealFormProps = {
  products: FoodProduct[];
  formKey: string;
  /** From server render to avoid client `new Date()` hydration drift. */
  defaultEatenAt: string;
};

type MealDraftItem = {
  foodProductId: string;
  grams: string;
};

type MealCreateDraft = {
  eatenAt: string;
  mealType: string;
  note: string;
  items: MealDraftItem[];
};

const MEAL_CREATE_DRAFT_KEY = "meal_create_draft_v1";

function readMealDraft(): MealCreateDraft | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = sessionStorage.getItem(MEAL_CREATE_DRAFT_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<MealCreateDraft>;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    return {
      eatenAt: typeof parsed.eatenAt === "string" ? parsed.eatenAt : "",
      mealType: typeof parsed.mealType === "string" ? parsed.mealType : "breakfast",
      note: typeof parsed.note === "string" ? parsed.note : "",
      items:
        Array.isArray(parsed.items) ?
          parsed.items
            .map((it) => ({
              foodProductId:
                it && typeof it.foodProductId === "string" ? it.foodProductId : "",
              grams: it && typeof it.grams === "string" ? it.grams : "",
            }))
            .filter((it) => it.foodProductId !== "" || it.grams !== "")
        : [],
    };
  } catch {
    return null;
  }
}

function writeMealDraft(draft: MealCreateDraft): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    sessionStorage.setItem(MEAL_CREATE_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Ignore storage failures to keep create flow resilient.
  }
}

function clearMealDraft(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    sessionStorage.removeItem(MEAL_CREATE_DRAFT_KEY);
  } catch {
    // Ignore storage failures to keep create flow resilient.
  }
}

export function MealForm({ products, formKey, defaultEatenAt }: MealFormProps) {
  const fieldIds = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const eatenId = `${fieldIds}-eaten`;
  const mealTypeId = `${fieldIds}-meal-type`;
  const noteId = `${fieldIds}-note`;
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [eatenAt, setEatenAt] = useState(defaultEatenAt);
  const [mealType, setMealType] = useState("breakfast");
  const [note, setNote] = useState("");
  const [draftItems, setDraftItems] = useState<MealDraftItem[]>([]);

  const [state, formAction, isPending] = useActionState(
    async (_prev: MealActionResult, formData: FormData) =>
      createMealEntryAction(formData),
    initial
  );

  const showBolusNext =
    state.success &&
    state.createdMealId &&
    state.createdTotalCarbs != null;

  const bolusHref =
    showBolusNext ?
      `/bolus?${new URLSearchParams({
        carbs: String(state.createdTotalCarbs),
        mealId: state.createdMealId!,
        ...(state.createdMealEatenAtIso ?
          { mealTime: state.createdMealEatenAtIso }
        : {}),
      }).toString()}`
    : null;

  useEffect(() => {
    const draft = readMealDraft();
    if (draft) {
      setEatenAt(draft.eatenAt || defaultEatenAt);
      setMealType(draft.mealType || "breakfast");
      setNote(draft.note || "");
      setDraftItems(draft.items);
    } else {
      setEatenAt(defaultEatenAt);
      setMealType("breakfast");
      setNote("");
      setDraftItems([]);
    }
    setDraftLoaded(true);
  }, [defaultEatenAt, formKey]);

  useEffect(() => {
    if (state.success) {
      clearMealDraft();
    }
  }, [state.success]);

  const initialItems: MealItemEditorInitialRow[] | undefined =
    draftItems.length > 0 ?
      draftItems.map((it, idx) => ({
        key: `draft-${idx}`,
        foodProductId: it.foodProductId,
        grams: it.grams,
      }))
    : undefined;

  const syncDraftFromForm = () => {
    const form = formRef.current;
    if (!form || isPending || state.success) {
      return;
    }
    const fd = new FormData(form);
    const foodIds = fd.getAll("food_product_id").map((v) => String(v ?? "").trim());
    const gramsValues = fd.getAll("grams").map((v) => String(v ?? "").trim());
    const maxLen = Math.max(foodIds.length, gramsValues.length);
    const items: MealDraftItem[] = [];
    for (let i = 0; i < maxLen; i += 1) {
      const foodProductId = foodIds[i] ?? "";
      const grams = gramsValues[i] ?? "";
      if (foodProductId !== "" || grams !== "") {
        items.push({ foodProductId, grams });
      }
    }
    writeMealDraft({
      eatenAt: String(fd.get("eaten_at") ?? "").trim(),
      mealType: String(fd.get("meal_type") ?? "").trim() || "breakfast",
      note: String(fd.get("note") ?? ""),
      items,
    });
  };

  return (
    <form
      key={formKey}
      ref={formRef}
      action={formAction}
      className="space-y-5"
      onInput={syncDraftFromForm}
      onChange={syncDraftFromForm}
    >
      <p className="text-xs leading-relaxed text-white/45">
        После сохранения можно перейти к оценке болюса с подставленными углеводами.
        Глюкозу и итоговую дозу вы указываете и проверяете сами — запись в журнал
        инсулина не создаётся автоматически.
      </p>

      <div className="space-y-2">
        <label htmlFor={eatenId} className="block text-sm text-white/70">
          Когда съедено
        </label>
        <input
          id={eatenId}
          name="eaten_at"
          type="datetime-local"
          required
          value={eatenAt}
          onChange={(e) => setEatenAt(e.target.value)}
          disabled={isPending}
          className={`${fieldClass} min-w-0 w-full [color-scheme:dark]`}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor={mealTypeId} className="block text-sm text-white/70">
          Тип приёма
        </label>
        <select
          id={mealTypeId}
          name="meal_type"
          required
          disabled={isPending}
          value={mealType}
          onChange={(e) => setMealType(e.target.value)}
          className={fieldClass}
        >
          {MEAL_TYPE_KEYS.map((key) => (
            <option key={key} value={key}>
              {MEAL_TYPE_LABEL_RU[key]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor={noteId} className="block text-sm text-white/70">
          Комментарий
        </label>
        <textarea
          id={noteId}
          name="note"
          rows={2}
          disabled={isPending}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Необязательно"
          className={`${fieldClass} resize-none`}
        />
      </div>

      <MealItemsEditor
        products={products}
        disabled={isPending || !draftLoaded}
        initialItems={initialItems}
      />

      {state.error ? (
        <p role="alert" className={FEEDBACK_ERROR}>
          {state.error}
        </p>
      ) : null}

      {showBolusNext && bolusHref ? (
        <div
          className="space-y-3 rounded-2xl border border-emerald-500/35 bg-emerald-950/25 p-4"
          role="status"
        >
          <p className="text-sm leading-relaxed text-white/85">
            Приём пищи сохранён. В помощнике болюса уже подставлены углеводы (
            <span className="tabular-nums text-white">
              {state.createdTotalCarbs} г
            </span>
            ). Укажите глюкозу на момент приёма (в помощнике — только замеры не
            позже времени приёма) и проверьте дозу перед введением — приложение
            не записывает инсулин за вас.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Link href={bolusHref} className={bolusLinkClass} prefetch={false}>
              Рассчитать болюс
            </Link>
            <a href="#meal-journal" className={journalLinkClass}>
              Вернуться в журнал
            </a>
          </div>
        </div>
      ) : null}

      <SubmitButton />
    </form>
  );
}
