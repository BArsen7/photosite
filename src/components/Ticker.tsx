import type { CSSProperties } from "react";
import { GENRES } from "../data/photos";
import { DiamondSep } from "./Icons";

/** Бегущая строка жанров. Дублируем ленту дважды — шов невидим, пауза при наведении. */
export default function Ticker() {
  const strip = [...GENRES, ...GENRES];
  return (
    <div className="marquee-zone overflow-hidden border-y border-line bg-panel/60 py-4" aria-hidden="true">
      <div className="anim-marquee flex w-max items-center gap-10" style={{ "--marquee-dur": "30s" } as CSSProperties}>
        {[0, 1].map((copy) => (
          <div key={copy} className="flex items-center gap-10">
            {strip.map((g, i) => (
              <span key={`${copy}-${i}`} className="flex items-center gap-10">
                <span className="font-display text-xl font-bold uppercase tracking-wide md:text-2xl">
                  {g.ru}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-mut">
                  {String(i % GENRES.length + 1).padStart(2, "0")}
                </span>
                <DiamondSep className="text-acc" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
