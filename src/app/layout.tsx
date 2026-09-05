import type { ReactNode } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Noise from "../components/Noise";

/**
 * Аналог app/layout.tsx из Next.js App Router:
 * оборачивает любой маршрут в Navbar + <main> + Footer,
 * добавляет плёночное зерно поверх интерфейса.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-coal font-sans text-ink">
      <Noise />
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
