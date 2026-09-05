import { useEffect, useRef, useState, type ReactNode } from "react";

/* Единый источник правды о prefers-reduced-motion. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/* Однократный IntersectionObserver: элемент вошёл во вьюпорт? */
export function useInView<T extends HTMLElement>(threshold = 0.12) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* Обёртка scroll-reveal: добавляет .rv / .rv-in (стили в index.css). */
export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`rv ${inView ? "rv-in" : ""} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

/* Line-mask reveal: строка выезжает из-под невидимой маски. */
export function LineReveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, inView } = useInView<HTMLSpanElement>(0.3);
  return (
    <span ref={ref} className={`rv-line ${inView ? "rv-in" : ""} ${className}`}>
      <span style={delay ? { transitionDelay: `${delay}ms` } : undefined}>{children}</span>
    </span>
  );
}

const SCRAMBLE_CHARS = "█▓▒░/\\+×#—";

/**
 * Scramble-decode: текст «проявляется» из шума, как печать в фотолаборатории.
 * При prefers-reduced-motion сразу отдаёт готовую строку.
 */
export function useScramble(text: string, delayMs = 0): string {
  const [out, setOut] = useState(text);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) {
      setOut(text);
      return;
    }
    let frame = 0;
    let raf = 0;
    const total = Math.max(16, text.length * 4); // кадров анимации
    const tick = () => {
      frame += 1;
      const locked = Math.floor((frame / total) * text.length);
      let s = "";
      for (let i = 0; i < text.length; i += 1) {
        const ch = text[i];
        s += ch === " " || i < locked ? ch : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
      }
      setOut(frame < total ? s : text);
      if (frame < total) raf = requestAnimationFrame(tick);
    };
    const timer = window.setTimeout(() => {
      raf = requestAnimationFrame(tick);
    }, delayMs);
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [text, delayMs, reduced]);

  return out;
}

/* Плавный count-up для статистики, запускается при входе во вьюпорт. */
export function useCountUp(target: number, active: boolean, duration = 1500): number {
  const [value, setValue] = useState(0);
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    if (!active) return;
    if (reduced) {
      setValue(target);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3)))); // easeOutCubic
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration, reduced]);
  return value;
}

/* Блокировка прокрутки body (лайтбокс, мобильное меню). */
export function useLockBody(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);
}
