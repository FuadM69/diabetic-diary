"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";

type AppShellProps = {
  title: string;
  children: React.ReactNode;
  /** Hide bottom nav (e.g. login). Default: show. */
  showMobileNav?: boolean;
};

export function AppShell({
  title,
  children,
  showMobileNav = true,
}: AppShellProps) {
  const router = useRouter();
  const [headerSubtitle, setHeaderSubtitle] = useState("Дневник диабетика");

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const fullName = user?.user_metadata?.full_name;
      setHeaderSubtitle(
        fullName ? `Дневник ${fullName}` : "Дневник диабетика"
      );
    };
    loadUser();
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-black">
        <header className="sticky top-0 z-10 border-b border-white/10 bg-black/95 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top,0px))] backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                {headerSubtitle}
              </p>
              <h1 className="mt-1 truncate text-xl font-semibold">{title}</h1>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="min-h-11 shrink-0 rounded-xl border border-white/20 px-4 py-2.5 text-xs font-medium text-white/85 active:bg-white/10"
            >
              Выйти
            </button>
          </div>
        </header>

        <main
          className={
            showMobileNav
              ? "flex-1 px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] pt-4"
              : "flex-1 px-4 pb-10 pt-4"
          }
        >
          {children}
        </main>

        {showMobileNav ? <MobileBottomNav /> : null}
      </div>
    </div>
  );
}
