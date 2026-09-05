import type { SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Конфигурация задана в .env — синхронный флаг, не тянет SDK в бандл. */
export const isSupabaseConfigured = Boolean(url && anonKey);

let clientPromise: Promise<SupabaseClient | null> | null = null;

/**
 * Ленивый browser-клиент Supabase. Динамический import() выносит
 * @supabase/supabase-js в отдельный чанк: посетители сайта скачивают
 * SDK только если страница реально обращается к данным.
 */
export function loadSupabase(): Promise<SupabaseClient | null> {
  if (!clientPromise) {
    clientPromise =
      url && anonKey
        ? import("@supabase/supabase-js").then(({ createClient }) =>
            createClient(url, anonKey, {
              auth: { persistSession: true, autoRefreshToken: true },
            }),
          )
        : Promise.resolve(null);
  }
  return clientPromise;
}
