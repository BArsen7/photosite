import Manifesto from "../components/Manifesto";
import About from "../components/About";
import Exhibitions from "../components/Exhibitions";
import { usePageMeta } from "../lib/meta";

/** /about — манифест, биография со статистикой, выставки и пресса. */
export default function AboutPage() {
  usePageMeta({
    title: "Обо мне",
    description:
      "Артём Волков — фотограф из Москвы. Подход, техника, статистика, выставки и публикации с 2021 года.",
  });

  return (
    <div className="pt-20 md:pt-24">
      <Manifesto />
      <About />
      <Exhibitions />
    </div>
  );
}
