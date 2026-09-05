import Manifesto from "../components/Manifesto";
import About from "../components/About";
import Exhibitions from "../components/Exhibitions";

/** /about — манифест, биография со статистикой, выставки и пресса. */
export default function AboutPage() {
  return (
    <div className="pt-20 md:pt-24">
      <Manifesto />
      <About />
      <Exhibitions />
    </div>
  );
}
