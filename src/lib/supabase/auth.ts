import { loadSupabase } from "./browser";

/** Сессия администратора: из Supabase Auth либо локальная (демо-режим). */
export interface AdminSession {
  email: string;
  mode: "supabase" | "demo";
}

const DEMO_KEY = "av_admin_session";
export const DEMO_ADMIN_EMAIL = "arseniy.babanov@yandex.ru";

export { isSupabaseConfigured } from "./browser";

function readDemoSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    return raw ? (JSON.parse(raw) as AdminSession) : null;
  } catch {
    return null;
  }
}

/** Текущая сессия (асинхронно: сначала Supabase, затем демо-хранилище). */
export async function getSession(): Promise<AdminSession | null> {
  const supabase = await loadSupabase();
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    const email = data.session?.user?.email;
    if (email) return { email, mode: "supabase" };
  }
  return readDemoSession();
}

export type SignInResult = { ok: true; session: AdminSession } | { ok: false; error: string };

/**
 * Вход: Supabase Auth (signInWithPassword). Без ключей — демо-режим:
 * arseniy.babanov@yandex.ru + любой пароль от 6 символов.
 */
export async function signIn(email: string, password: string): Promise<SignInResult> {
  const supabase = await loadSupabase();

  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      /* Общее сообщение: не раскрываем, существует ли аккаунт */
      const msg = /invalid login credentials/i.test(error.message)
        ? "Неверный email или пароль"
        : error.message;
      return { ok: false, error: msg };
    }
    const userEmail = data.user?.email ?? email;
    /* Доп. проверка: email должен быть в таблице admins */
    const allowed = await isAllowedAdmin(userEmail);
    if (!allowed) {
      await supabase.auth.signOut();
      return { ok: false, error: "Аккаунт не числится в списке администраторов" };
    }
    return { ok: true, session: { email: userEmail, mode: "supabase" } };
  }

  /* Демо-режим */
  await new Promise((r) => setTimeout(r, 700));
  if (email.trim().toLowerCase() !== DEMO_ADMIN_EMAIL) {
    return { ok: false, error: "Демо-режим: используйте admin@volkov.photo" };
  }
  if (password.length < 6) {
    return { ok: false, error: "Пароль должен быть не короче 6 символов" };
  }
  const session: AdminSession = { email: DEMO_ADMIN_EMAIL, mode: "demo" };
  localStorage.setItem(DEMO_KEY, JSON.stringify(session));
  return { ok: true, session };
}

/** Выход: гасим сессию Supabase и демо-хранилище. */
export async function signOut(): Promise<void> {
  const supabase = await loadSupabase();
  if (supabase) await supabase.auth.signOut();
  localStorage.removeItem(DEMO_KEY);
}

/** Принадлежность к таблице admins (в демо — по известному email). */
export async function isAllowedAdmin(email: string): Promise<boolean> {
  const supabase = await loadSupabase();
  if (!supabase) return email.trim().toLowerCase() === DEMO_ADMIN_EMAIL;
  const { data, error } = await supabase.from("admins").select("id").eq("email", email).limit(1);
  return !error && (data?.length ?? 0) > 0;
}

/** Подписка на смену аутентификации (Supabase + storage-события демо). */
export function onAuthChange(cb: (session: AdminSession | null) => void): () => void {
  const subs: Array<() => void> = [];
  let active = true;
  /* SDK может ещё грузиться — подписываемся, когда клиент готов */
  loadSupabase().then((supabase) => {
    if (!supabase || !active) return;
    const { data } = supabase.auth.onAuthStateChange((_event, s) => {
      const email = s?.user?.email;
      cb(email ? { email, mode: "supabase" } : readDemoSession());
    });
    subs.push(() => data.subscription.unsubscribe());
  });
  const onStorage = (e: StorageEvent) => {
    if (e.key === DEMO_KEY) cb(readDemoSession());
  };
  window.addEventListener("storage", onStorage);
  subs.push(() => window.removeEventListener("storage", onStorage));
  return () => {
    active = false;
    subs.forEach((u) => u());
  };
}
