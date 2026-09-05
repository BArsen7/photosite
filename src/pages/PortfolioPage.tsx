/**
 * В Next.js App Router этому файлу нужна директива 'use client'
 * (useState/useMemo — клиентская интерактивность). В Vite все
 * компоненты клиентские по умолчанию.
 */
import { useEffect, useMemo, useState } from "react";
import Photo from "../components/Photo";
import Lightbox, { type LightboxItem } from "../components/Lightbox";
import { FrameCorners } from "../components/Icons";
import { LineReveal, Reveal } from "../lib/motion";
import { fetchPortfolio, type DbProject, type PortfolioData } from "../lib/api";
import { usePageMeta } from "../lib/meta";

const FILTER_ALL = "all";
const SKELETON_RATIOS = ["3/4", "1/1", "4/5", "16/10", "3/4", "4/5"];

export default function PortfolioPage() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [active, setActive] = useState<string>(FILTER_ALL);
  const [lightbox, setLightbox] = useState<number | null>(null);

  /* 4. Получение данных: categories + projects + photos из Supabase */
  useEffect(() => {
    let cancelled = false;
    fetchPortfolio().then((d) => {
      if (!cancelled) setData(d);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  /* Справочники для клиентской фильтрации и лайтбокса */
  const projectById = useMemo(
    () => new Map<string, DbProject>((data?.projects ?? []).map((p) => [p.id, p])),
    [data],
  );
  const categoryById = useMemo(
    () => new Map((data?.categories ?? []).map((c) => [c.id, c])),
    [data],
  );
  /** project_id → slug категории (JOIN на клиенте) */
  const slugByProject = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of data?.projects ?? []) {
      const cat = categoryById.get(p.category_id);
      if (cat) m.set(p.id, cat.slug);
    }
    return m;
  }, [data, categoryById]);

  const sortedPhotos = useMemo(
    () => [...(data?.photos ?? [])].sort((a, b) => a.sort_order - b.sort_order),
    [data],
  );

  /* 5. Клиентская фильтрация: показываем кадры выбранной категории */
  const visible = useMemo(
    () =>
      active === FILTER_ALL
        ? sortedPhotos
        : sortedPhotos.filter((ph) => slugByProject.get(ph.project_id) === active),
    [sortedPhotos, slugByProject, active],
  );

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const ph of sortedPhotos) {
      const s = slugByProject.get(ph.project_id);
      if (s) m.set(s, (m.get(s) ?? 0) + 1);
    }
    return m;
  }, [sortedPhotos, slugByProject]);

  /* Карточки для лайтбокса с EXIF и метаданными проекта */
  const items: LightboxItem[] = useMemo(
    () =>
      visible.map((ph) => {
        const proj = projectById.get(ph.project_id);
        const cat = proj ? categoryById.get(proj.category_id) : undefined;
        const meta: { label: string; value: string }[] = [];
        if (proj?.location)
          meta.push({
            label: "Локация",
            value: proj.date ? `${proj.location}, ${proj.date.slice(0, 4)}` : proj.location,
          });
        if (ph.exif_camera) meta.push({ label: "Камера", value: ph.exif_camera });
        if (ph.exif_lens) meta.push({ label: "Объектив", value: ph.exif_lens });
        if (ph.exif_settings) meta.push({ label: "Параметры", value: ph.exif_settings });
        if (cat) meta.push({ label: "Жанр", value: cat.name });
        return {
          id: ph.id,
          src: ph.image_url,
          alt: proj?.title ?? "Фотография",
          title: proj?.title ?? "Без названия",
          meta,
        };
      }),
    [visible, projectById, categoryById],
  );

  const activeLabel =
    active === FILTER_ALL
      ? "All"
      : (data?.categories.find((c) => c.slug === active)?.name ?? "All");
  const pct = sortedPhotos.length ? Math.round((visible.length / sortedPhotos.length) * 100) : 0;

  /* Аналог generateMetadata: метаданные страницы портфолио */
  usePageMeta({
    title: "Portfolio",
    description:
      "Все работы Артёма Волкова: стрит, портреты, архитектура, натюрморт и пейзаж. Фильтры по жанрам, EXIF каждого кадра.",
    image: sortedPhotos[0]?.image_url,
  });

  return (
    <div className="pb-24 pt-24 md:pt-28">
      {/* Шапка страницы */}
      <section className="px-5 md:px-10">
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.35em] text-acc">
          Artem Volkov · Selected frames 2021—2025
        </p>
        <h1 className="font-display text-[clamp(2.8rem,8vw,6rem)] font-semibold leading-none tracking-tight">
          <LineReveal>Portfolio</LineReveal>
        </h1>
        <p className="mt-5 max-w-xl text-sm leading-relaxed text-mut md:text-base">
          Пять жанров, два формата — плёнка и цифровой средний формат. Каждый кадр
          открывается по клику: внутри EXIF и паспорт проекта.
        </p>
      </section>

      {/* 1. Горизонтальные фильтры (sticky под шапкой) */}
      <div className="sticky top-16 z-30 mt-10 border-y border-line bg-coal/95 backdrop-blur-md">
        <div className="flex gap-2 overflow-x-auto px-5 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:px-10">
          {/* All */}
          <button
            onClick={() => setActive(FILTER_ALL)}
            aria-pressed={active === FILTER_ALL}
            className={`shrink-0 border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] transition-all duration-300 ${
              active === FILTER_ALL
                ? "border-acc bg-acc text-coal"
                : "border-line text-mut hover:border-acc/60 hover:text-ink"
            }`}
          >
            All <sup className="ml-1">{sortedPhotos.length || ""}</sup>
          </button>
          {/* Категории из данных */}
          {(data?.categories ?? []).map((c) => {
            const isActive = active === c.slug;
            return (
              <button
                key={c.id}
                onClick={() => setActive(c.slug)}
                aria-pressed={isActive}
                className={`shrink-0 border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] transition-all duration-300 ${
                  isActive
                    ? "border-acc bg-acc text-coal"
                    : "border-line text-mut hover:border-acc/60 hover:text-ink"
                }`}
              >
                {c.name} <sup className="ml-1">{counts.get(c.slug) ?? 0}</sup>
              </button>
            );
          })}
        </div>
      </div>

      {/* Счётчик выборки + живой индикатор доли */}
      <div className="flex items-center gap-5 px-5 pt-6 md:px-10">
        <p className="whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.25em] text-mut">
          <span className="text-acc">{visible.length}</span> frames · {activeLabel}
        </p>
        <div className="h-px flex-1 overflow-hidden bg-line">
          <div
            className="h-full bg-acc transition-all duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* 2. Masonry-сетка на CSS columns */}
      <section className="px-5 pb-4 pt-6 md:px-10" aria-label="Фотографии">
        {data === null ? (
          /* Скелетоны на время загрузки */
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
            {SKELETON_RATIOS.map((r, i) => (
              <div key={i} className="skeleton-pulse mb-4 break-inside-avoid" style={{ aspectRatio: r }} />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="border border-line px-6 py-16 text-center">
            <p className="font-display text-2xl italic text-mut">В этой категории пока нет кадров</p>
            <button
              onClick={() => setActive(FILTER_ALL)}
              className="mt-5 font-mono text-[11px] uppercase tracking-[0.25em] text-acc underline-offset-4 hover:underline"
            >
              Показать все
            </button>
          </div>
        ) : (
          /* key=active перезапускает stagger-анимацию при смене фильтра */
          <div key={active} className="columns-1 gap-4 sm:columns-2 lg:columns-3">
            {visible.map((ph, i) => {
              const proj = projectById.get(ph.project_id);
              const cat = proj ? categoryById.get(proj.category_id) : undefined;
              const ratio = ph.width && ph.height ? `${ph.width}/${ph.height}` : "4/5";
              return (
                /* 3. Карточка: scale-105 на фото + появление названия проекта */
                /* Плавное появление при скролле (IntersectionObserver внутри Reveal);
                   небольшая лесенка задержек по остатку от 6 — волна по колонкам */
                <Reveal key={ph.id} delay={(i % 6) * 60} className="mb-4 break-inside-avoid">
                <figure
                  className="group relative outline-none"
                  tabIndex={0}
                  role="button"
                  aria-label={`Открыть «${proj?.title ?? "кадр"}»`}
                  onClick={() => setLightbox(i)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setLightbox(i);
                    }
                  }}
                >
                  <div className="cursor-pointer overflow-hidden">
                    <Photo
                      src={ph.image_url}
                      alt={proj?.title ?? "Фотография"}
                      ratio={ratio}
                      imgClassName="transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  </div>

                  {/* Номер кадра — всегда виден */}
                  <span className="absolute left-4 top-3.5 z-10 font-mono text-[9px] uppercase tracking-[0.25em] text-ink/85 mix-blend-difference">
                    FR-{String(i + 1).padStart(2, "0")}
                  </span>

                  <FrameCorners className="opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                  {/* Градиент + название проекта появляются при наведении */}
                  <div
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-coal/85 via-coal/15 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    aria-hidden="true"
                  />
                  <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 z-10 translate-y-3 px-4 pb-4 opacity-0 transition-all duration-500 ease-out group-hover:translate-y-0 group-hover:opacity-100">
                    <p className="font-display text-xl font-semibold tracking-tight">
                      {proj?.title ?? "Без названия"}
                    </p>
                    <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.22em] text-ink/75">
                      {cat?.name}
                      {proj?.location ? ` · ${proj.location}` : ""}
                      {proj?.date ? ` · ${proj.date.slice(0, 4)}` : ""}
                    </p>
                  </figcaption>
                </figure>
                </Reveal>
              );
            })}
          </div>
        )}
      </section>

      {lightbox !== null && items.length > 0 && (
        <Lightbox items={items} index={lightbox} onClose={() => setLightbox(null)} onNav={setLightbox} />
      )}
    </div>
  );
}
