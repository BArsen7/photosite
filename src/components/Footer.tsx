import { Link } from "react-router-dom";
import { LogoMark, TgIcon, IgIcon, MailIcon } from "./Icons";

const NAV = [
  { to: "/portfolio", label: "Portfolio" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
  { to: "/admin", label: "Admin" },
];

const SOCIALS = [
  { label: "Telegram", href: "https://t.me/volkov_foto", Icon: TgIcon },
  { label: "Instagram", href: "https://instagram.com/volkov.foto", Icon: IgIcon },
  { label: "Email", href: "mailto:hello@volkov.photo", Icon: MailIcon },
];

/** Подвал: копирайт слева, навигация по центру, соцсети справа. */
export default function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="flex flex-col items-center gap-6 px-5 py-9 md:flex-row md:justify-between md:px-10">
        <div className="flex items-center gap-3">
          <LogoMark size={20} className="text-acc" />
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-mut">
            © 2026 Artem Volkov · All frames reserved
          </p>
        </div>

        <nav className="flex gap-8" aria-label="Навигация в подвале">
          {NAV.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="font-mono text-[10px] uppercase tracking-[0.22em] text-mut transition-colors duration-300 hover:text-acc"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {SOCIALS.map(({ label, href, Icon }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel="noreferrer"
              aria-label={label}
              className="border border-line p-2.5 text-mut transition-all duration-300 hover:-translate-y-0.5 hover:border-acc hover:text-acc"
            >
              <Icon size={16} />
            </a>
          ))}
        </div>
      </div>

      <p className="border-t border-line/60 py-4 text-center font-display text-xs italic text-mut/80">
        Loving light and capturing moments
      </p>
    </footer>
  );
}
