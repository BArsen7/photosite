import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageHead } from "../ui";
import ConfirmDialog from "../../../components/ConfirmDialog";
import {
  PencilIcon,
  TrashIcon,
  SearchIcon,
  CloseIcon,
  ArrowUpRight,
  LayersIcon,
  FilmIcon,
} from "../../../components/Icons";
import {
  fetchPortfolio,
  deletePhotoRecord,
  deleteProjectRecord,
  updatePhotoRecord,
  type DbPhoto,
  type DbProject,
  type PortfolioData,
} from "../../../lib/api";
import { useLockBody } from "../../../lib/motion";
import { plural } from "../../../lib/format";

const PAGE_SIZE = 12;

type Tab = "photos" | "projects";

/** /admin/manage — список всех кадров и проектов: поиск, Edit, Delete, Load more. */
export default function AdminManagePage() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [tab, setTab] = useState<Tab>("photos");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);

  /* Удаляемый элемент (подтверждение через модалку) */
  const [pendingPhoto, setPendingPhoto] = useState<DbPhoto | null>(null);
  const [pendingProject, setPendingProject] = useState<DbProject | null>(null);

  /* Редактируемый кадр (inline-модалка) */
  const [editingPhoto, setEditingPhoto] = useState<DbPhoto | null>(null);

  /* Тост-уведомления */
  const [toast, setToast] = useState<{ id: number; msg: string; tone: "ok" | "err" } | null>(null);

  useLockBody(!!pendingPhoto || !!pendingProject || !!editingPhoto);

  useEffect(() => {
    let cancelled = false;
    fetchPortfolio().then((d) => {
      if (!cancelled) setData(d);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const notify = (msg: string, tone: "ok" | "err" = "ok") => {
    setToast({ id: Date.now(), msg, tone });
    window.setTimeout(() => setToast(null), 3200);
  };

  /* Справочник: project_id → название */
  const projectTitle = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of data?.projects ?? []) m.set(p.id, p.title);
    return m;
  }, [data]);

  /* Число кадров в проекте */
  const framesIn = useMemo(() => {
    const m = new Map<string, number>();
    for (const ph of data?.photos ?? []) m.set(ph.project_id, (m.get(ph.project_id) ?? 0) + 1);
    return m;
  }, [data]);

  /* Фильтрация по запросу */
  const photos = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = data?.photos ?? [];
    if (!q) return list;
    return list.filter((ph) =>
      [ph.id, ph.exif_camera ?? "", ph.exif_lens ?? "", projectTitle.get(ph.project_id) ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [data, query, projectTitle]);

  const projects = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = data?.projects ?? [];
    if (!q) return list;
    return list.filter((p) =>
      [p.title, p.location ?? "", p.slug ?? "", p.description ?? ""].join(" ").toLowerCase().includes(q),
    );
  }, [data, query]);

  const visiblePhotos = photos.slice(0, limit);
  const visibleProjects = projects.slice(0, limit);
  const hasMore = tab === "photos" ? photos.length > limit : projects.length > limit;

  /* Сброс лимита при смене вкладки / запроса */
  const switchTab = (t: Tab) => {
    setTab(t);
    setLimit(PAGE_SIZE);
  };
  const onQuery = (v: string) => {
    setQuery(v);
    setLimit(PAGE_SIZE);
  };

  /* Удаление кадра: БД + Storage */
  const confirmDeletePhoto = async () => {
    if (!pendingPhoto) return;
    const target = pendingPhoto;
    setPendingPhoto(null);
    try {
      await deletePhotoRecord(target);
      setData((d) => (d ? { ...d, photos: d.photos.filter((p) => p.id !== target.id) } : d));
      notify("Кадр удалён из архива и Storage");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Не удалось удалить кадр", "err");
    }
  };

  /* Удаление проекта: кадры (файлы) + проект */
  const confirmDeleteProject = async () => {
    if (!pendingProject) return;
    const target = pendingProject;
    setPendingProject(null);
    try {
      await deleteProjectRecord(target, data?.photos ?? []);
      setData((d) =>
        d
          ? {
              ...d,
              projects: d.projects.filter((p) => p.id !== target.id),
              photos: d.photos.filter((p) => p.project_id !== target.id),
            }
          : d,
      );
      notify(`Проект «${target.title}» удалён вместе с кадрами`);
    } catch (e) {
      notify(e instanceof Error ? e.message : "Не удалось удалить проект", "err");
    }
  };

  /* Сохранение правок кадра */
  const savePhotoEdit = async (patch: Partial<DbPhoto>) => {
    if (!editingPhoto) return;
    const id = editingPhoto.id;
    setEditingPhoto(null);
    try {
      await updatePhotoRecord(id, patch);
      setData((d) =>
        d ? { ...d, photos: d.photos.map((p) => (p.id === id ? { ...p, ...patch } : p)) } : d,
      );
      notify("Изменения сохранены");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Не удалось сохранить", "err");
    }
  };

  return (
    <div className="px-6 py-10 md:px-10">
      <PageHead
        kicker="Тёмная комната · Архив"
        title="Архив"
        sub="Все кадры и проекты в одном месте. Удаление затрагивает базу данных и файлы в Storage."
        action={
          <Link
            to="/admin/upload"
            className="group flex items-center gap-2 border border-acc px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.25em] text-acc transition-all hover:bg-acc hover:text-coal"
          >
            Загрузить
            <ArrowUpRight size={14} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        }
      />

      {/* Панель: вкладки + поиск */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex border border-line" role="tablist" aria-label="Разделы архива">
          <button
            role="tab"
            aria-selected={tab === "photos"}
            onClick={() => switchTab("photos")}
            className={`flex items-center gap-2.5 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.22em] transition-colors ${
              tab === "photos" ? "bg-acc text-coal" : "text-mut hover:text-ink"
            }`}
          >
            <FilmIcon size={15} /> Кадры <sup>{photos.length}</sup>
          </button>
          <button
            role="tab"
            aria-selected={tab === "projects"}
            onClick={() => switchTab("projects")}
            className={`flex items-center gap-2.5 border-l border-line px-5 py-3 font-mono text-[10px] uppercase tracking-[0.22em] transition-colors ${
              tab === "projects" ? "bg-acc text-coal" : "text-mut hover:text-ink"
            }`}
          >
            <LayersIcon size={15} /> Проекты <sup>{projects.length}</sup>
          </button>
        </div>

        <div className="relative w-full max-w-xs">
          <SearchIcon size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mut" />
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Поиск по архиву…"
            aria-label="Поиск"
            className="w-full border border-line bg-panel py-3 pl-11 pr-9 font-mono text-xs text-ink outline-none transition-colors placeholder:text-mut/50 focus:border-acc"
          />
          {query && (
            <button
              onClick={() => onQuery("")}
              aria-label="Очистить поиск"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-mut transition-colors hover:text-ink"
            >
              <CloseIcon size={15} />
            </button>
          )}
        </div>
      </div>

      {/* ── Кадры: сетка карточек ── */}
      {tab === "photos" && (
        <>
          {!data ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton-pulse aspect-[4/5]" />
              ))}
            </div>
          ) : visiblePhotos.length === 0 ? (
            <EmptyState text="Кадры не найдены" onReset={() => onQuery("")} />
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {visiblePhotos.map((ph, i) => (
                <div
                  key={ph.id}
                  className="fadeup group relative border border-line bg-panel/40 transition-colors duration-300 hover:border-acc/50"
                  style={{ animationDelay: `${(i % PAGE_SIZE) * 40}ms` }}
                >
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <img
                      src={ph.image_url}
                      alt={projectTitle.get(ph.project_id) ?? "Кадр"}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <span className="absolute left-2.5 top-2.5 bg-coal/80 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-acc">
                      #{ph.sort_order}
                    </span>
                  </div>
                  <div className="p-3.5">
                    <p className="truncate font-display text-sm font-semibold">{projectTitle.get(ph.project_id) ?? "Без проекта"}</p>
                    <p className="mt-1 truncate font-mono text-[9px] uppercase tracking-[0.18em] text-mut">
                      {ph.exif_camera ?? "—"} · {ph.exif_lens ?? "—"}
                    </p>
                    <div className="mt-3 flex border-t border-line">
                      <button
                        onClick={() => setEditingPhoto(ph)}
                        className="flex flex-1 items-center justify-center gap-2 py-2.5 font-mono text-[9px] uppercase tracking-[0.2em] text-mut transition-colors hover:bg-raise hover:text-acc"
                      >
                        <PencilIcon size={13} /> Изменить
                      </button>
                      <button
                        onClick={() => setPendingPhoto(ph)}
                        className="flex flex-1 items-center justify-center gap-2 border-l border-line py-2.5 font-mono text-[9px] uppercase tracking-[0.2em] text-mut transition-colors hover:bg-err/[0.1] hover:text-err"
                      >
                        <TrashIcon size={13} /> Удалить
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Проекты: сетка карточек ── */}
      {tab === "projects" && (
        <>
          {!data ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton-pulse aspect-[16/10]" />
              ))}
            </div>
          ) : visibleProjects.length === 0 ? (
            <EmptyState text="Проекты не найдены" onReset={() => onQuery("")} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleProjects.map((p, i) => (
                <div
                  key={p.id}
                  className="fadeup group border border-line bg-panel/40 transition-colors duration-300 hover:border-acc/50"
                  style={{ animationDelay: `${(i % PAGE_SIZE) * 40}ms` }}
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    {p.cover_image_url ? (
                      <img
                        src={p.cover_image_url}
                        alt={p.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center font-mono text-[10px] uppercase tracking-[0.2em] text-mut">
                        Нет обложки
                      </div>
                    )}
                    <span className="absolute right-2.5 top-2.5 bg-coal/80 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-acc">
                      {framesIn.get(p.id) ?? 0} {plural(framesIn.get(p.id) ?? 0, "кадр", "кадра", "кадров")}
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="truncate font-display text-lg font-semibold">{p.title}</p>
                    <p className="mt-1 truncate font-mono text-[9px] uppercase tracking-[0.18em] text-mut">
                      /{p.slug ?? "—"} · {p.location ?? "—"} · {p.date?.slice(0, 4) ?? "—"}
                    </p>
                    <div className="mt-3 flex border-t border-line">
                      {/* Редактирование проекта живёт на странице Manage Projects */}
                      <Link
                        to="/admin/projects"
                        className="flex flex-1 items-center justify-center gap-2 py-2.5 font-mono text-[9px] uppercase tracking-[0.2em] text-mut transition-colors hover:bg-raise hover:text-acc"
                      >
                        <PencilIcon size={13} /> Изменить
                      </Link>
                      <button
                        onClick={() => setPendingProject(p)}
                        className="flex flex-1 items-center justify-center gap-2 border-l border-line py-2.5 font-mono text-[9px] uppercase tracking-[0.2em] text-mut transition-colors hover:bg-err/[0.1] hover:text-err"
                      >
                        <TrashIcon size={13} /> Удалить
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Load more + прогресс */}
      {data && (tab === "photos" ? photos.length : projects.length) > 0 && (
        <div className="mt-10">
          <div className="mb-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.22em] text-mut">
            <span>
              Показано {Math.min(limit, tab === "photos" ? photos.length : projects.length)} из{" "}
              {tab === "photos" ? photos.length : projects.length}
            </span>
            <span className="text-acc">{Math.round((Math.min(limit, tab === "photos" ? photos.length : projects.length) / (tab === "photos" ? photos.length : projects.length)) * 100)}%</span>
          </div>
          <div className="h-1 overflow-hidden bg-line/60">
            <div
              className="h-full bg-acc transition-all duration-500"
              style={{ width: `${(Math.min(limit, tab === "photos" ? photos.length : projects.length) / (tab === "photos" ? photos.length : projects.length)) * 100}%` }}
            />
          </div>
          {hasMore && (
            <button
              onClick={() => setLimit((l) => l + PAGE_SIZE)}
              className="mt-6 w-full border border-line py-4 font-mono text-[11px] uppercase tracking-[0.3em] text-mut transition-all duration-300 hover:border-acc hover:bg-acc hover:text-coal"
            >
              Показать ещё
            </button>
          )}
        </div>
      )}

      {/* Модалка подтверждения удаления кадра */}
      <ConfirmDialog
        open={!!pendingPhoto}
        heading="Удалить кадр?"
        message="Кадр будет удалён из базы данных, а его файл — из Supabase Storage. Действие необратимо."
        onCancel={() => setPendingPhoto(null)}
        onConfirm={confirmDeletePhoto}
      >
        {pendingPhoto && (
          <div className="flex items-center gap-4 border border-line bg-coal p-3">
            <img src={pendingPhoto.image_url} alt="" className="h-14 w-14 object-cover" />
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-semibold">
                {projectTitle.get(pendingPhoto.project_id) ?? "Без проекта"}
              </p>
              <p className="truncate font-mono text-[9px] uppercase tracking-[0.18em] text-mut">
                {pendingPhoto.exif_camera ?? "—"} · {pendingPhoto.exif_settings ?? "—"}
              </p>
            </div>
          </div>
        )}
      </ConfirmDialog>

      {/* Модалка подтверждения удаления проекта */}
      <ConfirmDialog
        open={!!pendingProject}
        heading="Удалить проект?"
        message={`Проект «${pendingProject?.title ?? ""}» и все его кадры (${framesIn.get(pendingProject?.id ?? "") ?? 0}) будут удалены из базы и Storage. Действие необратимо.`}
        onCancel={() => setPendingProject(null)}
        onConfirm={confirmDeleteProject}
      >
        {pendingProject?.cover_image_url && (
          <img src={pendingProject.cover_image_url} alt="" className="h-28 w-full object-cover" />
        )}
      </ConfirmDialog>

      {/* Inline-редактор кадра */}
      {editingPhoto && (
        <PhotoEditor
          photo={editingPhoto}
          projects={data?.projects ?? []}
          onClose={() => setEditingPhoto(null)}
          onSave={savePhotoEdit}
        />
      )}

      {/* Тост */}
      {toast && (
        <div
          key={toast.id}
          role="status"
          className={`fadeup fixed bottom-6 right-6 z-[95] border px-5 py-3.5 font-mono text-[11px] uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(0,0,0,0.5)] ${
            toast.tone === "ok" ? "border-acc/60 bg-panel text-acc" : "border-err/60 bg-panel text-err"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

/** Пустое состояние поиска. */
function EmptyState({ text, onReset }: { text: string; onReset: () => void }) {
  return (
    <div className="border border-line px-6 py-20 text-center">
      <p className="font-display text-2xl italic text-mut">{text}</p>
      <button
        onClick={onReset}
        className="mt-4 font-mono text-[11px] uppercase tracking-[0.25em] text-acc underline-offset-4 hover:underline"
      >
        Сбросить поиск
      </button>
    </div>
  );
}

/** Inline-модалка редактирования EXIF и порядка кадра. */
function PhotoEditor({
  photo,
  projects,
  onClose,
  onSave,
}: {
  photo: DbPhoto;
  projects: DbProject[];
  onClose: () => void;
  onSave: (patch: Partial<DbPhoto>) => Promise<void>;
}) {
  const [projectId, setProjectId] = useState(photo.project_id);
  const [sortOrder, setSortOrder] = useState(photo.sort_order);
  const [camera, setCamera] = useState(photo.exif_camera ?? "");
  const [lens, setLens] = useState(photo.exif_lens ?? "");
  const [settings, setSettings] = useState(photo.exif_settings ?? "");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = () => {
    onSave({
      project_id: projectId,
      sort_order: sortOrder,
      exif_camera: camera || null,
      exif_lens: lens || null,
      exif_settings: settings || null,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center bg-coal/85 p-5 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="pop-in w-full max-w-lg border border-line bg-panel" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <span className="font-display text-xl font-semibold">Редактировать кадр</span>
          <button onClick={onClose} aria-label="Закрыть" className="p-1.5 text-mut transition-colors hover:text-ink">
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="flex gap-4 px-6 pt-5">
          <img src={photo.image_url} alt="" className="h-24 w-20 shrink-0 object-cover" />
          <div className="grid flex-1 grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.2em] text-mut">Проект</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full border border-line bg-coal px-3 py-2.5 font-mono text-xs text-ink outline-none focus:border-acc"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.2em] text-mut">Порядок</label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className="w-full border border-line bg-coal px-3 py-2.5 font-mono text-xs text-ink outline-none focus:border-acc"
              />
            </div>
            <div>
              <label className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.2em] text-mut">Камера</label>
              <input
                value={camera}
                onChange={(e) => setCamera(e.target.value)}
                className="w-full border border-line bg-coal px-3 py-2.5 font-mono text-xs text-ink outline-none focus:border-acc"
              />
            </div>
            <div>
              <label className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.2em] text-mut">Объектив</label>
              <input
                value={lens}
                onChange={(e) => setLens(e.target.value)}
                className="w-full border border-line bg-coal px-3 py-2.5 font-mono text-xs text-ink outline-none focus:border-acc"
              />
            </div>
            <div>
              <label className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.2em] text-mut">Настройки</label>
              <input
                value={settings}
                onChange={(e) => setSettings(e.target.value)}
                placeholder="ƒ/2.8 · 1/250 · ISO 100"
                className="w-full border border-line bg-coal px-3 py-2.5 font-mono text-xs text-ink outline-none placeholder:text-mut/40 focus:border-acc"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 border-t border-line">
          <button
            onClick={onClose}
            className="px-6 py-4 font-mono text-[10px] uppercase tracking-[0.25em] text-mut transition-colors hover:bg-raise hover:text-ink"
          >
            Отмена
          </button>
          <button
            onClick={submit}
            className="border-l border-line bg-acc/[0.08] px-6 py-4 font-mono text-[10px] uppercase tracking-[0.25em] text-acc transition-all hover:bg-acc hover:text-coal"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
