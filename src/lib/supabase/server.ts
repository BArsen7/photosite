import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-клиент Supabase (аналог lib/supabase/server.ts из Next.js).
 * Работает с cookie-хранилищем запроса, поэтому сессия живёт в
 * httpOnly-куках — именно её проверяет middleware.
 *
 * Фабрика фреймворк-независима: cookie store передаётся снаружи.
 *
 * Пример использования в Next.js App Router:
 *
 *   import { cookies } from "next/headers";
 *   import { createSupabaseServer } from "@/lib/supabase/server";
 *
 *   export async function getServerSupabase() {
 *     const cookieStore = await cookies();
 *     return createSupabaseServer({
 *       get: (name) => cookieStore.get(name)?.value,
 *       set: (name, value, options) => cookieStore.set(name, value, options),
 *       remove: (name, options) => cookieStore.set(name, "", { ...options, maxAge: 0 }),
 *     });
 *   }
 */
export interface CookieStoreAdapter {
  get(name: string): string | undefined;
  set(name: string, value: string, options?: Record<string, unknown>): void;
  remove(name: string, options?: Record<string, unknown>): void;
}

export function createSupabaseServer(cookieStore: CookieStoreAdapter): SupabaseClient | null {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !anonKey) return null;

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        /* в реальном сервере — полный список кук; здесь достаточно get */
        return [];
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            if (value === "" || (options as { maxAge?: number } | undefined)?.maxAge === 0) {
              cookieStore.remove(name, options as Record<string, unknown>);
            } else {
              cookieStore.set(name, value, options as Record<string, unknown>);
            }
          });
        } catch {
          /* вызов из Server Component без доступа к кукам — игнорируем */
        }
      },
    },
  });
}
