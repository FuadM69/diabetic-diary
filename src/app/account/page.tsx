"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { createClient } from "@/utils/supabase/client";

export default function AccountPage() {
  const supabase = useMemo(() => createClient(), []);
  const [fullName, setFullName] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const metadata = user?.user_metadata as { full_name?: string } | undefined;
      if (metadata?.full_name) {
        setFullName(metadata.full_name);
      }
    };
    loadUser();
  }, [supabase]);

  const handleSave = async () => {
    await supabase.auth.updateUser({
      data: { full_name: fullName },
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 2000);
  };

  const inputClassName =
    "mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-base text-white outline-none placeholder:text-white/40 focus:border-white/30";

  return (
    <AppShell title="Аккаунт">
      <div className="flex min-h-full items-center justify-center">
        <section className="w-full rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="space-y-4">
            <label className="block text-sm text-white/70">
              Ваше имя
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="например, Фуад"
                className={inputClassName}
              />
            </label>

            <button
              onClick={handleSave}
              className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black"
            >
              Сохранить имя
            </button>

            {isSaved && (
              <p className="text-sm text-white/70">Имя сохранено</p>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
