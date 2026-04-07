import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server Supabase client for the App Router. Session is read from cookies;
 * setAll refreshes cookies when Supabase refreshes the session (e.g. in
 * Server Actions). In Server Components, cookie writes may throw and are
 * safely ignored (middleware should refresh the session when needed).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            /* Server Component: cookies() is read-only */
          }
        },
      },
    }
  );
}
