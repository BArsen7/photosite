import { Link } from "react-router-dom";
import Photo from "./Photo";
import { ArrowUpRight } from "./Icons";
import { Reveal } from "../lib/motion";
import { FEATURED_PROJECTS } from "../data/projects";

/** «Featured Projects»: сетка из трёх избранных проектов (моковые данные).
 *  Средняя карточка слегка смещена вниз — ритм, а не ровный ряд. */
export default function FeaturedProjects() {
  return (
    <section className="px-5 py-20 md:px-10 md:py-28">
      <Reveal className="mb-14 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.35em] text-acc">
            Selected works
          </p>
          <h2 className="font-display text-4xl font-semibold tracking-tight md:text-6xl">
            Featured <span className="italic text-acc">Projects</span>
          </h2>
        </div>
        <Link
          to="/portfolio"
          className="group flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-mut transition-colors duration-300 hover:text-acc"
        >
          View all
          <ArrowUpRight
            size={16}
            className="transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
          />
        </Link>
      </Reveal>

      {/* mobile-first: одна колонка, от md — три */}
      <div className="grid gap-x-6 gap-y-16 md:grid-cols-3">
        {FEATURED_PROJECTS.map((p, i) => (
          <Reveal key={p.id} delay={i * 130} className={i === 1 ? "md:translate-y-10" : ""}>
            <Link to={`/portfolio/${p.id}`} className="group block" aria-label={`Проект «${p.title}»`}>
              <div className="relative overflow-hidden">
                <Photo
                  src={p.cover}
                  alt={`${p.title} — обложка проекта`}
                  ratio="3/4"
                  imgClassName="transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                />

                {/* Номер проекта */}
                <span className="absolute left-4 top-4 z-10 font-mono text-[10px] tracking-[0.25em] text-ink/90 mix-blend-difference">
                  0{i + 1}
                </span>

                {/* Затемнение + «View project» появляются при наведении */}
                <div
                  className="absolute inset-0 bg-gradient-to-t from-coal/75 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  aria-hidden="true"
                />
                <span className="absolute bottom-4 right-4 z-10 flex translate-y-2 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-acc opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                  View project <ArrowUpRight size={14} />
                </span>
              </div>

              <div className="mt-5 flex items-baseline justify-between gap-4">
                <h3 className="font-display text-2xl font-semibold tracking-tight transition-colors duration-300 group-hover:text-acc">
                  {p.title}
                </h3>
                <span className="font-mono text-[10px] tracking-[0.2em] text-mut">{p.year}</span>
              </div>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-mut">
                {p.category} · {p.location}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-mut">{p.description}</p>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
