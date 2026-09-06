import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getSession, type AdminSession } from "./lib/auth";

/**
 * Защита маршрутов /admin/* (кроме /admin/login).
 *
 * Сессия проверяется у локального API (GET /api/admin/session с JWT).
 * В Next.js этому соответствует серверный middleware:
 *
 *   export async function middleware(request: Request) {
 *     const token = request.cookies.get("session")?.value;
 *     // проверить подпись JWT / сделать запрос к API
 *     if (!token && request.nextUrl.pathname !== "/admin/login")
 *       return NextResponse.redirect(new URL("/admin/login", request.url));
 *   }
 *   export const config = { matcher: ["/admin/:path*"] };
 */
export const ADMIN_PREFIX = "/admin";
export const ADMIN_LOGIN = "/admin/login";

export function isProtectedPath(pathname: string): boolean {
  return pathname === ADMIN_PREFIX || pathname.startsWith(`${ADMIN_PREFIX}/`);
}

type GuardState = "loading" | "ok" | "none";

export function useAdminSession(): { state: GuardState; session: AdminSession | null } {
  const [state, setState] = useState<GuardState>("loading");
  const [session, setSession] = useState<AdminSession | null>(null);

  useEffect(() => {
    let alive = true;
    getSession().then((s) => {
      if (!alive) return;
      setSession(s);
      setState(s ? "ok" : "none");
    });
    return () => {
      alive = false;
    };
  }, []);

  return { state, session };
}

/** Шлюз: пока проверяется сессия — «красная лампа», затем пропуск или редирект. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { state } = useAdminSession();
  const location = useLocation();

  if (state === "loading") {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-5 bg-coal">
        <span className="pulsedot h-2.5 w-2.5 rounded-full bg-acc" aria-hidden="true" />
        <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-mut">
          Проверяем допуск…
        </p>
      </div>
    );
  }

  if (state === "none") {
    /* Запоминаем, куда хотел попасть пользователь — вернём после входа */
    return <Navigate to={ADMIN_LOGIN} replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
