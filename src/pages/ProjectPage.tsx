/**
 * В Next.js App Router это app/portfolio/[slug]/page.tsx (async Server
 * Component + 'use client' для интерактивных частей). Здесь — клиентский
 * аналог на react-router: useParams + fetchPortfolio.
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Photo from "../components/Photo";
import Lightbox, { type LightboxItem } from "../components/Lightbox";
import { FrameCorners, ChevronLeft, PinIcon, ArrowUpRight } from "../components/Icons";
import { LineReveal, Reveal } from "../lib/motion";
import { usePageMeta } from "../lib/meta";
import {
  fetchPortfolio,
  projectSlug,
  type DbPhoto,
  type DbProject,
  type PortfolioData,
} from "../lib/api";

const formatYear = (iso: string | null) => (iso ? iso.slice(0, 4) : "—");

/** Уникальные значения EXIF по всем кадрам проекта — для бейджей. */
function uniqueExif(photos: DbPhoto[]) {
  const cam = new Set<string>();
  const lens = new Set<string>();
  const set = new Set<string>();
  for (const p of photos) {
    if (p.exif_camera) cam.add(p.exif_camera);
    if (p.exif_lens) lens.add(p.exif_lens);
    if (p.exif_settings) set.add(p.exif_settings);
  }
  return {
    cameras: [...cam],
    lenses: [...lens],
    settings: [...set].slice(0, 2), // две характерные комбинации, не простыня
  };
}

function Badge({ label, value }: { label: string; value: string }) {
  return (
    <span className="group/badge inline-flex items-baseline gap-2 border border-line px-3 py-1.5 transition-colors duration-300 hover:border-acc/60">
      <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-mut">{label}</span>
      <span className="font-mono text-[11px] text-ink">{value}</span>
    </span>
  );
}

