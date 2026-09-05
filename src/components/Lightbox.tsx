import { useCallback, useEffect } from "react";
import type { Photo } from "../data/photos";
import { GENRES } from "../data/photos";
import { ChevronLeft, ChevronRight, CloseIcon } from "./Icons";
import { useLockBody } from "../lib/motion";

/** Полноэкранный просмотр кадра: клавиатура, зацикленная навигация, EXIF-лента. */
export default function Lightbox({
  photos,
  index,
  onClose,
  onNav,
}: {
  photos: Photo[];
  index: number;
  onClose: () => void;
  onNav: (next: number) => void;
}) {
  const photo = photos[index];
  const n = photos.length;
  useLockBody(true);

  const prev = useCallback(() => onNav((index - 1 + n) % n), [index, n, onNav]);
  const next = useCallback(() => onNav((index + 1) % n), [index, n, onNav]);

  /* Управление с клавиатуры: Esc / стрелки */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, prev, next]);

  const genre = GENRES.find((g) => g.id === photo.genre);

  const exif: Array<[string, string]> = [
    ["Камера", photo.camera],
    ["Объектив", photo.lens],
    ["Диафрагма", `ƒ/${photo.aperture}`],
    ["Выдержка", photo.shutter],
    ["ISO", String(photo.iso)],
    ["Локация", `${photo.location}, ${photo.year}`],
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${photo.title} — просмотр`}
      className="lb-in fixed inset-0 z-[70] flex flex-col bg-coal/[0.97]"
      onClick={onClose}
    >
      {/* Верхняя панель */}
      <div className="flex items-center justify-between px-5 py-4 md:px-10" onClick={(e) => e.stopPropagation()}>
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-mut">
          <span className="text-acc">{String(index + 1).padStart(2, "0")}</span> / {String(n).padStart(2, "0")}
          <span className="ml-4 hidden text-ink sm:inline">{photo.title}</span>
        </p>
        <button
          onClick={onClose}
          aria-label="Закрыть просмотр"
          className="group p-2 text-mut transition-colors hover:text-ink"
        >
          <CloseIcon size={22} className="transition-transform duration-500 group-hover:rotate-90" />
        </button>
      </div>

      {/* Кадр */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-5 pb-4 md:px-20">
        <button
          onClick={(e) => { e.stopPropagation(); prev(); }}
          aria-label="Предыдущий кадр"
          className="absolute left-2 z-10 border border-line bg-coal/70 p-3 text-mut transition-all duration-300 hover:border-acc hover:text-acc md:left-6"
        >
          <ChevronLeft size={20} />
        </button>

        {/* key=index перезапускает анимацию при навигации */}
        <img
          key={photo.id}
          src={photo.src}
          alt={photo.alt}
          onClick={(e) => e.stopPropagation()}
          className="lb-in max-h-full max-w-full object-contain shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
        />

        <button
          onClick={(e) => { e.stopPropagation(); next(); }}
          aria-label="Следующий кадр"
          className="absolute right-2 z-10 border border-line bg-coal/70 p-3 text-mut transition-all duration-300 hover:border-acc hover:text-acc md:right-6"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* EXIF-лента */}
      <div
        className="grid grid-cols-3 gap-x-6 gap-y-3 border-t border-line px-5 py-4 md:grid-cols-6 md:px-10"
        onClick={(e) => e.stopPropagation()}
      >
        {exif.map(([label, value]) => (
          <div key={label}>
            <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-mut">{label}</p>
            <p className="mt-1 truncate font-mono text-[11px] text-ink" title={value}>{value}</p>
          </div>
        ))}
      </div>
      {genre && (
        <p className="sr-only">Жанр: {genre.ru}</p>
      )}
    </div>
  );
}
