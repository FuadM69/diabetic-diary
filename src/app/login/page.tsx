import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { createClient as createBrowserClient } from "@/utils/supabase/client";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  // keep existing UI below

  const router = useRouter();
  const supabaseClient = createBrowserClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSignIn = async () => {
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    setSuccessMessage("Вход выполнен");
    setLoading(false);
    router.push("/");
    router.refresh();
  };

  const handleSignUp = async () => {
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    const { error } = await supabaseClient.auth.signUp({
      email,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    setSuccessMessage("Проверьте почту для подтверждения, если это требуется");
    setLoading(false);
  };

  const inputClassName =
    "mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/40 focus:border-white/30";

  return (
    <AppShell title="Вход">
      <div className="flex min-h-full items-center justify-center">
        <section className="w-full rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="space-y-4">
            <label className="block text-sm text-white/70">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClassName}
              />
            </label>

            <label className="block text-sm text-white/70">
              Пароль
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={inputClassName}
              />
            </label>

            <button
              onClick={handleSignIn}
              disabled={loading}
              className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black disabled:opacity-60"
            >
              Войти
            </button>

            <button
              onClick={handleSignUp}
              disabled={loading}
              className="w-full rounded-2xl border border-white/20 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
            >
              Зарегистрироваться
            </button>

            {errorMessage && (
              <p className="text-sm text-red-300">{errorMessage}</p>
            )}
            {successMessage && (
              <p className="text-sm text-white/80">{successMessage}</p>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