export default function ProjectPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<PortfolioData | null>(null);
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPortfolio().then((d) => {
      if (!cancelled) setData(d);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const project = useMemo(
    () => data?.projects.find((p) => projectSlug(p) === slug) ?? null,
    [data, slug],
  );

  /* Кадры проекта в порядке sort_order */
  const photos = useMemo(
    () =>
      (data?.photos ?? [])
        .filter((ph) => ph.project_id === project?.id)
        .sort((a, b) => a.sort_order - b.sort_order),
    [data, project],
  );

  const category = useMemo(
    () => data?.categories.find((c) => c.id === project?.category_id) ?? null,
    [data, project],
  );

  /* Соседи по хронологии (проекты уже отсортированы по дате desc) — циклически */
  const { prev, next } = useMemo(() => {
    const list = data?.projects ?? [];
    const i = list.findIndex((p) => p.id === project?.id);
    if (i < 0 || list.length < 2) return { prev: null as DbProject | null, next: null as DbProject | null };
    return {
      prev: list[(i + 1) % list.length],
      next: list[(i - 1 + list.length) % list.length],
    };
  }, [data, project]);

  const exif = useMemo(() => uniqueExif(photos), [photos]);

  /* Аналог generateMetadata({ params }): метаданные строятся из данных проекта.
     Пока данные грузятся — title остаётся базовым, после загрузки обновится. */
  usePageMeta({
    title: project?.title ? `${project.title} — фотопроект` : "Фотопроект",
    description: project?.description,
    image: project?.cover_image_url ?? photos[0]?.image_url,
  });

  const items: LightboxItem[] = useMemo(
    () =>
      photos.map((ph) => {
        const meta: { label: string; value: string }[] = [];
        if (ph.exif_camera) meta.push({ label: "Камера", value: ph.exif_camera });
        if (ph.exif_lens) meta.push({ label: "Объектив", value: ph.exif_lens });
        if (ph.exif_settings) meta.push({ label: "Параметры", value: ph.exif_settings });
        if (project?.location)
          meta.push({ label: "Локация", value: `${project.location} · ${formatYear(project.date)}` });
        return { id: ph.id, src: ph.image_url, alt: `${project?.title ?? "Проект"} — кадр`, title: project?.title ?? "", meta };
      }),
    [photos, project],
  );

  /* ── Состояние загрузки ── */
  if (data === null) {
    return (
      <div className="min-h-svh px-5 pb-24 pt-28 md:px-10">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="skeleton-pulse mb-8 h-4 w-40" />
            <div className="skeleton-pulse mb-6 h-24 w-full" />
            <div className="skeleton-pulse mb-3 h-4 w-3/4" />
            <div className="skeleton-pulse mb-3 h-4 w-2/3" />
            <div className="skeleton-pulse h-4 w-1/2" />
          </div>
          <div className="lg:col-span-8">
            <div className="skeleton-pulse mb-6" style={{ aspectRatio: "3/2" }} />
            <div className="skeleton-pulse" style={{ aspectRatio: "4/5", maxWidth: 480 }} />
          </div>
        </div>
      </div>
    );
  }

  /* ── Проект не найден ── */
  if (!project) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-6 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-acc">Ошибка 404</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight md:text-6xl">
          Кадра <span className="italic text-acc">не проявилось</span>
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-mut">
          Проект с адресом <span className="font-mono text-ink">/{slug}</span> не найден в архиве.
          Возможно, он ещё в тёмной комнате.
        </p>
        <Link
          to="/portfolio"
          className="group inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.28em] text-acc transition-colors hover:text-ink"
        >
          <ChevronLeft size={16} className="transition-transform duration-300 group-hover:-translate-x-1" />
          Вернуться в портфолио
        </Link>
      </div>
    );
  }

  const index = data.projects.findIndex((p) => p.id === project.id);

  return (
    <div className="pb-0 pt-24 md:pt-28">
      <div className="grid gap-12 px-5 md:px-10 lg:grid-cols-12 lg:gap-10">
        {/* ── 1. Текстовый блок: sticky слева, сверху на мобильных ── */}
        <aside className="lg:col-span-4 lg:self-start lg:sticky lg:top-24">
          <Link
            to="/portfolio"
            className="group inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-mut transition-colors duration-300 hover:text-acc"
          >
            <ChevronLeft size={15} className="transition-transform duration-300 group-hover:-translate-x-1" />
            В портфолио
          </Link>

          <div className="mt-8 flex items-center gap-4">
            <span className="border border-acc/50 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.25em] text-acc">
              {category?.name ?? "Серия"}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-mut">
              {String(index + 1).padStart(2, "0")} / {String(data.projects.length).padStart(2, "0")}
            </span>
          </div>

          <h1 className="mt-6 font-display text-[clamp(2.4rem,5vw,4rem)] font-semibold leading-[1.02] tracking-tight">
            <LineReveal>{project.title}</LineReveal>
          </h1>

          {project.description && (
            <Reveal delay={120}>
              <p className="mt-6 max-w-md text-base leading-relaxed text-mut">{project.description}</p>
            </Reveal>
          )}

          {/* Локация и дата */}
          <Reveal delay={180}>
            <div className="mt-8 space-y-3">
              {project.location && (
                <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-ink/80">
                  <PinIcon size={15} className="text-acc" /> {project.location}
                </p>
              )}
              <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-ink/80">
                <span className="h-1.5 w-1.5 bg-acc" aria-hidden="true" />
                {formatYear(project.date)} · {photos.length} кадров
              </p>
            </div>
          </Reveal>

          {/* EXIF-бейджи */}
          <Reveal delay={240}>
            <div className="mt-10 border-t border-line pt-8">
              <p className="mb-4 font-mono text-[9px] uppercase tracking-[0.3em] text-mut">EXIF</p>
              <div className="flex flex-wrap gap-2">
                {exif.cameras.map((c) => (
                  <Badge key={c} label="Камера" value={c} />
                ))}
                {exif.lenses.map((l) => (
                  <Badge key={l} label="Объектив" value={l} />
                ))}
                {exif.settings.map((s) => (
                  <Badge key={s} label="Съёмка" value={s} />
                ))}
              </div>
            </div>
          </Reveal>
        </aside>

        {/* ── 2. Вертикальная галерея проекта ── */}
        <section className="lg:col-span-8" aria-label={`Фотографии проекта «${project.title}»`}>
          <div className="space-y-10 md:space-y-14">
            {photos.map((ph, i) => {
              const ratio = ph.width && ph.height ? `${ph.width}/${ph.height}` : "4/5";
              /* Чётные кадры сужаем и смещаем — ритм «ленты плёнки», не монотонный столбец */
              const offset =
                i % 3 === 1 ? "lg:ml-[12%]" : i % 3 === 2 ? "lg:max-w-[78%] lg:ml-auto" : "";
              return (
                <Reveal key={ph.id} delay={Math.min(i, 3) * 90} className={offset}>
                  <figure
                    className="group relative outline-none"
                    tabIndex={0}
                    role="button"
                    aria-label={`Открыть кадр ${i + 1} из ${photos.length}`}
                    onClick={() => setLightbox(i)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setLightbox(i);
                      }
                    }}
                  >
                    <div className="cursor-zoom-in overflow-hidden">
                      <Photo
                        src={ph.image_url}
                        alt={`${project.title} — кадр ${i + 1}`}
                        ratio={ratio}
                        /* Галерея занимает 8 из 12 колонок на десктопе */
                        sizes="(min-width: 1024px) 64vw, 100vw"
                        imgClassName="transition-transform duration-700 ease-out group-hover:scale-[1.035]"
                      />
                    </div>
                    <FrameCorners className="opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                    {/* Подпись под кадром: номер и параметры */}
                    <figcaption className="mt-3 flex items-baseline justify-between font-mono text-[9px] uppercase tracking-[0.22em] text-mut">
                      <span>
                        {String(i + 1).padStart(2, "0")} <span className="text-mut/50">/</span>{" "}
                        {String(photos.length).padStart(2, "0")}
                      </span>
                      <span className="truncate pl-4">{ph.exif_settings}</span>
                    </figcaption>
                  </figure>
                </Reveal>
              );
            })}
          </div>
        </section>
      </div>

      {/* ── 4. Навигация между проектами ── */}
      {prev && next && (
        <nav className="mt-20 grid border-t border-line lg:grid-cols-2" aria-label="Навигация по проектам">
          <ProjectNavLink to={projectSlug(prev)} label="← Предыдущий проект" p={prev} align="left" />
          <ProjectNavLink to={projectSlug(next)} label="Следующий проект →" p={next} align="right" />
        </nav>
      )}

      {/* ── 3. Лайтбокс с листанием и Esc ── */}
      {lightbox !== null && (
        <Lightbox items={items} index={lightbox} onClose={() => setLightbox(null)} onNav={setLightbox} />
      )}
    </div>
  );
}

