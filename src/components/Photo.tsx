import { useState } from "react";

/**
 * Аналог <Image> из next/image для Vite-окружения.
 * priority  → loading="eager" + fetchpriority="high"
 * placeholder="blur" → CSS blur-up: кадр проявляетс из размытия, как в кювете проявителя.
 * ratio держит «полку» в сетке до загрузки (CLS = 0).
 */
/* Подсказка браузеру, какую ширину займёт изображение на разных экранах.
   Дефолт рассчитан под masonry-сетку: 3 колонки → 2 → 1. */
const DEFAULT_SIZES = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw";

export default function Photo({
  src,
  alt,
  ratio,
  priority = false,
  sizes = DEFAULT_SIZES,
  className = "",
  imgClassName = "",
}: {
  src: string;
  alt: string;
  ratio: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
  imgClassName?: string;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className={`relative overflow-hidden bg-panel ${className}`}
      style={{ aspectRatio: ratio }}
    >
      {!loaded && <div className="skeleton-pulse absolute inset-0" aria-hidden="true" />}
      <img
        src={src}
        alt={alt}
        sizes={sizes}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        // @ts-expect-error — fetchpriority пока отсутствует в типах React 18
        fetchpriority={priority ? "high" : "auto"}
        onLoad={() => setLoaded(true)}
        className={`h-full w-full object-cover transition-[opacity,transform,filter] duration-700 ease-out ${
          loaded ? "scale-100 opacity-100 blur-none" : "scale-[1.05] opacity-0 blur-xl"
        } ${imgClassName}`}
      />
    </div>
  );
}
