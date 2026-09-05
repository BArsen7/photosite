import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { LogoMark, TgIcon, IgIcon, MailIcon } from "./Icons";
import { useLockBody } from "../lib/motion";

const LINKS = [
  { to: "/portfolio", label: "Portfolio" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

const SOCIALS = [
  { label: "Telegram", href: "https://t.me/volkov_foto", Icon: TgIcon },
  { label: "Instagram", href: "https://instagram.com/volkov.foto", Icon: IgIcon },
  { label: "Email", href: "mailto:hello@volkov.photo", Icon: MailIcon },
];

/** Минималистичная шапка: логотип слева, навигация справа.
 *  Прозрачна над hero, при скролле получает подложку и волосяную линию. */
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useLockBody(open);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled || open
            ? "border-b border-line bg-coal/90 backdrop-blur-md"
            : "border-b border-transparent"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-5 md:px-10">
          {/* Логотип слева */}
          <Link
            to="/"
            className="group flex items-center gap-3"
            aria-label="Artem Volkov — home"
            onClick={() => setOpen(false)}
          >
            <LogoMark size={26} className="text-acc transition-transform duration-500 group-hover:rotate-90" />
            <span className="font-display text-lg font-semibold tracking-wide">
              Artem Volkov
            </span>
          </Link>

          {/* Ссылки справа (desktop) */}
          <nav className="hidden items-center gap-9 md:flex" aria-label="Основная навигация">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `group relative font-mono text-[11px] uppercase tracking-[0.28em] transition-colors duration-300 ${
                    isActive ? "text-acc" : "text-ink/80 hover:text-ink"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {l.label}
                    <span
                      className={`absolute -bottom-1.5 left-0 h-px bg-acc transition-all duration-300 ${
                        isActive ? "w-full" : "w-0 group-hover:w-full"
                      }`}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Бургер (mobile) */}
          <button
            onClick={() => setOpen(!open)}
            aria-label={open ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={open}
            className="relative flex h-10 w-10 items-center justify-center md:hidden"
          >
            <span
              className={`absolute h-px w-6 bg-ink transition-all duration-300 ${
                open ? "rotate-45" : "-translate-y-1"
              }`}
            />
            <span
              className={`absolute h-px w-6 bg-ink transition-all duration-300 ${
                open ? "-rotate-45" : "translate-y-1"
              }`}
            />
          </button>
        </div>
      </header>

      {/* Полноэкранное мобильное меню */}
      <div
        className={`fixed inset-0 z-40 flex flex-col justify-center bg-coal/[0.97] px-8 transition-all duration-500 md:hidden ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <nav className="flex flex-col gap-3" aria-label="Мобильная навигация">
          {LINKS.map((l, i) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `fadeup font-display text-5xl font-semibold uppercase tracking-tight transition-colors ${
                  isActive ? "text-acc" : "text-ink"
                }`
              }
              style={{ animationDelay: `${120 + i * 90}ms` }}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="fadeup mt-12 flex items-center gap-5" style={{ animationDelay: "420ms" }}>
          {SOCIALS.map(({ label, href, Icon }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel="noreferrer"
              aria-label={label}
              className="border border-line p-2.5 text-mut transition-colors duration-300 hover:border-acc hover:text-acc"
            >
              <Icon size={17} />
            </a>
          ))}
          <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.25em] text-mut">
            Moscow · 2026
          </span>
        </div>
      </div>
    </>
  );
}
