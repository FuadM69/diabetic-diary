import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/getUser";
import { getUserSettings } from "@/lib/db/settings";
import { CalculatorClient } from "./calculator-client";

export default async function CalculatorPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const settings = await getUserSettings(user.id);

  return <CalculatorClient insulinDoseStep={settings.insulin_dose_step} />;
}
