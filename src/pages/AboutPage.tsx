import Manifesto from "../components/Manifesto";
import About from "../components/About";
import { usePageMeta } from "../lib/meta";

/** /about — манифест, биография со статистикой, выставки и пресса. */
export default function AboutPage() {
  usePageMeta({
    title: "Обо мне",
    description:
      "Арсений Бабанов — фотограф из Москвы. Снимаю с 2018 года: подход, техника Canon, выставки и конкурсные дипломы.",
  });

  return (
    <div className="pt-20 md:pt-24">
      <Manifesto />
      <About />
    </div>
  );
}
