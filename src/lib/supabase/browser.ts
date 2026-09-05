import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser-клиент Supabase (аналог lib/supabase/client.ts из Next.js).
 * Синглтон: один клиент на всё приложение. Без ключей в окружении
 * возвращает null — приложение переходит в демо-режим.
 *
 *   VITE_SUPABASE_URL=https://xxxx.supabase.co
 *   VITE_SUPABASE_ANON_KEY=eyJ...
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!client) {
    client = createClient(url as string, anonKey as string, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return client;
}

export const supabase = getSupabaseBrowser();
