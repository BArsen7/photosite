import { useEffect } from "react";

/**
 * Аналог generateMetadata из Next.js для SPA: хук обновляет
 * <title>, description и OpenGraph/Twitter-теги при смене маршрута.
 * В Next.js каждый page.tsx просто экспортирует metadata/generateMetadata —
 * данные для тега берутся те же.
 */
export const SITE = {
  name: "Artem Volkov — Photographer",
  url: "https://volkov.photo",
  /** Дефолтная OG-обложка (первый уличный кадр, 16:9) */
  image:
    "https://image.qwenlm.ai/generated-images/63cfecc5-6791-4b6d-9663-2a53c23d3f09/_result.png",
  defaultDescription:
    "Street, portrait, architecture, still life and landscape photography. Плёнка и цифровой средний формат. Москва — весь мир.",
};

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

interface PageMeta {
  title?: string | null;
  description?: string | null;
  image?: string | null;
  /** Служебные страницы (админка) закрываем от индексации */
  noindex?: boolean;
}

export function usePageMeta({ title, description, image, noindex = false }: PageMeta) {
  useEffect(() => {
    upsertMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");
    const fullTitle = title ? `${title} · ${SITE.name}` : SITE.name;
    const desc = description?.trim() || SITE.defaultDescription;
    const img = image || SITE.image;

    document.title = fullTitle;
    upsertMeta("name", "description", desc);

    /* OpenGraph — важно для превью ссылок в мессенджерах */
    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("property", "og:description", desc);
    upsertMeta("property", "og:image", img);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:site_name", SITE.name);
    upsertMeta("property", "og:url", window.location.href);

    /* Twitter/X-карточка */
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", fullTitle);
    upsertMeta("name", "twitter:description", desc);
    upsertMeta("name", "twitter:image", img);
  }, [title, description, image]);
}
