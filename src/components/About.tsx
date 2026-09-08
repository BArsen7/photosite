import SectionHead from "./SectionHead";
import { Reveal, useCountUp, useInView } from "../lib/motion";

function Stat({ target, suffix = "", label }: { target: number; suffix?: string; label: string }) {
  const { ref, inView } = useInView<HTMLDivElement>(0.4);
  const value = useCountUp(target, inView);
  return (
    <div ref={ref} className="border border-line bg-panel/50 p-5 transition-colors duration-500 hover:border-acc/60 md:p-6">
      <p className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">
        {value.toLocaleString("ru-RU")}
        <span className="text-acc">{suffix}</span>
      </p>
      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-mut">{label}</p>
    </div>
  );
}

const GEAR = [
  ["Canon R8", "полнокадровая беззеркалка · основная"],
  ["Canon EF 35mm ƒ/2.0", "улица и репортаж"],
  ["Canon RF 24-50mm ƒ/4.5-6.3", "архитектура и поездки"],
  ["Canon EF 75-300mm ƒ/4.0-5.6", "телевик · портрет и детали"],
];

/** Обо мне: липкая левая колонка, справа — биография, счётчики, техника. */
export default function About() {
  return (
    <section id="about" className="scroll-mt-20 border-t border-line px-5 py-20 md:px-10 md:py-28">
      <SectionHead no="03 — Обо мне" title="Арсений Бабанов" note="Москва · с 2018 года" />

      <div className="grid gap-12 lg:grid-cols-12">
        {/* Sticky-колонка */}
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <Reveal>
              <p className="font-display text-2xl font-bold uppercase leading-snug tracking-tight text-ink">
                Фотограф,<br />который сначала<br />смотрит, потом<br /><span className="text-acc">снимает.</span>
              </p>
              <div className="mt-8 space-y-2 font-mono text-[11px] uppercase tracking-[0.2em] text-mut">
                <p>База — Москва</p>
                <p>География — куда доедет свет</p>
                <p>Архив — с 2018 года</p>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Контент */}
        <div className="space-y-12 lg:col-span-8">
          <div className="max-w-2xl space-y-5 text-base leading-relaxed text-mut md:text-lg">
            <Reveal>
              <p>
                Всё началось в 2018 году с первой камеры и долгих прогулок по Москве.
                С тех пор техника сменилась, а принцип остался:{" "}
                <span className="text-ink">кадр должен дышать, а не объяснять</span>.
              </p>
            </Reveal>
            <Reveal delay={100}>
              <p>
                Работаю на стыке документалистики и постановки: улица учит скорости,
                студия — терпению. Снимаю людей, архитектуру и тихие вещи,
                а отдельной любовью остаётся чёрно-белое — графика, в которой
                свет говорит сам за себя.
              </p>
            </Reveal>
            <Reveal delay={180}>
              <p>
                За плечами шесть выставок и дипломы лауреатов фотоконкурсов.
                Верю, что хороший снимок — это пауза, в которой видно, как движется время.
              </p>
            </Reveal>
          </div>

          {/* Счётчики */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <Stat target={8} label="Лет за камерой" />
            <Stat target={6} label="Выставок" />
            <Stat target={4} suffix="+" label="Дипломов лауреата" />
          </div>

          {/* Техника */}
          <Reveal>
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.35em] text-acc">В кофре</p>
            <ul className="divide-y divide-line border-y border-line">
              {GEAR.map(([name, note]) => (
                <li
                  key={name}
                  className="group flex flex-wrap items-baseline justify-between gap-2 py-3.5 transition-all duration-300 hover:pl-3"
                >
                  <span className="font-display text-base font-bold uppercase tracking-wide">{name}</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-mut transition-colors group-hover:text-acc">
                    {note}
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
