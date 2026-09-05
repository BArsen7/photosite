import { useEffect, useMemo, useState } from "react";
import SectionHead from "./SectionHead";
import Photo from "./Photo";
import Lightbox from "./Lightbox";
import { FrameCorners } from "./Icons";
import { fetchPhotos } from "../lib/api";
import { GENRES, type Genre, type Photo as PhotoType } from "../data/photos";

type Filter = "all" | Genre;

const SKELETON_RATIOS = ["16/9", "4/5", "1/1", "4/5", "16/10", "4/5"];

/** Портфолио: фильтруемая «масонри»-сетка с лайтбоксом. */
export default function Gallery() {
  const [photos, setPhotos] = useState<PhotoType[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPhotos().then((data) => {
      if (!cancelled) setPhotos(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(
    () => (photos ?? []).filter((p) => filter === "all" || p.genre === filter),
    [photos, filter],
  );

  const countOf = (f: Filter) =>
    f === "all" ? photos?.length ?? 0 : photos?.filter((p) => p.genre === f).length ?? 0;

  return (
    <section id="works" className="scroll-mt-20 px-5 py-20 md:px-10 md:py-28">
      <SectionHead no="01 — Портфолио" title="Работы" note={`Кадры · 2021—2025\nПлёнка + цифра`} />

      {/* Фильтр по жанрам */}
      <div className="mb-10 flex flex-wrap items-center gap-x-7 gap-y-3" role="tablist" aria-label="Фильтр по жанрам">
        {([{ id: "all" as Filter, en: "Все" }, ...GENRES] as Array<{ id: Filter; en: string }>).map((g) => {
          const isActive = filter === g.id;
          return (
            <button
              key={g.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setFilter(g.id)}
              className={`group flex items-baseline gap-2 font-mono text-[11px] uppercase tracking-[0.22em] transition-colors duration-300 ${
                isActive ? "text-acc" : "text-mut hover:text-ink"
              }`}
            >
              <span className="relative">
                {g.en}
                <span
                  className={`absolute -bottom-1 left-0 h-px bg-acc transition-transform duration-300 ${
                    isActive ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                />
              </span>
              <sup className={`text-[9px] ${isActive ? "text-acc" : "text-mut/70"}`}>{countOf(g.id)}</sup>
            </button>
          );
        })}
      </div>

      {/* Сетка: key=filter перезапускает stagger-анимацию при смене фильтра */}
      {photos === null ? (
        <div className="columns-1 gap-5 sm:columns-2 xl:columns-3">
          {SKELETON_RATIOS.map((r, i) => (
            <div key={i} className="skeleton-pulse mb-5 break-inside-avoid" style={{ aspectRatio: r }} />
          ))}
        </div>
      ) : (
        <div key={filter} className="columns-1 gap-5 sm:columns-2 xl:columns-3">
          {filtered.map((p, i) => {
            const genre = GENRES.find((g) => g.id === p.genre)!;
            return (
              <figure
                key={p.id}
                className="fadeup group relative mb-5 break-inside-avoid cursor-pointer outline-none"
                style={{ animationDelay: `${i * 55}ms` }}
                tabIndex={0}
                role="button"
                aria-label={`Открыть «${p.title}»`}
                onClick={() => setLightbox(i)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setLightbox(i);
                  }
                }}
              >
                <Photo
                  src={p.src}
                  alt={p.alt}
                  ratio={p.ratio}
                  imgClassName="transition-transform duration-700 ease-out group-hover:scale-[1.045]"
                />

                {/* Номер кадра — всегда виден, как на контактном листе */}
                <span className="absolute left-4 top-3.5 z-10 font-mono text-[9px] uppercase tracking-[0.25em] text-ink/80 mix-blend-difference">
                  FR-{String(i + 1).padStart(2, "0")}
                </span>

                <FrameCorners className="opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                {/* Инфо-планка выезжает снизу */}
                <figcaption className="absolute inset-x-0 bottom-0 z-10 flex translate-y-full items-center justify-between gap-4 bg-coal/85 px-4 py-3 backdrop-blur-sm transition-transform duration-500 ease-out group-hover:translate-y-0 group-focus-visible:translate-y-0">
                  <span className="font-display text-sm font-bold uppercase tracking-wide">{p.title}</span>
                  <span className="whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.2em] text-mut">
                    {genre.en} · {p.location} · {p.year}
                  </span>
                </figcaption>
              </figure>
            );
          })}
        </div>
      )}

      {lightbox !== null && filtered.length > 0 && (
        <Lightbox
          photos={filtered}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onNav={setLightbox}
        />
      )}
    </section>
  );
}
