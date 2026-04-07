"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";

type DiabetesSettings = {
  breadUnitGrams: string;
  insulinBreakfastRatio: string;
  insulinLunchRatio: string;
  insulinDinnerRatio: string;
  insulinNightRatio: string;
  insulinSensitivityFactor: string;
  targetGlucoseMin: string;
  targetGlucoseMax: string;
  recommendationsEnabled: boolean;
};

type Product = {
  id: string;
  name: string;
  caloriesPer100g: string;
  proteinPer100g: string;
  fatPer100g: string;
  carbsPer100g: string;
  createdAt: string;
};

type MealItem = {
  id: string;
  productId: string;
  productName: string;
  grams: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  xe: number;
};

type SavedMeal = {
  id: string;
  createdAt: string;
  items: MealItem[];
  totalCalories: number;
  totalProtein: number;
  totalFat: number;
  totalCarbs: number;
  totalXe: number;
};

type ProductForm = {
  name: string;
  caloriesPer100g: string;
  proteinPer100g: string;
  fatPer100g: string;
  carbsPer100g: string;
};

const defaultForm: ProductForm = {
  name: "",
  caloriesPer100g: "",
  proteinPer100g: "",
  fatPer100g: "",
  carbsPer100g: "",
};

export default function MealsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [breadUnitGrams, setBreadUnitGrams] = useState("12");
  const [isSaved, setIsSaved] = useState(false);
  const [form, setForm] = useState<ProductForm>(defaultForm);
  const [mealItems, setMealItems] = useState<MealItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [mealGrams, setMealGrams] = useState("");
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [isMealSaved, setIsMealSaved] = useState(false);

  useEffect(() => {
    const savedProducts = localStorage.getItem("products");
    if (savedProducts) {
      try {
        const parsedProducts: Product[] = JSON.parse(savedProducts);
        if (Array.isArray(parsedProducts)) {
          setProducts(parsedProducts);
        }
      } catch {
        setProducts([]);
      }
    }

    const savedSettings = localStorage.getItem("diabetes_settings");
    if (savedSettings) {
      try {
        const parsedSettings: Partial<DiabetesSettings> = JSON.parse(savedSettings);
        setBreadUnitGrams(parsedSettings.breadUnitGrams || "12");
      } catch {
        setBreadUnitGrams("12");
      }
    }

    const savedMealHistory = localStorage.getItem("meal_history");
    if (savedMealHistory) {
      try {
        const parsedMealHistory: SavedMeal[] = JSON.parse(savedMealHistory);
        if (Array.isArray(parsedMealHistory)) {
          setSavedMeals(parsedMealHistory);
        } else {
          setSavedMeals([]);
        }
      } catch {
        setSavedMeals([]);
      }
    }
  }, []);

  const handleChange = (field: keyof ProductForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    const newProduct: Product = {
      id: Date.now().toString(),
      name: form.name,
      caloriesPer100g: form.caloriesPer100g,
      proteinPer100g: form.proteinPer100g,
      fatPer100g: form.fatPer100g,
      carbsPer100g: form.carbsPer100g,
      createdAt: new Date().toISOString(),
    };

    const updatedProducts = [newProduct, ...products];
    setProducts(updatedProducts);
    localStorage.setItem("products", JSON.stringify(updatedProducts));
    setForm(defaultForm);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 2000);
  };

  const handleDelete = (id: string) => {
    const updatedProducts = products.filter((product) => product.id !== id);
    setProducts(updatedProducts);
    localStorage.setItem("products", JSON.stringify(updatedProducts));
  };

  const handleAddMealItem = () => {
    const product = products.find((item) => item.id === selectedProductId);
    const grams = parseFloat(mealGrams);
    const breadUnit = parseFloat(breadUnitGrams);

    if (!product || Number.isNaN(grams) || grams <= 0) {
      return;
    }

    const caloriesPer100g = parseFloat(product.caloriesPer100g);
    const proteinPer100g = parseFloat(product.proteinPer100g);
    const fatPer100g = parseFloat(product.fatPer100g);
    const carbsPer100g = parseFloat(product.carbsPer100g);

    const calories = Number.isNaN(caloriesPer100g)
      ? 0
      : (caloriesPer100g * grams) / 100;
    const protein = Number.isNaN(proteinPer100g) ? 0 : (proteinPer100g * grams) / 100;
    const fat = Number.isNaN(fatPer100g) ? 0 : (fatPer100g * grams) / 100;
    const carbs = Number.isNaN(carbsPer100g) ? 0 : (carbsPer100g * grams) / 100;
    const xe =
      Number.isNaN(breadUnit) || breadUnit <= 0 ? 0 : carbs / breadUnit;

    const newMealItem: MealItem = {
      id: Date.now().toString(),
      productId: product.id,
      productName: product.name,
      grams: mealGrams,
      calories,
      protein,
      fat,
      carbs,
      xe,
    };

    setMealItems((prev) => [newMealItem, ...prev]);
    setMealGrams("");
  };

  const handleDeleteMealItem = (id: string) => {
    setMealItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSaveMeal = () => {
    if (mealItems.length === 0) {
      return;
    }

    const newSavedMeal: SavedMeal = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      items: mealItems,
      totalCalories: totals.calories,
      totalProtein: totals.protein,
      totalFat: totals.fat,
      totalCarbs: totals.carbs,
      totalXe: totals.xe,
    };

    const updatedHistory = [newSavedMeal, ...savedMeals];
    setSavedMeals(updatedHistory);
    localStorage.setItem("meal_history", JSON.stringify(updatedHistory));
    setMealItems([]);
    setIsMealSaved(true);
    setTimeout(() => {
      setIsMealSaved(false);
    }, 2000);
  };

  const handleDeleteSavedMeal = (mealId: string) => {
    const updatedHistory = savedMeals.filter((meal) => meal.id !== mealId);
    setSavedMeals(updatedHistory);
    localStorage.setItem("meal_history", JSON.stringify(updatedHistory));
  };

  const totals = mealItems.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      fat: acc.fat + item.fat,
      carbs: acc.carbs + item.carbs,
      xe: acc.xe + item.xe,
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0, xe: 0 }
  );

  const getXePer100g = (carbsPer100g: string) => {
    const carbs = parseFloat(carbsPer100g);
    const breadUnit = parseFloat(breadUnitGrams);

    if (Number.isNaN(carbs) || Number.isNaN(breadUnit) || breadUnit === 0) {
      return "—";
    }

    return (carbs / breadUnit).toFixed(2);
  };

  const inputClassName =
    "mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/40 focus:border-white/30";

  return (
    <AppShell title="Продукты">
      <div className="space-y-4">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="space-y-3">
            <label className="block text-sm text-white/70">
              Название продукта
              <input
                type="text"
                value={form.name}
                onChange={(event) => handleChange("name", event.target.value)}
                className={inputClassName}
              />
            </label>

            <label className="block text-sm text-white/70">
              Калории на 100 г
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={form.caloriesPer100g}
                onChange={(event) =>
                  handleChange("caloriesPer100g", event.target.value)
                }
                className={inputClassName}
              />
            </label>

            <label className="block text-sm text-white/70">
              Белки на 100 г
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={form.proteinPer100g}
                onChange={(event) =>
                  handleChange("proteinPer100g", event.target.value)
                }
                className={inputClassName}
              />
            </label>

            <label className="block text-sm text-white/70">
              Жиры на 100 г
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={form.fatPer100g}
                onChange={(event) => handleChange("fatPer100g", event.target.value)}
                className={inputClassName}
              />
            </label>

            <label className="block text-sm text-white/70">
              Углеводы на 100 г
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={form.carbsPer100g}
                onChange={(event) => handleChange("carbsPer100g", event.target.value)}
                className={inputClassName}
              />
            </label>

            <button
              onClick={handleSave}
              className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black"
            >
              Сохранить продукт
            </button>
            {isSaved && <p className="text-sm text-white/70">Продукт сохранен</p>}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-base font-medium text-white">Сохраненные продукты</h2>
          {products.length === 0 ? (
            <p className="mt-3 text-sm text-white/70">Продуктов пока нет</p>
          ) : (
            <div className="mt-3 space-y-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="rounded-3xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-lg font-semibold">{product.name || "Без названия"}</p>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="rounded-xl border border-white/20 px-3 py-1 text-xs text-white/80"
                    >
                      Удалить
                    </button>
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-white/70">
                    <p>Калории: {product.caloriesPer100g || "—"}</p>
                    <p>Белки: {product.proteinPer100g || "—"}</p>
                    <p>Жиры: {product.fatPer100g || "—"}</p>
                    <p>Углеводы: {product.carbsPer100g || "—"}</p>
                    <p className="text-white">ХЕ на 100 г: {getXePer100g(product.carbsPer100g)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-base font-medium text-white">Текущий прием пищи</h2>
          {products.length === 0 ? (
            <p className="mt-3 text-sm text-white/70">
              Сначала создайте продукты, чтобы собрать прием пищи
            </p>
          ) : (
            <div className="mt-3 space-y-3">
              <label className="block text-sm text-white/70">
                Продукт
                <select
                  value={selectedProductId}
                  onChange={(event) => setSelectedProductId(event.target.value)}
                  className={inputClassName}
                >
                  <option value="">Выберите продукт</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name || "Без названия"}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm text-white/70">
                Вес, г
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={mealGrams}
                  onChange={(event) => setMealGrams(event.target.value)}
                  className={inputClassName}
                />
              </label>
              <button
                onClick={handleAddMealItem}
                className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black"
              >
                Добавить в прием пищи
              </button>
            </div>
          )}

          {mealItems.length === 0 ? (
            <p className="mt-4 text-sm text-white/70">Прием пищи пока пуст</p>
          ) : (
            <div className="mt-4 space-y-3">
              {mealItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-lg font-semibold">{item.productName}</p>
                    <button
                      onClick={() => handleDeleteMealItem(item.id)}
                      className="rounded-xl border border-white/20 px-3 py-1 text-xs text-white/80"
                    >
                      Удалить
                    </button>
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-white/70">
                    <p>Вес: {item.grams} г</p>
                    <p>Калории: {item.calories.toFixed(2)}</p>
                    <p>Белки: {item.protein.toFixed(2)}</p>
                    <p>Жиры: {item.fat.toFixed(2)}</p>
                    <p>Углеводы: {item.carbs.toFixed(2)}</p>
                    <p className="text-white">ХЕ: {item.xe.toFixed(2)}</p>
                  </div>
                </div>
              ))}

              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <h3 className="text-base font-medium text-white">Итого</h3>
                <div className="mt-3 space-y-1 text-sm text-white/70">
                  <p>Калории: {totals.calories.toFixed(2)}</p>
                  <p>Белки: {totals.protein.toFixed(2)}</p>
                  <p>Жиры: {totals.fat.toFixed(2)}</p>
                  <p>Углеводы: {totals.carbs.toFixed(2)}</p>
                  <p className="text-white">ХЕ: {totals.xe.toFixed(2)}</p>
                </div>
              </div>
              <button
                onClick={handleSaveMeal}
                className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black"
              >
                Сохранить прием пищи
              </button>
              {isMealSaved && (
                <p className="text-sm text-white/70">Прием пищи сохранен</p>
              )}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-base font-medium text-white">История приемов пищи</h2>
          {savedMeals.length === 0 ? (
            <p className="mt-3 text-sm text-white/70">
              История приемов пищи пока пуста
            </p>
          ) : (
            <div className="mt-3 space-y-3">
              {savedMeals.map((meal) => (
                <div
                  key={meal.id}
                  className="rounded-3xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-white/60">
                      {new Date(meal.createdAt).toLocaleString("ru-RU")}
                    </p>
                    <button
                      onClick={() => handleDeleteSavedMeal(meal.id)}
                      className="rounded-xl border border-white/20 px-3 py-1 text-xs text-white/80"
                    >
                      Удалить
                    </button>
                  </div>

                  <div className="mt-3 space-y-1 text-sm text-white/70">
                    {meal.items.map((item) => (
                      <p key={item.id}>
                        {item.productName} - {item.grams} г - ХЕ:{" "}
                        {item.xe.toFixed(2)}
                      </p>
                    ))}
                  </div>

                  <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 p-3">
                    <p className="text-sm font-medium text-white">Итого</p>
                    <div className="mt-2 space-y-1 text-sm text-white/70">
                      <p>Калории: {meal.totalCalories.toFixed(2)}</p>
                      <p>Белки: {meal.totalProtein.toFixed(2)}</p>
                      <p>Жиры: {meal.totalFat.toFixed(2)}</p>
                      <p>Углеводы: {meal.totalCarbs.toFixed(2)}</p>
                      <p className="text-white">ХЕ: {meal.totalXe.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