/** Ссылка на соседний проект: превью обложки проявляется при наведении. */
function ProjectNavLink({
  to,
  label,
  p,
  align,
}: {
  to: string;
  label: string;
  p: DbProject;
  align: "left" | "right";
}) {
  return (
    <Link
      to={`/portfolio/${to}`}
      className={`group relative block overflow-hidden px-5 py-10 transition-colors duration-500 hover:bg-panel md:px-10 ${
        align === "right" ? "lg:border-l lg:border-line lg:text-right" : ""
      }`}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-mut transition-colors duration-300 group-hover:text-acc">
        {label}
      </p>
      <p className="mt-3 font-display text-3xl font-semibold tracking-tight transition-transform duration-500 md:text-4xl">
        <span
          className={`inline-block transition-transform duration-500 ${
            align === "left"
              ? "group-hover:-translate-x-2"
              : "group-hover:translate-x-2"
          }`}
        >
          {p.title}
        </span>
      </p>
      <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.22em] text-mut">
        {formatYear(p.date)}
        {p.location ? ` · ${p.location}` : ""}
      </p>

      {/* Плавающее превью обложки за курсором (desktop) */}
      {p.cover_image_url && (
        <span
          className="pointer-events-none absolute top-1/2 z-10 hidden w-44 -translate-y-1/2 rotate-3 border border-line opacity-0 shadow-2xl shadow-black/60 transition-all duration-300 group-hover:rotate-0 group-hover:opacity-100 lg:block"
          style={align === "left" ? { right: "8%" } : { left: "8%" }}
          aria-hidden="true"
        >
          <img
            src={p.cover_image_url}
            alt=""
            sizes="176px"
            loading="lazy"
            decoding="async"
            className="block h-52 w-full object-cover"
          />
        </span>
      )}

      <ArrowUpRight
        size={18}
        className={`absolute top-8 text-mut opacity-0 transition-all duration-300 group-hover:text-acc group-hover:opacity-100 ${
          align === "left" ? "right-8" : "left-8"
        }`}
      />
    </Link>
  );
}
