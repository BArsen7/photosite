import { useEffect, useMemo, useState, type FormEvent } from "react";
import { PageHead, Banner, FieldLabel, inputCls } from "../ui";
import { PlusIcon, CloseIcon, ChevronRight } from "../../../components/Icons";
import { fetchPortfolio, slugify, type DbProject, type PortfolioData } from "../../../lib/api";
import { isSupabaseConfigured, loadSupabase } from "../../../lib/supabase/browser";
import { useLockBody } from "../../../lib/motion";

interface ProjectForm {
  title: string;
  slug: string;
  category_id: string;
  location: string;
  date: string;
  description: string;
}

const EMPTY: ProjectForm = {
  title: "",
  slug: "",
  category_id: "",
  location: "",
  date: "",
  description: "",
};

/** /admin/projects — CRUD проектов: список, создание, редактирование, удаление. */
export default function AdminProjectsPage() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [editing, setEditing] = useState<DbProject | "new" | null>(null);
  const [deleting, setDeleting] = useState<DbProject | null>(null);
  const [form, setForm] = useState<ProjectForm>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  useLockBody(editing !== null || deleting !== null);

  useEffect(() => {
    let cancelled = false;
    fetchPortfolio().then((d) => {
      if (!cancelled) setData(d);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const frameCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const ph of data?.photos ?? []) m.set(ph.project_id, (m.get(ph.project_id) ?? 0) + 1);
    return m;
  }, [data]);

  const catName = (id: string) => data?.categories.find((c) => c.id === id)?.name ?? "—";

  const openEditor = (p: DbProject | "new") => {
    setError(null);
    if (p === "new") {
      setForm({ ...EMPTY, category_id: data?.categories[0]?.id ?? "" });
      setSlugTouched(false);
    } else {
      setForm({
        title: p.title,
        slug: p.slug ?? slugify(p.title),
        category_id: p.category_id,
        location: p.location ?? "",
        date: p.date ?? "",
        description: p.description ?? "",
      });
      setSlugTouched(true);
    }
    setEditing(p);
  };

  /* Автогенерация slug из названия, пока пользователь не редактировал его вручную */
  const onTitle = (v: string) => {
    setForm((f) => ({ ...f, title: v, slug: slugTouched ? f.slug : slugify(v) }));
  };

  const saveProject = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.title.trim()) {
      setError("Название обязательно");
      return;
    }
    setBusy(true);
    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim() || slugify(form.title),
      category_id: form.category_id || null,
      location: form.location.trim() || null,
      date: form.date || null,
      description: form.description.trim() || null,
    };

    const applyLocal = () => {
      setData((d) => {
        if (!d) return d;
        if (editing === "new") {
          const np: DbProject = {
            id: `local-${Date.now()}`,
            cover_image_url: null,
            title: payload.title,
            slug: payload.slug,
            category_id: payload.category_id ?? d.categories[0]?.id ?? "",
            location: payload.location,
            date: payload.date,
            description: payload.description,
          };
          return { ...d, projects: [np, ...d.projects] };
        }
        return {
          ...d,
          projects: d.projects.map((p): DbProject =>
            p.id === (editing as DbProject).id
              ? { ...p, ...payload, category_id: payload.category_id ?? p.category_id }
              : p,
          ),
        };
      });
    };

    const supabase = await loadSupabase();
    if (supabase) {
      const res =
        editing === "new"
          ? await supabase.from("projects").insert(payload)
          : await supabase.from("projects").update(payload).eq("id", (editing as DbProject).id);
      setBusy(false);
      if (res.error) {
        setError(`Supabase: ${res.error.message}`);
        return;
      }
      /* Перечитываем, чтобы показать актуальные данные из БД */
      fetchPortfolio().then(setData);
      setNotice(editing === "new" ? "Проект создан в Supabase" : "Изменения сохранены");
    } else {
      await new Promise((r) => setTimeout(r, 500));
      applyLocal();
      setBusy(false);
      setNotice(editing === "new" ? "Проект создан (демо: до перезагрузки страницы)" : "Сохранено (демо: до перезагрузки)");
    }
    setEditing(null);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    setError(null);
    const supabaseDel = await loadSupabase();
    if (supabaseDel) {
      const { error: delErr } = await supabaseDel.from("projects").delete().eq("id", deleting.id);
      setBusy(false);
      if (delErr) {
        setError(`Supabase: ${delErr.message} (кадры каскадно защищены FK)`);
        setDeleting(null);
        return;
      }
      fetchPortfolio().then(setData);
      setNotice("Проект удалён из Supabase");
    } else {
      await new Promise((r) => setTimeout(r, 400));
      setData((d) => (d ? { ...d, projects: d.projects.filter((p) => p.id !== deleting.id) } : d));
      setBusy(false);
      setNotice("Проект удалён (демо: до перезагрузки)");
    }
    setDeleting(null);
  };

  return (
    <div className="px-6 py-10 md:px-10">
      <PageHead
        kicker="Тёмная комната · Проекты"
        title="Управление проектами"
        sub="Серии публикаций: название, адрес, категория, география и дата."
        action={
          <button
            onClick={() => openEditor("new")}
            className="group flex items-center gap-2.5 border border-acc bg-acc px-5 py-3 font-mono text-[10px] uppercase tracking-[0.25em] text-coal transition-all duration-300 hover:bg-transparent hover:text-acc"
          >
            <PlusIcon size={15} className="transition-transform duration-300 group-hover:rotate-90" />
            New Project
          </button>
        }
      />

      {!isSupabaseConfigured && (
        <div className="mb-8">
          <Banner tone="warn">Демо-режим: изменения применяются локально и живут до перезагрузки страницы.</Banner>
        </div>
      )}
      {error && (
        <div className="mb-8">
          <Banner tone="err">{error}</Banner>
        </div>
      )}
      {notice && (
        <div className="mb-8">
          <Banner tone="ok">{notice}</Banner>
        </div>
      )}

      {/* Список проектов */}
      <div className="border-t border-line">
        {!data &&
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton-pulse mb-3 h-20" />)}
        {(data?.projects ?? []).map((p, i) => (
          <div
            key={p.id}
            className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-line py-4 transition-all duration-300 hover:bg-panel/50 hover:pl-2 md:grid-cols-[3rem_1fr_auto_auto_auto]"
          >
            <span className="font-mono text-xs text-mut">{String(i + 1).padStart(2, "0")}</span>
            <div className="min-w-0">
              <p className="truncate font-display text-xl font-semibold tracking-tight transition-colors duration-300 group-hover:text-acc">
                {p.title}
              </p>
              <p className="mt-0.5 truncate font-mono text-[9px] uppercase tracking-[0.18em] text-mut">
                /portfolio/{p.slug ?? slugify(p.title)} · {p.location ?? "—"} · {p.date?.slice(0, 4) ?? "—"}
              </p>
            </div>
            <span className="hidden border border-line px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-ink/75 md:block">
              {catName(p.category_id)}
            </span>
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-mut md:block">
              {frameCount.get(p.id) ?? 0} кадров
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => openEditor(p)}
                className="border border-line px-3 py-2 font-mono text-[9px] uppercase tracking-[0.18em] text-mut transition-colors duration-300 hover:border-acc hover:text-acc"
              >
                Edit
              </button>
              <button
                onClick={() => setDeleting(p)}
                className="border border-line px-3 py-2 font-mono text-[9px] uppercase tracking-[0.18em] text-mut transition-colors duration-300 hover:border-err hover:text-err"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Модалка создания / редактирования */}
      {editing !== null && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-coal/80 p-5 backdrop-blur-sm"
          onClick={() => setEditing(null)}
        >
          <div
            className="lb-in max-h-[88vh] w-full max-w-lg overflow-y-auto border border-line bg-coal p-7"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={editing === "new" ? "Новый проект" : "Редактирование проекта"}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold">
                {editing === "new" ? "Новый проект" : "Редактирование"}
              </h2>
              <button onClick={() => setEditing(null)} aria-label="Закрыть" className="p-1.5 text-mut hover:text-ink">
                <CloseIcon size={18} />
              </button>
            </div>

            <form onSubmit={saveProject} className="space-y-5">
              <div>
                <FieldLabel htmlFor="pf-title">Название</FieldLabel>
                <input
                  id="pf-title"
                  value={form.title}
                  onChange={(e) => onTitle(e.target.value)}
                  placeholder="Silence of the City"
                  className={inputCls}
                  autoFocus
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="pf-slug">Адрес (slug)</FieldLabel>
                  <input
                    id="pf-slug"
                    value={form.slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setForm((f) => ({ ...f, slug: slugify(e.target.value) }));
                    }}
                    className={inputCls}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="pf-cat">Категория</FieldLabel>
                  <select
                    id="pf-cat"
                    value={form.category_id}
                    onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                    className={`${inputCls} appearance-none`}
                  >
                    {(data?.categories ?? []).map((c) => (
                      <option key={c.id} value={c.id} className="bg-coal">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="pf-loc">Локация</FieldLabel>
                  <input
                    id="pf-loc"
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    placeholder="Москва"
                    className={inputCls}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="pf-date">Дата</FieldLabel>
                  <input
                    id="pf-date"
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className={`${inputCls} [color-scheme:dark]`}
                  />
                </div>
              </div>
              <div>
                <FieldLabel htmlFor="pf-desc">Описание</FieldLabel>
                <textarea
                  id="pf-desc"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Коротко о серии…"
                  className={`${inputCls} resize-none`}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="flex flex-1 items-center justify-center gap-2 border border-acc bg-acc py-3 font-mono text-[10px] uppercase tracking-[0.25em] text-coal transition-all duration-300 hover:bg-transparent hover:text-acc disabled:opacity-60"
                >
                  {busy ? "Сохраняем…" : "Сохранить"}
                  <ChevronRight size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="border border-line px-6 py-3 font-mono text-[10px] uppercase tracking-[0.25em] text-mut transition-colors hover:border-ink hover:text-ink"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Подтверждение удаления */}
      {deleting && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-coal/80 p-5 backdrop-blur-sm"
          onClick={() => setDeleting(null)}
        >
          <div
            className="lb-in w-full max-w-md border border-err/40 bg-coal p-7"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-label="Подтверждение удаления"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-err">Необратимо</p>
            <h2 className="mt-3 font-display text-2xl font-semibold">
              Удалить «{deleting.title}»?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-mut">
              Вместе с проектом исчезнут {frameCount.get(deleting.id) ?? 0} кадров серии
              (ON DELETE CASCADE). Проявка назад не откатывается.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={confirmDelete}
                disabled={busy}
                className="flex-1 border border-err bg-err py-3 font-mono text-[10px] uppercase tracking-[0.25em] text-coal transition-all duration-300 hover:bg-transparent hover:text-err disabled:opacity-60"
              >
                {busy ? "Удаляем…" : "Удалить"}
              </button>
              <button
                onClick={() => setDeleting(null)}
                className="border border-line px-6 py-3 font-mono text-[10px] uppercase tracking-[0.25em] text-mut transition-colors hover:border-ink hover:text-ink"
              >
                Оставить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
