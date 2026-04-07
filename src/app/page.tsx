import { AppShell } from "@/components/layout/app-shell";

export default function HomePage() {
  return (
    <AppShell title="Главная">
      <div className="space-y-4">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-white/60">Сегодня</p>
          <h2 className="mt-2 text-2xl font-semibold">Добро пожаловать</h2>
          <p className="mt-2 text-sm leading-6 text-white/70">
            Это стартовый каркас MVP приложения «Дневник диабетика».
          </p>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-white/60">Глюкоза</p>
            <p className="mt-2 text-2xl font-semibold">—</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-white/60">Инсулин</p>
            <p className="mt-2 text-2xl font-semibold">—</p>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-white/60">Следующий этап</p>
          <p className="mt-2 text-base text-white">
            После этого каркаса начнем делать реальные экраны и навигацию.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
