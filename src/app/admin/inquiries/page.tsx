import { useEffect, useState } from "react";
import { PageHead } from "../ui";
import ConfirmDialog from "../../../components/ConfirmDialog";
import { TrashIcon, MailIcon } from "../../../components/Icons";
import { fetchInquiries, deleteInquiry, type DbInquiry } from "../../../lib/api";

const fmtDate = (d?: string) =>
  d ? new Date(d.replace(" ", "T")).toLocaleString("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

/** /admin/inquiries — заявки, пришедшие с формы контактов. */
export default function AdminInquiriesPage() {
  const [items, setItems] = useState<DbInquiry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<DbInquiry | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchInquiries()
      .then((list) => {
        if (!cancelled) setItems(list);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Не удалось загрузить заявки");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const confirmDelete = async () => {
    if (!pending) return;
    const target = pending;
    setPending(null);
    try {
      await deleteInquiry(target.id);
      setItems((list) => (list ? list.filter((i) => i.id !== target.id) : list));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось удалить заявку");
    }
  };

  return (
    <div className="px-6 py-10 md:px-10">
      <PageHead
        kicker="Тёмная комната · Заявки"
        title="Заявки с сайта"
        sub="Сообщения из формы контактов: имя, email, тип съёмки и текст. Отвечайте по email или в Telegram."
      />

      {error && (
        <div role="alert" className="mb-6 border border-err/50 bg-err/[0.08] px-4 py-3 text-sm text-err">
          {error}
        </div>
      )}

      {items === null ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton-pulse h-28" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="border border-line px-6 py-16 text-center">
          <MailIcon size={28} className="mx-auto text-mut" />
          <p className="mt-4 font-display text-2xl italic text-mut">Пока ни одной заявки</p>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-mut/70">
            Они появятся здесь сразу после отправки формы на сайте
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item, i) => (
            <li
              key={item.id}
              className="fadeup group border border-line bg-panel/40 transition-colors duration-300 hover:border-acc/50"
              style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
            >
              <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 border-b border-line/60 px-5 pt-4">
                <span className="font-display text-lg font-semibold">{item.name}</span>
                <a
                  href={`mailto:${item.email}`}
                  className="font-mono text-[11px] tracking-[0.1em] text-acc underline-offset-4 hover:underline"
                >
                  {item.email}
                </a>
                {item.type && (
                  <span className="border border-acc/40 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-acc">
                    {item.type}
                  </span>
                )}
                <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.15em] text-mut">
                  {fmtDate(item.created_at)}
                </span>
              </div>
              <div className="flex items-end justify-between gap-6 px-5 py-4">
                <p className="max-w-2xl whitespace-pre-line text-sm leading-relaxed text-ink/85">
                  {item.message}
                </p>
                <button
                  onClick={() => setPending(item)}
                  aria-label={`Удалить заявку от ${item.name}`}
                  className="shrink-0 border border-line p-2.5 text-mut transition-all duration-300 hover:border-err hover:text-err"
                >
                  <TrashIcon size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!pending}
        heading="Удалить заявку?"
        message={`Заявка от «${pending?.name ?? ""}» (${pending?.email ?? ""}) будет удалена безвозвратно.`}
        onCancel={() => setPending(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
