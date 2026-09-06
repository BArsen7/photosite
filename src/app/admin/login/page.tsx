import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { LogoMark, ArrowUpRight, CheckIcon } from "../../../components/Icons";
import { signIn } from "../../../lib/auth";
import { usePageMeta } from "../../../lib/meta";
import { useAdminSession } from "../../../middleware";

/**
 * /admin/login — вход в локальную админку (JWT выдаёт контейнер app).
 * Учётные данные создаются при первом запуске сервера:
 * свои — через ADMIN_EMAIL/ADMIN_PASSWORD, иначе пароль виден в `docker compose logs app`.
 */
export default function AdminLoginPage() {
  const { state, session } = useAdminSession();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  /* Пауза после перебора дублирует серверный rate limit и бережно к батарее кнопок */
  const [attempts, setAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (lockUntil <= Date.now()) return;
    const t = window.setInterval(() => setNow(Date.now()), 400);
    return () => window.clearInterval(t);
  }, [lockUntil]);

  const lockSecs = Math.max(0, Math.ceil((lockUntil - now) / 1000));
  const locked = lockSecs > 0;

  usePageMeta({ title: "Админка — вход", noindex: true });

  if (state === "ok" && session) return <Navigate to={from} replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (locked) {
      setError(`Слишком много попыток — подождите ${lockSecs} с`);
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Похоже, в email опечатка");
      return;
    }
    if (password.length < 6) {
      setError("Пароль — минимум 6 символов");
      return;
    }
    setBusy(true);
    const res = await signIn(email.trim().toLowerCase(), password);
    setBusy(false);
    if (res.ok) {
      navigate(from, { replace: true });
    } else {
      const n = attempts + 1;
      if (n >= 5 || /подождите/i.test(res.error)) {
        setLockUntil(Date.now() + 30_000);
        setNow(Date.now());
        setAttempts(0);
        setError("Слишком много попыток входа — пауза 30 секунд");
      } else {
        setAttempts(n);
        setError(`${res.error} · попытка ${n} из 5`);
      }
    }
  };

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Левая панель — «вход в тёмную комнату» */}
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-line bg-panel/40 p-10 lg:flex">
        <div className="flex items-center gap-3">
          <LogoMark size={28} className="text-acc" />
          <div>
            <p className="font-display text-xl font-semibold leading-tight">Арсений Бабанов</p>
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-mut">Фотограф</p>
          </div>
        </div>

        <div>
          <p className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.35em] text-acc">
            <span className="pulsedot h-1.5 w-1.5 rounded-full bg-err" aria-hidden="true" />
            Красная лампа горит
          </p>
          <h1 className="mt-6 font-display text-[clamp(3rem,5.5vw,5.5rem)] font-semibold leading-[0.95] tracking-tight">
            Тёмная<br />
            <span className="italic text-acc">комната</span>
          </h1>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-mut">
            Служебный вход для работы с архивом: загрузка кадров,
            управление проектами и заявками. Всё хранится локально —
            база и файлы лежат прямо на сервере.
          </p>
        </div>

        <Link
          to="/"
          className="group inline-flex w-max items-center gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-mut transition-colors hover:text-acc"
        >
          Вернуться на сайт
          <ArrowUpRight size={14} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </aside>

      {/* Форма */}
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <LogoMark size={26} className="text-acc" />
          </div>

          <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-acc">Служебный доступ</p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">Вход</h2>
          <p className="mt-3 text-sm text-mut">Локальная учётная запись администратора.</p>

          <div className="mt-6 border border-line bg-panel/50 px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-acc">Первый вход</p>
            <p className="mt-1.5 text-xs leading-relaxed text-mut">
              Email и пароль создаются при первом запуске: задайте их переменными
              <span className="font-mono text-ink"> ADMIN_EMAIL / ADMIN_PASSWORD</span> или
              посмотрите сгенерированный пароль в логе контейнера app.
            </p>
          </div>

          {error && (
            <div role="alert" className="mt-6 border border-err/50 bg-err/[0.08] px-4 py-3 text-sm text-err">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-8 space-y-6" noValidate>
            <div>
              <label htmlFor="adm-email" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.25em] text-mut">
                Email
              </label>
              <input
                id="adm-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@localhost"
                className="w-full border border-line bg-panel px-4 py-3 font-mono text-sm text-ink outline-none transition-colors duration-300 placeholder:text-mut/50 focus:border-acc"
              />
            </div>
            <div>
              <label htmlFor="adm-pass" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.25em] text-mut">
                Password
              </label>
              <input
                id="adm-pass"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-line bg-panel px-4 py-3 font-mono text-sm text-ink outline-none transition-colors duration-300 placeholder:text-mut/50 focus:border-acc"
              />
            </div>
            <button
              type="submit"
              disabled={busy || locked}
              className="group flex w-full items-center justify-center gap-3 border border-ink/50 py-3.5 font-mono text-[11px] uppercase tracking-[0.3em] text-ink transition-all duration-400 hover:border-acc hover:bg-acc hover:text-coal disabled:cursor-wait disabled:opacity-60"
            >
              {locked ? (
                <>
                  <span className="pulsedot h-1.5 w-1.5 rounded-full bg-err" aria-hidden="true" />
                  Пауза · {lockSecs} с
                </>
              ) : busy ? (
                <>
                  <span className="pulsedot h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                  Открываем дверь…
                </>
              ) : (
                <>
                  Войти
                  <CheckIcon size={15} className="opacity-0 transition-all duration-300 group-hover:opacity-100" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center font-mono text-[9px] uppercase tracking-[0.22em] text-mut/70">
            Сессия проверяется на всех /admin/* · JWT 7 дней
          </p>
        </div>
      </div>
    </div>
  );
}
