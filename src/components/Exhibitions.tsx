import SectionHead from "./SectionHead";
import { Reveal } from "../lib/motion";
import { ArrowUpRight } from "./Icons";

const SHOWS: Array<[string, string, string]> = [
  ["2025", "«Тишина города»", "Галерея «Среда», Москва · персональная"],
  ["2024", "«Бетон и свет»", "Севкабель Порт, Санкт-Петербург"],
  ["2023", "«Люди в пути»", "ЦСИ «Винзавод», Москва"],
  ["2022", "«Север. Оттепель»", "Арт-резиденция «Сияние», Мурманск"],
  ["2021", "«Двенадцать остановок»", "Фотоклуб «Пространство», Казань"],
];

const PRESS: Array<[string, string, string]> = [
  ["2025", "Bird in Flight", "Портфолио-ревю недели"],
  ["2024", "Афиша Daily", "«10 уличных фотографов, за которыми стоит ходить»"],
  ["2023", "Digital Photo", "Интервью о плёночной дисциплине"],
  ["2022", "Photar", "Разбор серии «Север. Оттепель»"],
  ["2021", "35photo.pro", "Автор недели"],
];

function Row({ year, title, note, delay }: { year: string; title: string; note: string; delay: number }) {
  return (
    <Reveal delay={delay}>
      <div className="group flex cursor-default items-baseline gap-5 border-b border-line py-4 transition-all duration-300 hover:border-acc/50 hover:pl-3">
        <span className="w-12 shrink-0 font-mono text-xs tracking-[0.15em] text-acc">{year}</span>
        <div className="flex-1">
          <p className="font-display text-lg font-bold uppercase tracking-wide transition-colors duration-300 group-hover:text-acc md:text-xl">
            {title}
          </p>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-mut">{note}</p>
        </div>
        <ArrowUpRight size={16} className="shrink-0 -translate-x-1 translate-y-1 text-mut opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:text-acc group-hover:opacity-100" />
      </div>
    </Reveal>
  );
}

export default function Exhibitions() {
  return (
    <section id="exhibitions" className="scroll-mt-20 border-t border-line px-5 py-20 md:px-10 md:py-28">
      <SectionHead no="05 — Признание" title="Выставки и пресса" note="Избранное за пять лет" />

      <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
        <div>
          <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.35em] text-acc">Выставки</p>
          <div className="border-t border-line">
            {SHOWS.map(([y, t, n], i) => (
              <Row key={t} year={y} title={t} note={n} delay={i * 60} />
            ))}
          </div>
        </div>
        <div>
          <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.35em] text-acc">Публикации</p>
          <div className="border-t border-line">
            {PRESS.map(([y, t, n], i) => (
              <Row key={t} year={y} title={t} note={n} delay={i * 60} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
