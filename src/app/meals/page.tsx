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
      </div>
    </AppShell>
  );
}
