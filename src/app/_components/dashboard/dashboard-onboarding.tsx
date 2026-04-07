import Link from "next/link";
import { EMPTY_STATE_DASHED } from "@/lib/ui/page-patterns";

const primaryBtn =
  "flex min-h-11 items-center justify-center rounded-2xl bg-white px-4 py-3 text-center text-sm font-medium text-black transition-opacity hover:opacity-95";

const secondaryBtn =
  "flex min-h-11 items-center justify-center rounded-2xl border border-white/18 bg-white/[0.06] px-4 py-3 text-center text-sm font-medium text-white/90 transition-colors hover:border-white/26 hover:bg-white/[0.09]";

/**
 * First-run dashboard: purpose, order of steps, primary navigation.
 * Shown when the user has no glucose history yet (`latest === null`).
 */
export function DashboardOnboarding() {
  return (
    <section className={`${EMPTY_STATE_DASHED} px-4 py-8 text-left sm:px-6`}>
      <p className="text-center text-base font-medium text-white/90">
        Добро пожаловать
      </p>
      <p className="mt-2 text-center text-sm leading-relaxed text-white/55">
        Дневник помогает видеть глюкозу, еду и инсулин в одном месте — для
        личного контроля, а не для автоматических решений по дозе.
      </p>

      <ol className="mt-5 space-y-2 text-xs leading-relaxed text-white/45">
        <li>
          <span className="font-medium text-white/55">1.</span> Проверьте
          цели и коэффициенты в настройках.
        </li>
        <li>
          <span className="font-medium text-white/55">2.</span> Добавьте первый
          замер глюкозы.
        </li>
        <li>
          <span className="font-medium text-white/55">3.</span> Запишите приём
          пищи из каталога продуктов.
        </li>
        <li>
          <span className="font-medium text-white/55">4.</span> При
          необходимости оцените болюс; инсулин и экспорт — когда появятся
          записи.
        </li>
      </ol>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Link href="/settings" className={primaryBtn}>
          Настройки
        </Link>
        <Link href="/glucose#add-glucose" className={secondaryBtn}>
          Глюкоза
        </Link>
        <Link href="/meals#add-meal" className={secondaryBtn}>
          Еда
        </Link>
        <Link href="/bolus" className={secondaryBtn}>
          Болюс
        </Link>
      </div>

      <p className="mt-5 text-center text-[0.65rem] leading-relaxed text-white/35">
        Журнал инсулина и выгрузка файлов станут полезны после первых данных.
      </p>
    </section>
  );
}
