import { LogoMark, ArrowUp, TgIcon, IgIcon, MailIcon } from "./Icons";
import { Reveal, usePrefersReducedMotion } from "../lib/motion";

const SOCIALS = [
  { label: "Telegram", href: "https://t.me/volkov_foto", Icon: TgIcon },
  { label: "Instagram", href: "https://instagram.com/volkov.foto", Icon: IgIcon },
  { label: "Email", href: "mailto:hello@volkov.photo", Icon: MailIcon },
];

export default function Footer() {
  const reduced = usePrefersReducedMotion();
  const toTop = () => window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });

  return (
    <footer className="overflow-hidden border-t border-line">
      {/* Гигантский контурный wordmark */}
      <Reveal>
        <p
          className="outline-text pointer-events-none select-none whitespace-nowrap text-center font-display text-[19vw] font-extrabold uppercase leading-[0.82] tracking-tight"
          aria-hidden="true"
        >
          Волков
        </p>
      </Reveal>

      <div className="flex flex-col gap-10 px-5 pb-10 pt-6 md:flex-row md:items-end md:justify-between md:px-10">
        <div className="flex items-center gap-3">
          <LogoMark size={22} className="text-acc" />
          <div className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.22em] text-mut">
            <p>© 2026 Артём Волков</p>
            <p>Сделано в тёмной комнате · без шаблонов</p>
          </div>
        </div>

        <nav className="flex flex-wrap gap-x-7 gap-y-2" aria-label="Навигация в подвале">
          {["Работы", "Подход", "Обо мне", "Услуги", "Выставки", "Контакт"].map((label, i) => (
            <a
              key={label}
              href={`#${["works", "approach", "about", "services", "exhibitions", "contact"][i]}`}
              className="font-mono text-[10px] uppercase tracking-[0.22em] text-mut transition-colors hover:text-acc"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          {SOCIALS.map(({ label, href, Icon }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel="noreferrer"
              aria-label={label}
              className="border border-line p-2.5 text-mut transition-all duration-300 hover:border-acc hover:text-acc"
            >
              <Icon size={17} />
            </a>
          ))}
          <button
            onClick={toTop}
            aria-label="Наверх"
            className="group border border-line p-2.5 text-mut transition-all duration-300 hover:border-ink hover:bg-ink hover:text-coal"
          >
            <ArrowUp size={17} className="transition-transform duration-300 group-hover:-translate-y-0.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}
