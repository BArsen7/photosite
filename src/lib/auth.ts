/**
 * Аутентификация админки на локальном API (JWT, 7 дней).
 * Токен хранится в localStorage и уходит заголовком Authorization —
 * работает и в проде (same-origin), и в dev с VITE_API_URL.
 */
import { setToken } from "./api";

export interface AdminSession {
  email: string;
}

const BASE = ((import.meta.env.VITE_API_URL as string | undefined) ?? "").replace(/\/$/, "");

async function call<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("av_token");
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    let message = "Сервер не отвечает";
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      /* оставляем общее сообщение */
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

/** Текущая сессия: проверяем токен у сервера, протухший — выбрасываем */
export async function getSession(): Promise<AdminSession | null> {
  const token = localStorage.getItem("av_token");
  if (!token) return null;
  try {
    return await call<AdminSession>("/api/admin/session");
  } catch {
    setToken(null);
    return null;
  }
}

export type SignInResult = { ok: true; session: AdminSession } | { ok: false; error: string };

export async function signIn(email: string, password: string): Promise<SignInResult> {
  try {
    const res = await call<{ token: string; email: string }>("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(res.token);
    return { ok: true, session: { email: res.email } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Не удалось войти" };
  }
}

export async function signOut(): Promise<void> {
  setToken(null);
}

/** Смена сессии в другой вкладке (storage-события) */
export function onAuthChange(cb: (session: AdminSession | null) => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === "av_token") {
      void getSession().then(cb);
    }
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}
