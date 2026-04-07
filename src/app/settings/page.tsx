import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUser } from "@/lib/auth/getUser";
import { getUserSettings } from "@/lib/db/settings";
import { SettingsForm } from "./_components/settings-form";
import { INTRO_TEXT, PAGE_CONTAINER } from "@/lib/ui/page-patterns";

function settingsFormKey(settings: {
  glucose_target_min: number;
  glucose_target_max: number;
  carb_ratio: number | null;
  insulin_sensitivity: number | null;
  timezone: string | null;
}): string {
  return [
    settings.glucose_target_min,
    settings.glucose_target_max,
    settings.carb_ratio ?? "",
    settings.insulin_sensitivity ?? "",
    settings.timezone ?? "",
  ].join("|");
}

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const settings = await getUserSettings(user.id);

  return (
    <AppShell title="Настройки">
      <div className={`${PAGE_CONTAINER} space-y-5`}>
        <p className={INTRO_TEXT}>
          Параметры сохраняются в облаке. Границы цели влияют на подсветку и
          статистику; углеводный коэффициент и чувствительность нужны только
          помощнику болюса (можно заполнить позже).
        </p>
        <SettingsForm
          key={settingsFormKey(settings)}
          initialSettings={settings}
        />
      </div>
    </AppShell>
  );
}
