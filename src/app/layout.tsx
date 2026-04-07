import "./globals.css";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // allow login page
  const pathname = "";

  if (!user) {
    redirect("/login");
  }

  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
