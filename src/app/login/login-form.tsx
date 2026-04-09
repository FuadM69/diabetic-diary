"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { createClient } from "@/utils/supabase/client";

export default function LoginForm() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleLogin = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setSuccessMessage("Вход выполнен");
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setSuccessMessage("Проверьте почту для подтверждения, если это требуется");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell title="Вход" showMobileNav={false}>
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-white/70">Email</label>
              <input
                type="email"
                placeholder="Введите email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-base text-white outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/70">Пароль</label>
              <input
                type="password"
                placeholder="Введите пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-base text-white outline-none"
              />
            </div>

            {errorMessage ? (
              <p className="text-sm text-red-400">{errorMessage}</p>
            ) : null}

            {successMessage ? (
              <p className="text-sm text-green-400">{successMessage}</p>
            ) : null}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black disabled:opacity-60"
            >
              {loading ? "Загрузка..." : "Войти"}
            </button>

            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full rounded-2xl border border-white/10 px-4 py-3 text-sm text-white disabled:opacity-60"
            >
              {loading ? "Загрузка..." : "Зарегистрироваться"}
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
