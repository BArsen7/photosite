import Noise from "./components/Noise";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Ticker from "./components/Ticker";
import Gallery from "./components/Gallery";
import Manifesto from "./components/Manifesto";
import About from "./components/About";
import Services from "./components/Services";
import Exhibitions from "./components/Exhibitions";
import Contact from "./components/Contact";
import Footer from "./components/Footer";

/**
 * Портфолио фотографа Артёма Волкова.
 * Структура: контактный лист (hero) → жанры → работы → манифест
 * → обо мне → услуги → признание → контакт.
 */
export default function App() {
  return (
    <div className="min-h-screen bg-coal font-sans text-ink">
      <Noise />
      <Header />
      <main>
        <Hero />
        <Ticker />
        <Gallery />
        <Manifesto />
        <About />
        <Services />
        <Exhibitions />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
