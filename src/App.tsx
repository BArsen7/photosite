import { Suspense, lazy, useEffect } from "react";
import { HashRouter, Route, Routes, useLocation } from "react-router-dom";
import RootLayout from "./app/layout";
import HomePage from "./app/page";
import PortfolioPage from "./pages/PortfolioPage";
import ProjectPage from "./pages/ProjectPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import { RequireAuth, isProtectedPath } from "./middleware";

/**
 * Админка вынесена в отдельные чанки (code splitting): посетители сайта
 * не скачивают страницы «тёмной комнаты» до входа.
 */
const AdminLayout = lazy(() => import("./app/admin/layout"));
const AdminLoginPage = lazy(() => import("./app/admin/login/page"));
const AdminDashboardPage = lazy(() => import("./app/admin/dashboard/page"));
const AdminUploadPage = lazy(() => import("./app/admin/upload/page"));
const AdminProjectsPage = lazy(() => import("./app/admin/projects/page"));
const AdminManagePage = lazy(() => import("./app/admin/manage/page"));
const AdminInquiriesPage = lazy(() => import("./app/admin/inquiries/page"));

/** Сброс прокрутки при смене маршрута. */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

/** Обёртка: публичные страницы живут в витринном layout, /admin/* — в своём. */
function Shell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  return isProtectedPath(pathname) ? <>{children}</> : <RootLayout>{children}</RootLayout>;
}

/** Индикатор подгрузки ленивых чанков админки. */
function AdminFallback() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-5 bg-coal">
      <span className="pulsedot h-2.5 w-2.5 rounded-full bg-acc" aria-hidden="true" />
      <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-mut">
        Проявляем тёмную комнату…
      </p>
    </div>
  );
}

/**
 * Точка входа. HashRouter: приложение раздаётся статически.
 * Админка защищена <RequireAuth> — аналогом Next.js middleware:
 * без сессии любой /admin/* редиректит на /admin/login.
 */
export default function App() {
  return (
    <HashRouter>
      <ScrollToTop />
      <Shell>
        <Suspense fallback={<AdminFallback />}>
          <Routes>
            {/* Публичная витрина */}
            <Route path="/" element={<HomePage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/portfolio/:slug" element={<ProjectPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* Вход — публичный, но вне витринного layout */}
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* Защищённая админка */}
            <Route
              path="/admin"
              element={
                <RequireAuth>
                  <AdminLayout />
                </RequireAuth>
              }
            >
              <Route index element={<AdminDashboardPage />} />
              <Route path="upload" element={<AdminUploadPage />} />
              <Route path="projects" element={<AdminProjectsPage />} />
            <Route path="manage" element={<AdminManagePage />} />
            <Route path="inquiries" element={<AdminInquiriesPage />} />
          </Route>
            <Route path="*" element={<HomePage />} />
          </Routes>
        </Suspense>
      </Shell>
    </HashRouter>
  );
}
