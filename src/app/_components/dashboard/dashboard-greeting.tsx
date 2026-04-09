import type { ReactNode } from "react";

type DashboardGreetingProps = {
  displayName: string | null;
  /** Softer copy when there is no glucose data yet. */
  isOnboarding?: boolean;
  /** e.g. refresh — aligned top-right without an extra row */
  trailing?: ReactNode;
};

export function DashboardGreeting({
  displayName,
  isOnboarding = false,
  trailing = null,
}: DashboardGreetingProps) {
  const title = displayName
    ? `Здравствуйте, ${displayName}`
    : "Здравствуйте";

  return (
    <header className="space-y-1">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.2em] text-white/40">
          Обзор
        </p>
        {trailing ? (
          <div className="shrink-0 pt-0.5">{trailing}</div>
        ) : null}
      </div>
      <h2 className="text-xl font-semibold leading-snug text-white">{title}</h2>
      <p className="text-sm leading-relaxed text-white/55">
        {isOnboarding
          ? "Ниже — с чего начать. После первых замеров здесь появится сводка и график."
          : "Краткая сводка глюкозы и быстрые действия."}
      </p>
    </header>
  );
}
