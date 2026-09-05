import { LineReveal } from "../lib/motion";

/** Единый заголовок секции: номер, крупное имя и служебная заметка справа. */
export default function SectionHead({ no, title, note }: { no: string; title: string; note?: string }) {
  return (
    <div className="mb-12 flex flex-wrap items-end justify-between gap-6 border-b border-line pb-6 md:mb-16">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-acc">{no}</p>
        <h2 className="mt-3 font-display text-4xl font-bold uppercase leading-none tracking-tight md:text-6xl">
          <LineReveal>{title}</LineReveal>
        </h2>
      </div>
      {note && (
        <p className="whitespace-pre-line pb-1 text-right font-mono text-[10px] uppercase leading-relaxed tracking-[0.22em] text-mut">
          {note}
        </p>
      )}
    </div>
  );
}
