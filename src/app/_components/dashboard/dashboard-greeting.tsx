type DashboardGreetingProps = {
  displayName: string | null;
  /** Softer copy when there is no glucose data yet. */
  isOnboarding?: boolean;
};

export function DashboardGreeting({
  displayName,
  isOnboarding = false,
}: DashboardGreetingProps) {
  const title = displayName
    ? `Здравствуйте, ${displayName}`
    : "Здравствуйте";

  return (
    <header className="space-y-1">
      <p className="text-xs uppercase tracking-[0.2em] text-white/40">
        Обзор
      </p>
      <h2 className="text-xl font-semibold leading-snug text-white">{title}</h2>
      <p className="text-sm leading-relaxed text-white/55">
        {isOnboarding
          ? "Ниже — с чего начать. После первых замеров здесь появится сводка и график."
          : "Краткая сводка глюкозы и быстрые действия."}
      </p>
    </header>
  );
}
