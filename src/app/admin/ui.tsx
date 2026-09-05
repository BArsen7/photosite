import type { ReactNode } from "react";

/** Общий заголовок страниц админки. */
export function PageHead({
  kicker,
  title,
  sub,
  action,
}: {
  kicker: string;
  title: string;
  sub?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
      <div>
        <p className="mb-3 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.32em] text-acc">
          <span className="pulsedot h-1.5 w-1.5 rounded-full bg-acc" aria-hidden="true" />
          {kicker}
        </p>
        <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">{title}</h1>
        {sub && <p className="mt-2 max-w-xl text-sm text-mut">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/** Статусная плашка (успех / предупреждение / ошибка). */
export function Banner({
  tone,
  children,
}: {
  tone: "ok" | "warn" | "err";
  children: ReactNode;
}) {
  const tones = {
    ok: "border-[#6fae7a]/50 bg-[#6fae7a]/[0.07] text-[#8fc79a]",
    warn: "border-acc/50 bg-acc/[0.06] text-acc",
    err: "border-err/50 bg-err/[0.08] text-err",
  };
  return (
    <div role="status" className={`fadeup border px-4 py-3 text-sm ${tones[tone]}`}>
      {children}
    </div>
  );
}

/** Подпись-лейбл для полей форм. */
export function FieldLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block font-mono text-[10px] uppercase tracking-[0.25em] text-mut">
      {children}
    </label>
  );
}

export const inputCls =
  "w-full border border-line bg-panel px-4 py-3 font-mono text-sm text-ink outline-none transition-colors duration-300 placeholder:text-mut/50 focus:border-acc";
