import { useState, type FormEvent } from "react";
import SectionHead from "./SectionHead";
import { LineReveal, Reveal } from "../lib/motion";
import { submitInquiry } from "../lib/api";
import { GENRES } from "../data/photos";
import { MailIcon, PinIcon, SendIcon, TgIcon, VkIcon, CheckIcon } from "./Icons";

type Status = "idle" | "sending" | "done";
type Errors = Partial<Record<"name" | "email" | "message", string>>;

const inputCls =
  "w-full border-b border-line bg-transparent py-3 font-sans text-base text-ink outline-none transition-colors duration-300 placeholder:text-mut/50 focus:border-acc";
const labelCls = "mb-1 block font-mono text-[10px] uppercase tracking-[0.28em] text-mut";

/** Контакт: форма заявки с валидацией и ощутимыми состояниями отправки. */
export default function Contact() {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Errors>({});
  const [form, setForm] = useState({ name: "", email: "", type: "Портрет", message: "" });
  /* Ханипот: скрытое поле-ловушка для ботов (человек его не видит и не заполняет) */
  const [honeypot, setHoneypot] = useState("");

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k as keyof Errors]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    /* Бот попался в ловушку: показываем «успех», но заявку никуда не пишем */
    if (honeypot.trim()) {
      setStatus("done");
      return;
    }
    const next: Errors = {};
    if (form.name.trim().length < 2) next.name = "Как к вам обращаться?";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) next.email = "Похоже, в email опечатка";
    if (form.message.trim().length < 10) next.message = "Расскажите чуть подробнее — от 10 символов";
    setErrors(next);
    if (Object.keys(next).length) return;

    setStatus("sending");
    /* trim + lowercase — нормализуем данные до записи в `inquiries` */
    await submitInquiry({
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      type: form.type,
      message: form.message.trim(),
    });
    setStatus("done");
  };

  return (
    <section id="contact" className="scroll-mt-20 border-t border-line px-5 py-20 md:px-10 md:py-28">
      <SectionHead no="06 — Контакт" title="Свяжитесь" note="Отвечаю в течение 24 часов" />

      <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
        {/* Левая колонка — призыв и координаты */}
        <div>
          <h3 className="font-display font-extrabold uppercase leading-[0.95] tracking-tight text-[clamp(2.2rem,5vw,4rem)]">
            <LineReveal>Давайте снимем</LineReveal>
            <LineReveal delay={120}>
              <span className="outline-text">то, что</span>
            </LineReveal>
            <LineReveal delay={240}>
              <span className="text-acc">останется.</span>
            </LineReveal>
          </h3>

          <div className="mt-12 space-y-5">
            <a href="mailto:arseniy.babanov@yandex.ru" className="group flex items-center gap-4">
              <MailIcon size={18} className="text-mut transition-colors group-hover:text-acc" />
              <span className="font-mono text-sm tracking-[0.12em] text-ink underline decoration-line underline-offset-8 transition-colors group-hover:decoration-acc">
                arseniy.babanov@yandex.ru
              </span>
            </a>
            <a href="https://t.me/BArsen7" target="_blank" rel="noreferrer" className="group flex items-center gap-4">
              <TgIcon size={18} className="text-mut transition-colors group-hover:text-acc" />
              <span className="font-mono text-sm tracking-[0.12em] text-ink underline decoration-line underline-offset-8 transition-colors group-hover:decoration-acc">
                @BArsen7
              </span>
            </a>
            <a href="https://vk.com/arsen27" target="_blank" rel="noreferrer" className="group flex items-center gap-4">
              <VkIcon size={18} className="text-mut transition-colors group-hover:text-acc" />
              <span className="font-mono text-sm tracking-[0.12em] text-ink underline decoration-line underline-offset-8 transition-colors group-hover:decoration-acc">
                vk.com/arsen27
              </span>
            </a>
            <p className="flex items-center gap-4">
              <PinIcon size={18} className="text-mut" />
              <span className="font-mono text-sm tracking-[0.12em] text-mut">Москва · выезжаю куда угодно</span>
            </p>
          </div>

          <Reveal delay={200} className="mt-12 inline-flex items-center gap-3 border border-line px-5 py-3">
            <span className="pulsedot h-2 w-2 rounded-full bg-acc" />
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink/80">
              Открыт для съёмок · весна—лето 2026
            </span>
          </Reveal>
        </div>

        {/* Правая колонка — форма */}
        <Reveal delay={120}>
          {status === "done" ? (
            <div className="flex h-full min-h-[420px] flex-col items-start justify-center border border-acc/40 bg-panel/60 p-8 md:p-10">
              <CheckIcon size={44} className="text-acc" />
              <p className="mt-6 font-display text-3xl font-bold uppercase tracking-tight">Заявка принята</p>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-mut">
                Спасибо, {form.name || "друг"}! Отвечу на {form.email} в течение 24 часов.
                Пока пишу — можете полистать работы выше.
              </p>
              <button
                onClick={() => {
                  setStatus("idle");
                  setForm({ name: "", email: "", type: "Портрет", message: "" });
                }}
                className="mt-8 font-mono text-[11px] uppercase tracking-[0.25em] text-acc underline underline-offset-8 transition-opacity hover:opacity-70"
              >
                Отправить ещё одну
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="relative border border-line bg-panel/60 p-6 md:p-8">
              {/* Ловушка для ботов: вынесена за экран, скрыта от скринридеров */}
              <input
                type="text"
                name="website"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute -left-[9999px] h-0 w-0 opacity-0"
              />
              <div className="grid gap-7 sm:grid-cols-2">
                <div>
                  <label htmlFor="cf-name" className={labelCls}>Имя *</label>
                  <input
                    id="cf-name"
                    value={form.name}
                    onChange={set("name")}
                    maxLength={80}
                    placeholder="Как вас зовут"
                    className={`${inputCls} ${errors.name ? "border-err" : ""}`}
                  />
                  {errors.name && <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.15em] text-err">{errors.name}</p>}
                </div>
                <div>
                  <label htmlFor="cf-email" className={labelCls}>Email *</label>
                  <input
                    id="cf-email"
                    type="email"
                    value={form.email}
                    onChange={set("email")}
                    maxLength={120}
                    placeholder="you@example.com"
                    className={`${inputCls} ${errors.email ? "border-err" : ""}`}
                  />
                  {errors.email && <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.15em] text-err">{errors.email}</p>}
                </div>
              </div>

              <div className="mt-7">
                <label htmlFor="cf-type" className={labelCls}>Тип съёмки</label>
                <select id="cf-type" value={form.type} onChange={set("type")} className={`${inputCls} cursor-pointer appearance-none`}>
                  {GENRES.map((g) => (
                    <option key={g.id} value={g.ru} className="bg-panel text-ink">
                      {g.ru} / {g.en}
                    </option>
                  ))}
                  <option value="Другое" className="bg-panel text-ink">Другое</option>
                </select>
              </div>

              <div className="mt-7">
                <label htmlFor="cf-msg" className={labelCls}>Сообщение *</label>
                <textarea
                  id="cf-msg"
                  rows={4}
                  value={form.message}
                  onChange={set("message")}
                  maxLength={2000}
                  placeholder="Что, где и когда снимаем? Пара слов о задаче."
                  className={`${inputCls} resize-none ${errors.message ? "border-err" : ""}`}
                />
                <div className="mt-2 flex items-baseline justify-between gap-4">
                  {errors.message ? (
                    <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-err">{errors.message}</p>
                  ) : (
                    <span />
                  )}
                  <p className={`font-mono text-[9px] tracking-[0.15em] transition-colors ${form.message.length > 1800 ? "text-acc" : "text-mut/50"}`}>
                    {form.message.length} / 2000
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={status === "sending"}
                className="group mt-9 flex w-full items-center justify-center gap-4 border border-ink py-4 font-mono text-[11px] uppercase tracking-[0.3em] text-ink transition-all duration-300 hover:bg-ink hover:text-coal disabled:cursor-wait disabled:opacity-60 sm:w-auto sm:px-12"
              >
                {status === "sending" ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border border-acc border-t-transparent" />
                    Проявляется…
                  </>
                ) : (
                  <>
                    Отправить бриф
                    <SendIcon size={16} className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </>
                )}
              </button>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}
