import { useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, CloseIcon } from "./Icons";
import { useLockBody } from "../lib/motion";

/** Универсальный элемент лайтбокса (не зависит от источника данных). */
export interface LightboxItem {
  id: string;
  src: string;
  alt: string;
  title: string;
  meta: { label: string; value: string }[];
}

/** Полноэкранный просмотр кадра: клавиатура, зацикленная навигация, мета-лента. */
export default function Lightbox({
  items,
  index,
  onClose,
  onNav,
}: {
  items: LightboxItem[];
  index: number;
  onClose: () => void;
  onNav: (next: number) => void;
}) {
  const item = items[index];
  const n = items.length;
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${item.title} — просмотр`}
      className="lb-in fixed inset-0 z-[70] flex flex-col bg-coal/[0.97]"
      onClick={onClose}
    >
      {/* Верхняя панель */}
      <div className="flex items-center justify-between px-5 py-4 md:px-10" onClick={(e) => e.stopPropagation()}>
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-mut">
          <span className="text-acc">{String(index + 1).padStart(2, "0")}</span> / {String(n).padStart(2, "0")}
          <span className="ml-4 hidden text-ink sm:inline">{item.title}</span>
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

        {/* key=id перезапускает анимацию при навигации */}
        <img
          key={item.id}
          src={item.src}
          alt={item.alt}
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

      {/* Мета-лента (EXIF, локация, жанр) */}
      <div
        className="flex flex-wrap items-start gap-x-10 gap-y-3 border-t border-line px-5 py-4 md:px-10"
        onClick={(e) => e.stopPropagation()}
      >
        {item.meta.map((m) => (
          <div key={m.label}>
            <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-mut">{m.label}</p>
            <p className="mt-1 max-w-56 truncate font-mono text-[11px] text-ink" title={m.value}>
              {m.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
