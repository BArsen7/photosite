import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { PHOTOS, type Photo } from "../data/photos";

/**
 * Supabase-клиент создаётся только если в .env есть ключи:
 *   VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
 * Иначе сайт полностью работает на локальных данных (демо-режим).
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Загрузка работ: сначала пробуем Supabase (таблица `photos`), падаем на локальные данные. */
export async function fetchPhotos(): Promise<Photo[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase.from("photos").select("*").order("id");
      if (!error && data && data.length) return data as unknown as Photo[];
    } catch {
      /* сеть/права — используем локальный датасет */
    }
  }
  await delay(550); // имитация сети: скелетоны успевают показать состояние загрузки
  return PHOTOS;
}

export interface Inquiry {
  name: string;
  email: string;
  type: string;
  message: string;
}

/** Отправка заявки: insert в таблицу `inquiries`, в демо — имитация. */
export async function submitInquiry(payload: Inquiry): Promise<void> {
  if (supabase) {
    try {
      const { error } = await supabase.from("inquiries").insert(payload);
      if (!error) return;
    } catch {
      /* фолбэк ниже */
    }
  }
  await delay(900);
}
