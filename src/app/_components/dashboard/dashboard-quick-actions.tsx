import Link from "next/link";

const base =
  "flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-4 text-center text-sm font-medium text-white/90 transition-colors hover:border-white/20 hover:bg-white/[0.09]";

const subtle =
  "rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-center text-xs text-white/65 transition-colors hover:border-white/18 hover:text-white/85";

const onboardingLink =
  "rounded-xl px-3 py-2 text-xs text-white/55 underline decoration-white/20 underline-offset-2 transition-colors hover:text-white/80";

type DashboardQuickActionsProps = {
  /** During first-run, avoid duplicating onboarding CTAs; show secondary links only. */
  variant?: "default" | "onboarding";
};

export function DashboardQuickActions({
  variant = "default",
}: DashboardQuickActionsProps) {
  if (variant === "onboarding") {
    return (
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-white/70">Другие разделы</h3>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-4">
          <Link href="/food" className={onboardingLink}>
            Продукты
          </Link>
          <Link href="/insulin" className={onboardingLink}>
            Инсулин
          </Link>
          <Link href="/export" className={onboardingLink}>
            Экспорт
          </Link>
          <Link href="/calculator" className={onboardingLink}>
            Калькулятор
          </Link>
          <Link href="/history" className={onboardingLink}>
            История
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium text-white/80">Быстрые действия</h3>
      <div className="grid grid-cols-2 gap-3">
        <Link href="/glucose" className={base}>
          Добавить глюкозу
        </Link>
        <Link href="/glucose?range=7d" className={base}>
          Журнал глюкозы
        </Link>
        <Link href="/settings" className={base}>
          Настройки
        </Link>
        <Link href="/food" className={base}>
          Продукты
        </Link>
        <Link href="/insulin" className={`${base} col-span-2`}>
          Инсулин
        </Link>
      </div>
      <div className="flex flex-wrap justify-center gap-2 pt-1">
        <Link href="/calculator" className={subtle}>
          Калькулятор
        </Link>
        <Link href="/bolus" className={subtle}>
          Болюс (оценка)
        </Link>
        <Link href="/export" className={subtle}>
          Экспорт
        </Link>
        <Link href="/history" className={subtle}>
          Ещё
        </Link>
      </div>
    </section>
  );
}
