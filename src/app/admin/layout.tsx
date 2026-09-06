import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LogoMark, GridIcon, UploadIcon, LayersIcon, FilmIcon, MailIcon, ExitIcon, CloseIcon } from "../../components/Icons";
import { signOut } from "../../lib/auth";
import { useAdminSession } from "../../middleware";
import { useLockBody } from "../../lib/motion";

const NAV = [
  { to: "/admin", label: "Сводка", Icon: GridIcon, end: true },
  { to: "/admin/upload", label: "Загрузка кадра", Icon: UploadIcon, end: false },
  { to: "/admin/projects", label: "Проекты", Icon: LayersIcon, end: false },
  { to: "/admin/manage", label: "Архив", Icon: FilmIcon, end: false },
  { to: "/admin/inquiries", label: "Заявки", Icon: MailIcon, end: false },
];

/**
 * Защищённый каркас админки: сайдбар слева (шторка на мобильных) +
 * контент из вложенных маршрутов (<Outlet/>). Оборачивается в
 * <RequireAuth> на уровне роутера — без сессии сюда не попасть.
 */
export default function AdminLayout() {
  const { session } = useAdminSession();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  useLockBody(mobileOpen);

  const handleLogout = async () => {
    await signOut();
    navigate("/admin/login", { replace: true });
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      {/* Бренд */}
      <div className="flex items-center gap-3 border-b border-line px-6 py-6">
        <LogoMark size={26} className="text-acc" />
        <div>
          <p className="font-display text-lg font-semibold leading-tight">Тёмная комната</p>
          <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-mut">Админ-панель</p>
        </div>
      </div>

      {/* Навигация */}
      <nav className="flex-1 space-y-1 px-3 py-6" aria-label="Админ-навигация">
        {NAV.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `group relative flex items-center gap-3.5 px-3 py-3 font-mono text-[11px] uppercase tracking-[0.22em] transition-all duration-300 ${
                isActive
                  ? "bg-panel text-acc"
                  : "text-mut hover:bg-panel/60 hover:text-ink"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 bg-acc transition-all duration-300 ${
                    isActive ? "opacity-100" : "opacity-0 group-hover:opacity-40"
                  }`}
                />
                <Icon size={17} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Низ: статус подключения, пользователь, выход */}
      <div className="border-t border-line px-6 py-5">
        <p className="flex items-center gap-2.5 font-mono text-[9px] uppercase tracking-[0.22em]">
          <span className="pulsedot h-1.5 w-1.5 rounded-full bg-[#6fae7a]" aria-hidden="true" />
          <span className="text-[#6fae7a]">Локально · SQLite</span>
        </p>
        <p className="mt-3 truncate font-mono text-[10px] tracking-[0.08em] text-mut" title={session?.email}>
          {session?.email ?? "—"}
        </p>
        <button
          onClick={handleLogout}
          className="group mt-4 flex w-full items-center justify-center gap-2.5 border border-line py-2.5 font-mono text-[10px] uppercase tracking-[0.25em] text-mut transition-all duration-300 hover:border-err hover:text-err"
        >
          <ExitIcon size={15} className="transition-transform duration-300 group-hover:translate-x-0.5" />
          Выйти
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-svh bg-coal">
      {/* Desktop-сайдбар */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-line bg-coal lg:block">
        {sidebar}
      </aside>

      {/* Мобильная верхняя панель */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-coal/95 px-5 py-3.5 backdrop-blur-md lg:hidden">
        <span className="flex items-center gap-2.5">
          <LogoMark size={20} className="text-acc" />
          <span className="font-display text-base font-semibold">Тёмная комната</span>
        </span>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Открыть меню"
          className="flex h-9 w-9 flex-col items-center justify-center gap-1.5"
        >
          <span className="h-px w-5 bg-ink" />
          <span className="h-px w-5 bg-ink" />
          <span className="h-px w-3.5 self-end mr-2 bg-ink" />
        </button>
      </div>

      {/* Мобильная шторка */}
      <div
        className={`fixed inset-0 z-50 bg-coal/70 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMobileOpen(false)}
      >
        <div
          className={`absolute inset-y-0 left-0 w-72 border-r border-line bg-coal shadow-2xl transition-transform duration-400 ease-out ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Закрыть меню"
            className="absolute right-3 top-4 p-2 text-mut hover:text-ink"
          >
            <CloseIcon size={18} />
          </button>
          {sidebar}
        </div>
      </div>

      {/* Контент вложенных маршрутов */}
      <main className="lg:pl-64">
        <Outlet />
      </main>
    </div>
  );
}
