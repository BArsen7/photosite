import { useEffect } from "react";
import { HashRouter, Route, Routes, useLocation } from "react-router-dom";
import RootLayout from "./app/layout";
import HomePage from "./app/page";
import PortfolioPage from "./pages/PortfolioPage";
import ProjectPage from "./pages/ProjectPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";

/** Сброс прокрутки при смене маршрута. */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

/**
 * Точка входа. HashRouter выбран осознанно: приложение раздаётся
 * статически (dist/index.html), и hash-маршруты работают без
 * серверных rewrite-правил (в Next.js их роль играет App Router).
 */
export default function App() {
  return (
    <HashRouter>
      <ScrollToTop />
      <RootLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/portfolio/:slug" element={<ProjectPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </RootLayout>
    </HashRouter>
  );
}
