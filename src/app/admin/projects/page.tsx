import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageHead } from "../ui";
import ConfirmDialog from "../../../components/ConfirmDialog";
import { PlusIcon, PencilIcon, TrashIcon, CloseIcon, ArrowUpRight } from "../../../components/Icons";
import { useLockBody } from "../../../lib/motion";
import {
  fetchPortfolio,
  createProject,
  updateProject,
  deleteProjectRecord,
  slugify,
  type PortfolioData,
  type DbProject,
} from "../../../lib/api";

const inputCls =
  "w-full border border-line bg-coal px-3 py-2 font-mono text-xs text-ink outline-none transition-colors duration-300 placeholder:text-mut/50 focus:border-acc";
const labelCls = "mb-1.5 block font-mono text-[9px] uppercase tracking-[0.22em] text-mut";

type FormState = {
  title: string;
  slug: string;
  description: string;
  location: string;
  date: string;
  category_id: string;
  cover_image_url: string;
};

const empty: FormState = {
  title: "",
  slug: "",
  description: "",
  location: "",
  date: "",
  category_id: "",
  cover_image_url: "",
};

/** Модалка создания/редактирования проекта */
function ProjectModal({
  editing,
  data,
  onClose,
  onSaved,
}: {
  editing: DbProject | "new";
  data: PortfolioData;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(() =>
    editing === "new"
      ? empty
      : {
          title: editing.title,
          slug: editing.slug ?? "",
          description: editing.description ?? "",
          location: editing.location ?? "",
          date: editing.date ?? "",
          category_id: editing.category_id,
          cover_image_url: editing.cover_image_url?.startsWith("/uploads/") ? editing.cover_image_url : "",
        },
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  useLockBody(true);

  /* Slug дописывается сам из названия, если поле не трогали */
  const slugEdited = editing !== "new" && form.slug === (editing.slug ?? "");
  const shownSlug = form.slug || (!slugEdited ? slugify(form.title) : "");

  const save = async () => {
    if (form.title.trim().length < 2) {
      setErr("Название — минимум 2 символа");
      return;
    }
    setBusy(true);
    setErr(null);
    const payload = {
      title: form.title.trim(),
      slug: shownSlug.trim() || null,
      description: form.description.trim() || null,
      location: form.location.trim() || null,
      date: form.date || null,
      category_id: form.category_id || null,
      cover_image_url: form.cover_image_url || null,
    };
    try {
      if (editing === "new") await createProject(payload);
      else await updateProject(editing.id, payload);
      onSaved();
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Не удалось сохранить");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={editing === "new" ? "Новый проект" : "Редактирование проекта"}
      className="pop-in fixed inset-0 z-[85] flex items-center justify-center bg-coal/85 p-5 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="w-full max-w-lg border border-line bg-panel" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <p className="font-display text-xl font-semibold">
            {editing === "new" ? "Новый проект" : "Редактирование"}
          </p>
          <button onClick={onClose} aria-label="Закрыть" className="p-1 text-mut transition-colors hover:text-ink">
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">
          <div>
            <label className={labelCls}>Название *</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} placeholder="Тишина города" />
          </div>
          <div>
            <label className={labelCls}>Slug (адрес страницы)</label>
            <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={inputCls} placeholder={shownSlug || "генерируется из названия"} />
          </div>
          <div>
            <label className={labelCls}>Описание</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inputCls} resize-none`} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Локация</label>
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={inputCls} placeholder="Москва" />
            </div>
            <div>
              <label className={labelCls}>Дата (год серии)</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Категория</label>
            <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className={inputCls}>
              <option value="">— без категории —</option>
              {data.categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Обложка (кадр из архива)</label>
            <select value={form.cover_image_url} onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })} className={inputCls}>
              <option value="">— нет обложки —</option>
              {data.photos.map((p) => (
                <option key={p.id} value={p.image_url}>
                  {data.projects.find((pr) => pr.id === p.project_id)?.title ?? "Кадр"} · #{p.sort_order + 1}
                </option>
              ))}
            </select>
          </div>
          {err && (
            <div role="alert" className="border border-err/50 bg-err/[0.08] px-3 py-2 text-xs text-err">{err}</div>
          )}
        </div>

        <div className="grid grid-cols-2 border-t border-line">
          <button onClick={onClose} className="px-6 py-3.5 font-mono text-[10px] uppercase tracking-[0.25em] text-mut transition-colors hover:bg-raise hover:text-ink">
            Отмена
          </button>
          <button
            onClick={save}
            disabled={busy}
            className="border-l border-line px-6 py-3.5 font-mono text-[10px] uppercase tracking-[0.25em] text-acc transition-colors hover:bg-acc hover:text-coal disabled:opacity-50"
          >
            {busy ? "Сохраняем…" : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** /admin/projects — список проектов, создание, редактирование, удаление. */
export default function AdminProjectsPage() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [editing, setEditing] = useState<DbProject | "new" | null>(null);
  const [deleting, setDeleting] = useState<DbProject | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPortfolio().then((d) => {
      if (!cancelled) setData(d);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const catName = useMemo(
    () => new Map((data?.categories ?? []).map((c) => [c.id, c.name])),
    [data],
  );
  const framesIn = useMemo(() => {
    const m = new Map<string, number>();
    for (const ph of data?.photos ?? []) m.set(ph.project_id, (m.get(ph.project_id) ?? 0) + 1);
    return m;
  }, [data]);

  const confirmDelete = async () => {
    if (!deleting) return;
    const target = deleting;
    setDeleting(null);
    try {
      await deleteProjectRecord(target.id);
      setData((d) =>
        d
          ? {
              ...d,
              projects: d.projects.filter((p) => p.id !== target.id),
              photos: d.photos.filter((p) => p.project_id !== target.id),
            }
          : d,
      );
      setNotice(`Проект «${target.title}» удалён вместе с кадрами и файлами`);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Не удалось удалить проект");
    }
  };

  return (
    <div className="px-6 py-10 md:px-10">
      <PageHead
        kicker="Тёмная комната · Проекты"
        title="Управление проектами"
        sub="Серии, из которых собирается портфолио: название, адрес, категория, дата, обложка."
      />

      <div className="mb-6 flex items-center justify-between gap-4">
        {notice && <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-acc">{notice}</p>}
        <button
          onClick={() => setEditing("new")}
          className="group ml-auto flex items-center gap-2 border border-acc px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.25em] text-acc transition-all duration-300 hover:bg-acc hover:text-coal"
        >
          <PlusIcon size={15} className="transition-transform duration-300 group-hover:rotate-90" />
          Новый проект
        </button>
      </div>

      {!data ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton-pulse h-24" />
          ))}
        </div>
      ) : data.projects.length === 0 ? (
        <div className="border border-line px-6 py-16 text-center">
          <p className="font-display text-2xl italic text-mut">Проектов пока нет</p>
          <button
            onClick={() => setEditing("new")}
            className="mt-5 font-mono text-[11px] uppercase tracking-[0.25em] text-acc underline-offset-4 hover:underline"
          >
            Создать первый
          </button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.projects.map((p, i) => (
            <article
              key={p.id}
              className="fadeup group flex gap-4 border border-line bg-panel/40 p-4 transition-colors duration-300 hover:border-acc/50"
              style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
            >
              {p.cover_image_url ? (
                <img src={p.cover_image_url} alt="" className="h-24 w-24 shrink-0 object-cover" loading="lazy" sizes="96px" />
              ) : (
                <div className="flex h-24 w-24 shrink-0 items-center justify-center border border-line font-mono text-[9px] uppercase tracking-[0.2em] text-mut">
                  нет обложки
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="truncate font-display text-lg font-semibold">{p.title}</h3>
                  <span className="shrink-0 font-mono text-[10px] tracking-[0.15em] text-mut">
                    {p.date ? p.date.slice(0, 4) : "—"}
                  </span>
                </div>
                <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-mut">
                  /{p.slug || slugify(p.title)} · {catName.get(p.category_id) ?? "без категории"} ·{" "}
                  {framesIn.get(p.id) ?? 0} кадр(ов)
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => setEditing(p)}
                    className="flex items-center gap-1.5 border border-line px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-mut transition-colors hover:border-acc hover:text-acc"
                  >
                    <PencilIcon size={12} /> Изменить
                  </button>
                  <Link
                    to={`/portfolio/${p.slug || slugify(p.title)}`}
                    className="flex items-center gap-1.5 border border-line px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-mut transition-colors hover:border-acc hover:text-acc"
                  >
                    <ArrowUpRight size={12} /> На сайте
                  </Link>
                  <button
                    onClick={() => setDeleting(p)}
                    className="ml-auto flex items-center gap-1.5 border border-line px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-mut transition-colors hover:border-err hover:text-err"
                  >
                    <TrashIcon size={12} /> Удалить
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {editing && data && (
        <ProjectModal editing={editing} data={data} onClose={() => setEditing(null)} onSaved={() => fetchPortfolio().then(setData)} />
      )}

      <ConfirmDialog
        open={!!deleting}
        heading="Удалить проект?"
        message={`«${deleting?.title ?? ""}» и все его кадры (${framesIn.get(deleting?.id ?? "") ?? 0}) будут удалены из базы, файлы — с диска. Действие необратимо.`}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
