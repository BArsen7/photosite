import { Link } from "react-router-dom";
import { GENRES } from "../data/photos";
import { ArrowUpRight, FrameCorners } from "./Icons";

/** Обложка главной: полноэкранный кадр, затемнение, имя по центру. */
const HERO_IMAGE =
  "https://image.qwenlm.ai/generated-images/63cfecc5-6791-4b6d-9663-2a53c23d3f09/_result.png";

export default function Hero() {
  return (
    <section className="relative flex h-svh min-h-[620px] items-center justify-center overflow-hidden">
      {/* Фоновое изображение с медленным «дыханием» Ken Burns */}
      <img
        src={HERO_IMAGE}
        alt="Ночная улица в дождь, фигура с прозрачным зонтом"
        sizes="100vw"
        loading="eager"
        decoding="async"
        // @ts-expect-error — fetchpriority пока отсутствует в типах React 18
        fetchpriority="high"
        className="anim-kenburns absolute inset-0 h-full w-full object-cover"
      />

      {/* Затемнение: равномерное + градиент к краям для читабельности текста */}
      <div className="absolute inset-0 bg-coal/55" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-t from-coal via-transparent to-coal/70" aria-hidden="true" />

      <FrameCorners className="inset-4 md:inset-6" />

      {/* Центральная композиция */}
      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <p className="fadeup mb-7 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.38em] text-ink/85">
          <span className="pulsedot h-1.5 w-1.5 rounded-full bg-acc" aria-hidden="true" />
          Photographer — Moscow
        </p>

        <h1
          className="fadeup font-display text-[clamp(3.4rem,10vw,8.5rem)] font-semibold leading-[0.95] tracking-tight"
          style={{ animationDelay: "120ms" }}
        >
          Artem <span className="italic text-acc">Volkov</span>
        </h1>

        <p
          className="fadeup mt-6 font-display text-lg italic text-ink/85 md:text-2xl"
          style={{ animationDelay: "240ms" }}
        >
          Loving light and capturing moments
        </p>

        <div className="fadeup mt-11" style={{ animationDelay: "360ms" }}>
          <Link
            to="/portfolio"
            className="group inline-flex items-center gap-3 border border-ink/50 px-9 py-4 font-mono text-[11px] uppercase tracking-[0.32em] text-ink transition-all duration-500 hover:border-acc hover:bg-acc hover:text-coal"
          >
            View Portfolio
            <ArrowUpRight
              size={16}
              className="transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-1"
            />
          </Link>
        </div>
      </div>

      {/* Служебные подписи по нижнему краю */}
      <div className="absolute bottom-7 left-6 hidden font-mono text-[10px] uppercase tracking-[0.3em] text-mut md:block">
        {GENRES.map((g) => g.en).join(" · ")}
      </div>
      <div className="absolute bottom-7 right-6 hidden flex-col items-center gap-3 md:flex">
        <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-mut">Scroll</span>
        <span className="block h-12 w-px overflow-hidden bg-line">
          <span className="cue-line block h-full w-full bg-acc" />
        </span>
      </div>
    </section>
  );
}
