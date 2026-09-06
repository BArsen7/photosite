import { LineReveal, Reveal } from "../lib/motion";

/** Манифест: три строки line-mask reveal'ом и заметка на полях. */
export default function Manifesto() {
  const lines = [
    <>Свет важнее сюжета.</>,
    <>
      <span className="outline-text">Пауза</span> — часть ритма.
    </>,
    <>
      Снимаю то, что <span className="text-acc">исчезнет</span>.
    </>,
  ];

  return (
    <section id="approach" className="scroll-mt-20 border-t border-line px-5 py-24 md:px-10 md:py-32">
      <p className="mb-10 font-mono text-[11px] uppercase tracking-[0.35em] text-acc">02 — Подход</p>

      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-8">
          {lines.map((line, i) => (
            <h3
              key={i}
              className="font-display font-extrabold uppercase leading-[1.02] tracking-tight text-[clamp(1.9rem,5.5vw,4.3rem)]"
            >
              <LineReveal delay={i * 140}>{line}</LineReveal>
            </h3>
          ))}
        </div>

        <Reveal delay={200} className="flex flex-col justify-end lg:col-span-4">
          <div className="border-l border-acc pl-6">
            <p className="text-base leading-relaxed text-mut">
              Улица учит реагировать за долю секунды, студия — ждать свет часами.
              Между этими полюсами живёт всё, что я снимаю: люди, бетон, стекло
              и туман над хребтом. Свет дисциплинирует: каждый кадр — решение,
              которое нельзя отложить на «потом».
            </p>
            <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.25em] text-mut">
              — из блокнота, страница 114 · 2024
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
