import { useEffect } from "react";
import { HashRouter, Route, Routes, useLocation } from "react-router-dom";
import RootLayout from "./app/layout";
import HomePage from "./app/page";
import PortfolioPage from "./pages/PortfolioPage";
import ProjectPage from "./pages/ProjectPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import AdminLayout from "./app/admin/layout";
import AdminLoginPage from "./app/admin/login/page";
import AdminDashboardPage from "./app/admin/dashboard/page";
import AdminUploadPage from "./app/admin/upload/page";
import AdminProjectsPage from "./app/admin/projects/page";
import AdminManagePage from "./app/admin/manage/page";
import { RequireAuth, isProtectedPath } from "./middleware";

/** Сброс прокрутки при смене маршрута (кроме внутренних переходов админки). */
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
          </Route>

          <Route path="*" element={<HomePage />} />
        </Routes>
      </Shell>
    </HashRouter>
  );
}
