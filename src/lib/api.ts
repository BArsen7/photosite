/**
 * Клиент локального API (контейнер app: Node + SQLite).
 * Никаких внешних сервисов: всё живёт на одноплатнике.
 *
 * В проде запросы идут относительными путями (/api/…) — nginx проксирует
 * их на app. В локальной разработке задайте в .env.development:
 *   VITE_API_URL=http://localhost:3000
 */
const BASE = ((import.meta.env.VITE_API_URL as string | undefined) ?? "").replace(/\/$/, "");

const TOKEN_KEY = "av_token";
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string | null) =>
  t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    },
  });
  if (!res.ok) {
    let message = `Ошибка сервера (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      /* тело не JSON — оставляем статус */
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

/* Абсолютный URL для картинок: нужен только в dev (BASE != ''); в проде путь относительный */
export const assetUrl = (u: string) => (u.startsWith("http") || !BASE ? u : `${BASE}${u}`);

/* ── Типы (зеркалят схему SQLite) ─────────────────────────────────────── */
export interface DbCategory {
  id: string;
  name: string;
  slug: string;
}

export interface DbProject {
  id: string;
  title: string;
  slug?: string | null;
  description: string | null;
  location: string | null;
  date: string | null;
  category_id: string;
  cover_image_url: string | null;
}

export interface DbPhoto {
  id: string;
  project_id: string;
  image_url: string;
  width: number | null;
  height: number | null;
  exif_camera: string | null;
  exif_lens: string | null;
  exif_settings: string | null;
  sort_order: number;
  created_at?: string;
}

export interface DbInquiry {
  id: string;
  name: string;
  email: string;
  type: string | null;
  message: string;
  created_at?: string;
}

export interface PortfolioData {
  categories: DbCategory[];
  projects: DbProject[];
  photos: DbPhoto[];
}

/* Транслитерация кириллицы для генерации slug'ов */
const RU_LAT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z",
  и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh",
  щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .split("")
    .map((ch) => (RU_LAT[ch] !== undefined ? RU_LAT[ch] : ch))
    .join("")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Адрес проекта: колонка slug из БД либо генерация из названия */
export function projectSlug(p: DbProject): string {
  return p.slug?.trim() || slugify(p.title);
}

/* ── Публичные данные ─────────────────────────────────────────────────── */
export async function fetchPortfolio(): Promise<PortfolioData> {
  try {
    const data = await api<PortfolioData>("/api/portfolio");
    /* Картинки храним относительными; в dev склеиваем с BASE */
    return {
      categories: data.categories,
      projects: data.projects.map((p) => ({
        ...p,
        cover_image_url: p.cover_image_url ? assetUrl(p.cover_image_url) : p.cover_image_url,
      })),
      photos: data.photos.map((ph) => ({ ...ph, image_url: assetUrl(ph.image_url) })),
    };
  } catch {
    /* Сервер ещё не поднялся или сеть моргнула — показываем пустые состояния */
    return { categories: [], projects: [], photos: [] };
  }
}

/* ── Заявка с сайта (публичная вставка, rate limit 3/мин на сервере) ──── */
export interface Inquiry {
  name: string;
  email: string;
  type: string;
  message: string;
}

export async function submitInquiry(payload: Inquiry): Promise<void> {
  await api("/api/inquiries", { method: "POST", body: JSON.stringify(payload) });
}

/* ── Админка: проекты ─────────────────────────────────────────────────── */
export type ProjectPayload = Omit<DbProject, "id" | "slug" | "category_id" | "cover_image_url"> & {
  slug?: string | null;
  category_id?: string | null;
  cover_image_url?: string | null;
};

export async function createProject(payload: ProjectPayload): Promise<{ id: string }> {
  return api("/api/admin/projects", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateProject(id: string, patch: Partial<ProjectPayload>): Promise<void> {
  await api(`/api/admin/projects/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
}

/** Удаление проекта: сервер сам сносит файлы всех его кадров и сами кадры */
export async function deleteProjectRecord(id: string): Promise<void> {
  await api(`/api/admin/projects/${id}`, { method: "DELETE" });
}

/* ── Админка: кадры ───────────────────────────────────────────────────── */
export interface PhotoUploadFields {
  project_id: string;
  exif_camera?: string;
  exif_lens?: string;
  exif_settings?: string;
  width?: number;
  height?: number;
}

/** Загрузка кадра: файл + поля формы; сервер кладёт файл в volume и пишет строку */
export async function uploadPhoto(
  file: File,
  fields: PhotoUploadFields,
): Promise<{ id: string; image_url: string }> {
  const form = new FormData();
  form.append("file", file);
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== "") form.append(key, String(value));
  }
  const res = await api<{ id: string; image_url: string }>("/api/admin/photos", {
    method: "POST",
    body: form,
  });
  return { ...res, image_url: assetUrl(res.image_url) };
}

export async function updatePhotoRecord(id: string, patch: Partial<DbPhoto>): Promise<void> {
  await api(`/api/admin/photos/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
}

/** Удаление кадра: сервер удаляет и файл с диска */
export async function deletePhotoRecord(id: string): Promise<void> {
  await api(`/api/admin/photos/${id}`, { method: "DELETE" });
}

/* ── Админка: заявки ──────────────────────────────────────────────────── */
export async function fetchInquiries(): Promise<DbInquiry[]> {
  return api("/api/admin/inquiries");
}

export async function deleteInquiry(id: string): Promise<void> {
  await api(`/api/admin/inquiries/${id}`, { method: "DELETE" });
}
