import { useState } from "react";
import SectionHead from "./SectionHead";
import { PlusIcon } from "./Icons";
import { Reveal } from "../lib/motion";

interface Service {
  title: string;
  price: string;
  desc: string;
  includes: string[];
  term: string;
}

const SERVICES: Service[] = [
  {
    title: "Портрет",
    price: "по запросу",
    desc: "Студия или город — зависит от того, где вы настоящий. Свет ставлю под характер, а не под шаблон.",
    includes: ["1–2 часа съёмки", "15+ кадров в авторской ретуши", "подбор локации и референсов"],
    term: "Готовность — 7 дней",
  },
  {
    title: "Стрит и репортаж",
    price: "по запросу",
    desc: "Событие, фестиваль, городская серия. Работаю незаметно: сюжеты случаются, пока на них не смотрят в упор.",
    includes: ["до 10 часов съёмки", "60+ кадров в обработке", "серия для соцсетей и печати"],
    term: "Готовность — 10 дней",
  },
  {
    title: "Архитектура и интерьер",
    price: "по запросу",
    desc: "Съёмка для бюро, девелоперов и журналов. Геометрия, свет и материал — по паспорту здания и сверх него.",
    includes: ["согласование ракурсов с архитектором", "20+ финальных кадров", "версии под печать и web"],
    term: "Готовность — 14 дней",
  },
  {
    title: "Предмет / Still life",
    price: "по запросу",
    desc: "Постановочная съёмка предметов: от каталожной чистоты до голландского натюрморта с лимоном.",
    includes: ["свет, стилизация, реквизит", "до 30 предметов", "кадры под маркетплейсы и кампейны"],
    term: "Готовность — 7 дней",
  },
];

/** Услуги: аккордеон с фирменным раскрытием через grid-rows (без скачков высоты). */
export default function Services() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="services" className="scroll-mt-20 border-t border-line px-5 py-20 md:px-10 md:py-28">
      <SectionHead no="04 — Услуги" title="Процесс" note="Бриф → съёмка → отбор → ретушь → передача" />

      <div className="border-t border-line">
        {SERVICES.map((s, i) => {
          const isOpen = open === i;
          return (
            <Reveal key={s.title} delay={i * 60}>
              <div className={`border-b border-line transition-colors duration-500 ${isOpen ? "bg-panel/60" : "hover:bg-panel/40"}`}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="group flex w-full items-center gap-5 px-2 py-6 text-left md:gap-8 md:px-6 md:py-7"
                >
                  <span className={`font-mono text-xs tracking-[0.2em] transition-colors duration-300 ${isOpen ? "text-acc" : "text-mut"}`}>
                    0{i + 1}
                  </span>
                  <span className="flex-1 font-display text-2xl font-bold uppercase tracking-tight transition-transform duration-300 md:text-4xl">
                    <span className="inline-block transition-transform duration-300 group-hover:translate-x-2">{s.title}</span>
                  </span>
                  <span className="hidden whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.2em] text-mut sm:block">
                    {s.price}
                  </span>
                  <PlusIcon
                    size={20}
                    className={`shrink-0 transition-transform duration-500 ${isOpen ? "rotate-45 text-acc" : "text-mut"}`}
                  />
                </button>

                {/* grid-rows 0fr→1fr: плавное раскрытие без измерения высоты */}
                <div className={`grid transition-[grid-template-rows] duration-500 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                  <div className="overflow-hidden">
                    <div className="grid gap-6 px-2 pb-8 md:grid-cols-2 md:px-6 md:pl-[4.5rem]">
                      <p className="max-w-md text-sm leading-relaxed text-mut md:text-base">{s.desc}</p>
                      <div>
                        <ul className="space-y-2">
                          {s.includes.map((inc) => (
                            <li key={inc} className="flex items-baseline gap-3 font-mono text-[11px] uppercase tracking-[0.15em] text-ink/80">
                              <span className="h-px w-4 shrink-0 bg-acc" />
                              {inc}
                            </li>
                          ))}
                        </ul>
                        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-acc">{s.term}</p>
                        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-mut sm:hidden">{s.price}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
