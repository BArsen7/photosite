import Photo from "./Photo";
import { PHOTOS } from "../data/photos";
import { useScramble } from "../lib/motion";
import { FrameCorners } from "./Icons";

/** Открытие — полный кадр с EXIF-паспортом снимка, как на контактном листе. */
export default function Hero() {
  const hero = PHOTOS[0];
  const line1 = useScramble("Артём", 350);
  const line2 = useScramble("Волков", 750);

  return (
    <section id="top" className="relative h-svh min-h-[620px] overflow-hidden">
      {/* Фоновый кадр с медленным «дыханием» Ken Burns */}
      <div className="absolute inset-0">
        <Photo
          src={hero.src}
          alt={hero.alt}
          ratio="16/9"
          priority
          className="absolute inset-0"
          imgClassName="anim-kenburns"
        />
      </div>

      {/* Затемнение к краям — типографика остаётся читаемой */}
      <div className="absolute inset-0 bg-gradient-to-t from-coal via-coal/25 to-coal/60" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-r from-coal/70 via-transparent to-transparent" aria-hidden="true" />

      <FrameCorners className="inset-4 md:inset-6" />

      {/* Паспорт кадра справа сверху */}
      <div className="absolute right-8 top-24 hidden text-right font-mono text-[10px] uppercase leading-relaxed tracking-[0.22em] text-ink/80 md:block">
        <p className="text-acc">FR-01 · Неглинная, дождь</p>
        <p>{hero.camera} · {hero.lens}</p>
        <p>ƒ/{hero.aperture} · {hero.shutter} · ISO {hero.iso}</p>
        <p className="text-mut">Kodak Tri-X 400 @ 1600</p>
      </div>

      {/* Вертикальная подпись на срезе кадра */}
      <p
        className="absolute right-8 top-1/2 hidden -translate-y-1/2 font-mono text-[10px] uppercase tracking-[0.5em] text-mut md:block"
        style={{ writingMode: "vertical-rl" }}
      >
        Москва — Тбилиси — Берлин
      </p>

      {/* Имя — scramble-decode в две строки, прижато к левому нижнему углу */}
      <div className="absolute bottom-0 left-0 w-full px-5 pb-8 md:px-10 md:pb-12">
        <p className="mb-4 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.35em] text-ink/85">
          Фотограф · улицы / люди / свет
          <span className="blinkc inline-block h-3.5 w-2 bg-acc" aria-hidden="true" />
        </p>
        <h1 className="font-display font-extrabold uppercase leading-[0.88] tracking-tight">
          <span className="block text-[clamp(3.2rem,11vw,9rem)]">{line1}</span>
          <span className="outline-text block text-[clamp(3.2rem,11vw,9rem)]">{line2}</span>
        </h1>
      </div>

      {/*Scroll cue */}
      <div className="absolute bottom-8 right-8 hidden flex-col items-center gap-3 md:flex">
        <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-mut">Scroll</span>
        <span className="block h-14 w-px overflow-hidden bg-line">
          <span className="cue-line block h-full w-full bg-acc" />
        </span>
      </div>
    </section>
  );
}
