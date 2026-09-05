import { Link } from "react-router-dom";
import Hero from "../components/Hero";
import FeaturedProjects from "../components/FeaturedProjects";
import { Reveal } from "../lib/motion";
import { ArrowUpRight } from "../components/Icons";
import { usePageMeta, SITE } from "../lib/meta";

/** Аналог app/page.tsx — главная: hero + избранные проекты + финальный призыв. */
export default function HomePage() {
  /* Аналог export const metadata / generateMetadata */
  usePageMeta({
    title: null,
    description:
      "Artem Volkov — фотограф. Street, портрет, архитектура, натюрморт и пейзаж. Плёнка и средний формат, Москва и не только.",
    image: SITE.image,
  });

  return (
    <>
      <Hero />
      <FeaturedProjects />

      {/* Финальный аккорд страницы */}
      <Reveal>
        <section className="border-t border-line px-5 py-20 text-center md:py-28">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.35em] text-acc">
            Have an idea?
          </p>
          <h2 className="mx-auto max-w-3xl font-display text-3xl font-semibold tracking-tight md:text-5xl">
            Let's make something <span className="italic text-acc">quiet</span> and lasting.
          </h2>
          <Link
            to="/contact"
            className="group mt-9 inline-flex items-center gap-3 border border-ink/50 px-9 py-4 font-mono text-[11px] uppercase tracking-[0.32em] text-ink transition-all duration-500 hover:border-acc hover:bg-acc hover:text-coal"
          >
            Get in touch
            <ArrowUpRight
              size={16}
              className="transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-1"
            />
          </Link>
        </section>
      </Reveal>
    </>
  );
}
