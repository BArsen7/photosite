import { useEffect, useState } from "react";
import { LogoMark, CloseIcon } from "./Icons";
import { useLockBody } from "../lib/motion";

const NAV = [
  { id: "works", label: "Работы" },
  { id: "approach", label: "Подход" },
  { id: "about", label: "Обо мне" },
  { id: "services", label: "Услуги" },
  { id: "exhibitions", label: "Выставки" },
  { id: "contact", label: "Контакт" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("");
  const [menuOpen, setMenuOpen] = useState(false);
  useLockBody(menuOpen);

  /* Фон шапки проявляется после скролла */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Scroll-spy: центральная полоса вьюпорта решает, какая секция активна */
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    NAV.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled ? "border-b border-line bg-coal/85 backdrop-blur-md" : "border-b border-transparent"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-5 md:px-10">
          <a href="#top" className="group flex items-center gap-3" aria-label="Наверх">
            <LogoMark size={26} className="text-acc transition-transform duration-700 group-hover:rotate-90" />
            <span className="font-display text-sm font-bold uppercase tracking-[0.22em]">
              А. Волков
            </span>
          </a>

          <nav className="hidden items-center gap-7 lg:flex" aria-label="Основная навигация">
            {NAV.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`group relative font-mono text-[11px] uppercase tracking-[0.22em] transition-colors duration-300 ${
                  active === item.id ? "text-acc" : "text-mut hover:text-ink"
                }`}
              >
                {item.label}
                <span
                  className={`absolute -bottom-1.5 left-0 h-px bg-acc transition-transform duration-300 ${
                    active === item.id ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                />
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2.5 lg:flex">
            <span className="pulsedot h-1.5 w-1.5 rounded-full bg-acc" />
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-mut">
              Open for booking
            </span>
          </div>

          <button
            onClick={() => setMenuOpen(true)}
            className="flex flex-col gap-1.5 p-2 lg:hidden"
            aria-label="Открыть меню"
          >
            <span className="block h-px w-6 bg-ink" />
            <span className="block h-px w-4 bg-acc" />
            <span className="block h-px w-6 bg-ink" />
          </button>
        </div>
      </header>

      {/* Мобильное меню — полноэкранный «кадр» */}
      <div
        className={`fixed inset-0 z-[60] flex flex-col bg-coal transition-opacity duration-300 lg:hidden ${
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!menuOpen}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-mut">Меню</span>
          <button onClick={() => setMenuOpen(false)} aria-label="Закрыть меню" className="p-2 text-ink hover:text-acc">
            <CloseIcon size={22} />
          </button>
        </div>
        <nav className="flex flex-1 flex-col justify-center gap-1 px-8" aria-label="Мобильная навигация">
          {NAV.map((item, i) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={() => setMenuOpen(false)}
              className={`${menuOpen ? "fadeup" : ""} group flex items-baseline gap-4 border-b border-line py-4`}
              style={{ animationDelay: `${120 + i * 60}ms` }}
            >
              <span className="font-mono text-[10px] text-acc">0{i + 1}</span>
              <span className="font-display text-3xl font-bold uppercase tracking-tight transition-transform duration-300 group-hover:translate-x-2">
                {item.label}
              </span>
            </a>
          ))}
        </nav>
        <p className="px-8 pb-10 font-mono text-[10px] uppercase tracking-[0.25em] text-mut">
          hello@volkov.photo · Москва
        </p>
      </div>
    </>
  );
}
