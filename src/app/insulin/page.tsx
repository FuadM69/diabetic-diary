"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";

type InsulinEntry = {
  id: string;
  insulinKind: "bolus" | "basal";
  insulinType: string;
  dose: string;
  comment: string;
  createdAt: string;
};

export default function InsulinPage() {
  const [entries, setEntries] = useState<InsulinEntry[]>([]);
  const [insulinKind, setInsulinKind] = useState<"bolus" | "basal">("bolus");
  const [insulinType, setInsulinType] = useState("");
  const [dose, setDose] = useState("");
  const [comment, setComment] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const savedEntries = localStorage.getItem("insulin_entries");
    if (!savedEntries) {
      return;
    }

    try {
      const parsedEntries: InsulinEntry[] = JSON.parse(savedEntries);
      if (Array.isArray(parsedEntries)) {
        setEntries(parsedEntries);
      } else {
        setEntries([]);
      }
    } catch {
      setEntries([]);
    }
  }, []);

  const handleSave = () => {
    if (!dose || !insulinType.trim()) {
      return;
    }

    const newEntry: InsulinEntry = {
      id: Date.now().toString(),
      insulinKind,
      insulinType: insulinType.trim(),
      dose,
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
    };

    const updatedEntries = [newEntry, ...entries];
    setEntries(updatedEntries);
    localStorage.setItem("insulin_entries", JSON.stringify(updatedEntries));
    setInsulinType("");
    setDose("");
    setComment("");
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 2000);
  };

  const handleDelete = (id: string) => {
    const updatedEntries = entries.filter((entry) => entry.id !== id);
    setEntries(updatedEntries);
    localStorage.setItem("insulin_entries", JSON.stringify(updatedEntries));
  };

  const inputClassName =
    "mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/40 focus:border-white/30";

  return (
    <AppShell title="Инсулин">
      <div className="space-y-4">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="space-y-3">
            <div>
              <p className="text-sm text-white/70">Тип введения</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setInsulinKind("bolus")}
                  className={`rounded-2xl px-3 py-3 text-sm ${
                    insulinKind === "bolus"
                      ? "bg-white font-medium text-black"
                      : "border border-white/20 text-white/70"
                  }`}
                >
                  Болюсный
                </button>
                <button
                  onClick={() => setInsulinKind("basal")}
                  className={`rounded-2xl px-3 py-3 text-sm ${
                    insulinKind === "basal"
                      ? "bg-white font-medium text-black"
                      : "border border-white/20 text-white/70"
                  }`}
                >
                  Базальный
                </button>
              </div>
            </div>

            <label className="block text-sm text-white/70">
              Название / тип инсулина
              <input
                type="text"
                value={insulinType}
                onChange={(event) => setInsulinType(event.target.value)}
                placeholder="например, Новорапид"
                className={inputClassName}
              />
            </label>

            <label className="block text-sm text-white/70">
              Доза
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={dose}
                onChange={(event) => setDose(event.target.value)}
                placeholder="например, 4"
                className={inputClassName}
              />
            </label>

            <label className="block text-sm text-white/70">
              Комментарий
              <input
                type="text"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="необязательно"
                className={inputClassName}
              />
            </label>

            <button
              onClick={handleSave}
              className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black"
            >
              Сохранить
            </button>
            {isSaved && <p className="text-sm text-white/70">Запись сохранена</p>}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-base font-medium text-white">История введений</h2>
          {entries.length === 0 ? (
            <p className="mt-3 text-sm text-white/70">Записей пока нет</p>
          ) : (
            <div className="mt-3 space-y-3">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-3xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-white/50">
                        {entry.insulinKind === "bolus" ? "Болюсный" : "Базальный"}
                      </p>
                      <p className="mt-1 text-lg font-semibold">{entry.insulinType}</p>
                      <p className="mt-1 text-sm text-white/80">{entry.dose} ед.</p>
                    </div>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="rounded-xl border border-white/20 px-3 py-1 text-xs text-white/80"
                    >
                      Удалить
                    </button>
                  </div>

                  {entry.comment && (
                    <p className="mt-2 text-sm text-white/70">{entry.comment}</p>
                  )}
                  <p className="mt-2 text-xs text-white/50">
                    {new Date(entry.createdAt).toLocaleString("ru-RU")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
