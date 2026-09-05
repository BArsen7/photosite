import { PHOTOS } from "../data/photos";
import { loadSupabase } from "./supabase/browser";

/* Клиент инициализируется лениво внутри каждой функции — SDK не попадает
   в стартовый чанк и подгружается только при реальном запросе к данным. */

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
  slug?: string | null; // человекочитаемый адрес /portfolio/[slug]
  description: string | null;
  location: string | null;
  date: string | null; // DATE → ISO-строка
  category_id: string;
  cover_image_url: string | null;
}

/* Транслитерация кириллицы для клиентской генерации slug'ов. */
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

/** Адрес проекта: колонка slug из БД либо детерминированная генерация из названия. */
export function projectSlug(p: DbProject): string {
  return p.slug?.trim() || slugify(p.title);
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
  const supabase = await loadSupabase();
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
    slug: "silence-of-the-city",
    description: "Ночные улицы, дождь и неон — город, который говорит шёпотом.",
    location: "Москва",
    date: "2025-01-15",
    category_id: "cat-street",
    cover_image_url: PHOTOS[0].src,
  },
  {
    id: "prj-faces",
    title: "Faces",
    slug: "faces",
    description: "Люди при свете окна и при свете лампы. Плёнка, средний формат.",
    location: "Москва · Санкт-Петербург",
    date: "2024-06-01",
    category_id: "cat-portraits",
    cover_image_url: PHOTOS[1].src,
  },
  {
    id: "prj-concrete",
    title: "Concrete & Light",
    slug: "concrete-and-light",
    description: "Брутализм, ритм окон и одна тень на весь фасад.",
    location: "Берлин",
    date: "2023-09-10",
    category_id: "cat-architecture",
    cover_image_url: PHOTOS[2].src,
  },
  {
    id: "prj-still",
    title: "Still Moments",
    slug: "still-moments",
    description: "Постановочный свет: от голландского натюрморта до редакционного минимализма.",
    location: "Студия",
    date: "2024-11-20",
    category_id: "cat-still-life",
    cover_image_url: PHOTOS[5].src,
  },
  {
    id: "prj-north",
    title: "Northern Thaw",
    slug: "northern-thaw",
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

/* ── Управление архивом (админка) ─────────────────────────────────────── */

/** Путь к объекту в бакете `photos` из публичного URL (для удаления из Storage). */
export function storagePathFromUrl(imageUrl: string): string | null {
  const marker = "/storage/v1/object/public/photos/";
  const i = imageUrl.indexOf(marker);
  return i >= 0 ? decodeURIComponent(imageUrl.slice(i + marker.length)) : null;
}

/** Удаляет файл из Supabase Storage (если он там лежит). */
async function removeStoredFile(imageUrl: string | null | undefined): Promise<void> {
  const supabase = await loadSupabase();
  if (!supabase || !imageUrl) return;
  const path = storagePathFromUrl(imageUrl);
  if (!path) return;
  try {
    await supabase.storage.from("photos").remove([path]);
  } catch {
    /* файл уже удалён или нет прав — не блокируем удаление записи */
  }
}

/** Удаление кадра: файл из Storage + строка из `photos`. */
export async function deletePhotoRecord(photo: {
  id: string;
  image_url: string | null;
}): Promise<void> {
  const supabase = await loadSupabase();
  if (supabase) {
    await removeStoredFile(photo.image_url);
    const { error } = await supabase.from("photos").delete().eq("id", photo.id);
    if (error) throw new Error(error.message);
    return;
  }
  await delay(500); // демо-режим: имитация запроса
}

/** Удаление проекта: все файлы кадров из Storage, кадры, затем проект. */
export async function deleteProjectRecord(
  project: DbProject,
  photos: DbPhoto[],
): Promise<void> {
  const supabase = await loadSupabase();
  if (supabase) {
    const owned = photos.filter((p) => p.project_id === project.id);
    await Promise.all(owned.map((p) => removeStoredFile(p.image_url)));
    const { error: phErr } = await supabase.from("photos").delete().eq("project_id", project.id);
    const { error: prErr } = await supabase.from("projects").delete().eq("id", project.id);
    if (phErr) throw new Error(phErr.message);
    if (prErr) throw new Error(prErr.message);
    return;
  }
  await delay(500);
}

/** Обновление кадра (EXIF, проект, порядок). */
export async function updatePhotoRecord(
  id: string,
  patch: Partial<DbPhoto>,
): Promise<void> {
  const supabase = await loadSupabase();
  if (supabase) {
    const { error } = await supabase.from("photos").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return;
  }
  await delay(400);
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
  const supabase = await loadSupabase();
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
