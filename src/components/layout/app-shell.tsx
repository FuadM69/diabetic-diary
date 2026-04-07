type AppShellProps = {
  title: string;
  children: React.ReactNode;
};

export function AppShell({ title, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-black">
        <header className="sticky top-0 z-10 border-b border-white/10 bg-black/95 px-4 pb-3 pt-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                Дневник диабетика
              </p>
              <h1 className="mt-1 text-xl font-semibold">{title}</h1>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 pb-24 pt-4">{children}</main>

        <nav className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-black/95 backdrop-blur">
          <div className="mx-auto grid max-w-md grid-cols-4 gap-1 px-2 py-2">
            <button className="rounded-2xl bg-white px-3 py-3 text-sm font-medium text-black">
              Главная
            </button>
            <button className="rounded-2xl px-3 py-3 text-sm text-white/70">
              Глюкоза
            </button>
            <button className="rounded-2xl px-3 py-3 text-sm text-white/70">
              Еда
            </button>
            <button className="rounded-2xl px-3 py-3 text-sm text-white/70">
              Еще
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
