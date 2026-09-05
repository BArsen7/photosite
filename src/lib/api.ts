import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { PHOTOS } from "../data/photos";

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

/* ── Типы под схему БД (categories / projects / photos) ────────────────── */

export interface DbCategory {
  id: string;
  name: string;
  slug: string;
}

export interface DbProject {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  date: string | null; // DATE → ISO-строка
  category_id: string;
  cover_image_url: string | null;
}

export interface DbPhoto {
  id: string;
  project_id: string;
  image_url: string;
  width: number;
  height: number;
  exif_camera: string | null;
  exif_lens: string | null;
  exif_settings: string | null;
  sort_order: number;
}

export interface PortfolioData {
  categories: DbCategory[];
  projects: DbProject[];
  photos: DbPhoto[];
}

/**
 * Получение данных портфолио: categories + projects + photos
 * тремя параллельными запросами. Без ключей Supabase (или при ошибке
 * сети/RLS) возвращает локальный датасет — сайт остаётся живым.
 */
export async function fetchPortfolio(): Promise<PortfolioData> {
  if (supabase) {
    try {
      const [catRes, projRes, photoRes] = await Promise.all([
        supabase.from("categories").select("id, name, slug").order("name"),
        supabase.from("projects").select("*").order("date", { ascending: false }),
        supabase.from("photos").select("*").order("sort_order"),
      ]);
      if (
        !catRes.error && !projRes.error && !photoRes.error &&
        catRes.data && projRes.data?.length && photoRes.data
      ) {
        return {
          categories: catRes.data as DbCategory[],
          projects: projRes.data as DbProject[],
          photos: photoRes.data as DbPhoto[],
        };
      }
    } catch {
      /* фолбэк на локальные данные */
    }
  }
  await delay(600); // имитация сети: скелетоны успевают показаться
  return buildLocalPortfolio();
}

/* ── Локальный датасет (демо-режим) ────────────────────────────────────── */

const LOCAL_CATEGORIES: DbCategory[] = [
  { id: "cat-street", name: "Street", slug: "street" },
  { id: "cat-portraits", name: "Portraits", slug: "portraits" },
  { id: "cat-architecture", name: "Architecture", slug: "architecture" },
  { id: "cat-still-life", name: "Still Life", slug: "still-life" },
  { id: "cat-landscapes", name: "Landscapes", slug: "landscapes" },
];

const LOCAL_PROJECTS: DbProject[] = [
  {
    id: "prj-silence",
    title: "Silence of the City",
    description: "Ночные улицы, дождь и неон — город, который говорит шёпотом.",
    location: "Москва",
    date: "2025-01-15",
    category_id: "cat-street",
    cover_image_url: PHOTOS[0].src,
  },
  {
    id: "prj-faces",
    title: "Faces",
    description: "Люди при свете окна и при свете лампы. Плёнка, средний формат.",
    location: "Москва · Санкт-Петербург",
    date: "2024-06-01",
    category_id: "cat-portraits",
    cover_image_url: PHOTOS[1].src,
  },
  {
    id: "prj-concrete",
    title: "Concrete & Light",
    description: "Брутализм, ритм окон и одна тень на весь фасад.",
    location: "Берлин",
    date: "2023-09-10",
    category_id: "cat-architecture",
    cover_image_url: PHOTOS[2].src,
  },
  {
    id: "prj-still",
    title: "Still Moments",
    description: "Постановочный свет: от голландского натюрморта до редакционного минимализма.",
    location: "Студия",
    date: "2024-11-20",
    category_id: "cat-still-life",
    cover_image_url: PHOTOS[5].src,
  },
  {
    id: "prj-north",
    title: "Northern Thaw",
    description: "Хребты в тумане и гребни дюн на границе света и тени.",
    location: "Кавказ · Руб-эль-Хали",
    date: "2023-05-05",
    category_id: "cat-landscapes",
    cover_image_url: PHOTOS[3].src,
  },
];

/** Привязка кадров к проектам для демо-данных. */
const PHOTO_TO_PROJECT: Record<string, string> = {
  "fr-01": "prj-silence",
  "fr-05": "prj-silence",
  "fr-02": "prj-faces",
  "fr-08": "prj-faces",
  "fr-03": "prj-concrete",
  "fr-07": "prj-concrete",
  "fr-06": "prj-still",
  "fr-09": "prj-still",
  "fr-04": "prj-north",
  "fr-10": "prj-north",
};

/* ratio → реальные пиксели (для aspect-ratio карточек masonry) */
const RATIO_SIZES: Record<string, [number, number]> = {
  "16/9": [1600, 900],
  "16/10": [1600, 1000],
  "4/5": [1200, 1500],
  "1/1": [1200, 1200],
};

function buildLocalPortfolio(): PortfolioData {
  const photos: DbPhoto[] = PHOTOS.map((p, i) => {
    const [w, h] = RATIO_SIZES[p.ratio] ?? [1200, 1500];
    return {
      id: p.id,
      project_id: PHOTO_TO_PROJECT[p.id] ?? LOCAL_PROJECTS[0].id,
      image_url: p.src,
      width: w,
      height: h,
      exif_camera: p.camera,
      exif_lens: p.lens,
      exif_settings: `ƒ/${p.aperture} · ${p.shutter} · ISO ${p.iso}`,
      sort_order: i + 1,
    };
  });
  return { categories: LOCAL_CATEGORIES, projects: LOCAL_PROJECTS, photos };
}

/* ── Заявки ────────────────────────────────────────────────────────────── */

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
