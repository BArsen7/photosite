import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageHead } from "../ui";
import { UploadIcon, LayersIcon, MailIcon, ArrowUpRight } from "../../../components/Icons";
import { fetchPortfolio, fetchInquiries, type PortfolioData } from "../../../lib/api";

/** /admin — сводка архива: кадры, проекты, заявки, режим хранения. */
export default function AdminDashboardPage() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [inquiryCount, setInquiryCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPortfolio().then((d) => {
      if (!cancelled) setData(d);
    });
    fetchInquiries()
      .then((list) => {
        if (!cancelled) setInquiryCount(list.length);
      })
      .catch(() => setInquiryCount(0));
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    if (!data) return null;
    const byCat = new Map<string, number>();
    const catByProject = new Map(data.projects.map((p) => [p.id, p.category_id]));
    for (const ph of data.photos) {
      const cat = catByProject.get(ph.project_id);
      if (cat) byCat.set(cat, (byCat.get(cat) ?? 0) + 1);
    }
    return {
      frames: data.photos.length,
      projects: data.projects.length,
      categories: data.categories.length,
      bars: data.categories
        .map((c) => ({ name: c.name, count: byCat.get(c.id) ?? 0 }))
        .sort((a, b) => b.count - a.count),
    };
  }, [data]);

  /* Последние добавленные кадры */
  const recent = useMemo(() => {
    if (!data) return [];
    return [...data.photos]
      .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? "") || b.sort_order - a.sort_order)
      .slice(0, 8);
  }, [data]);

  const isNew = (d?: string) => !!d && Date.now() - new Date(d.replace(" ", "T")).getTime() < 86_400_000;

  return (
    <div className="px-6 py-10 md:px-10">
      <PageHead
        kicker="Тёмная комната · Сводка"
        title="Сводка архива"
        sub="Живые цифры по проектам и кадрам. Всё хранится локально: SQLite + файлы в volume."
      />

      {!stats ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="skeleton-pulse h-64 lg:col-span-2" />
          <div className="skeleton-pulse h-64" />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="border border-line bg-panel/50 p-7 lg:col-span-2">
            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-mut">Всего кадров</p>
                <p className="mt-2 font-display text-7xl font-semibold leading-none text-acc">
                  {stats.frames}
                </p>
              </div>
              <p className="max-w-[180px] text-right font-mono text-[9px] uppercase leading-relaxed tracking-[0.2em] text-mut">
                {stats.categories} категорий · база на сервере
              </p>
            </div>

            <div className="mt-8 space-y-3">
              {stats.bars.map((b, i) => (
                <div key={b.name} className="flex items-center gap-4">
                  <span className="w-28 shrink-0 font-mono text-[9px] uppercase tracking-[0.2em] text-mut">
                    {b.name}
                  </span>
                  <div className="h-1.5 flex-1 overflow-hidden bg-line/60">
                    <div
                      className="fadeup h-full bg-acc"
                      style={{
                        width: `${stats.frames ? (b.count / stats.frames) * 100 : 0}%`,
                        animationDelay: `${i * 90}ms`,
                      }}
                    />
                  </div>
                  <span className="w-6 shrink-0 text-right font-mono text-[11px] text-ink">{b.count}</span>
                </div>
              ))}
              {stats.frames === 0 && (
                <p className="pt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-mut">
                  Архив пуст — загрузите первый кадр
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex-1 border border-line bg-panel/50 p-6 transition-colors duration-300 hover:border-acc/40">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-mut">Проекты</p>
              <p className="mt-2 font-display text-5xl font-semibold">{stats.projects}</p>
            </div>
            <Link to="/admin/inquiries" className="group flex-1 border border-line bg-panel/50 p-6 transition-colors duration-300 hover:border-acc/40">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-mut">Заявки с сайта</p>
              <p className="mt-2 flex items-center gap-3 font-display text-5xl font-semibold">
                {inquiryCount ?? "…"}
                <ArrowUpRight size={20} className="text-mut transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-acc" />
              </p>
            </Link>
            <div className="flex-1 border border-line bg-panel/50 p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-mut">Хранилище</p>
              <p className="mt-2 font-display text-2xl font-semibold text-[#8fc79a]">Локально · SQLite</p>
            </div>
          </div>
        </div>
      )}

      {/* Последние кадры */}
      <div className="mt-12">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold">Последние кадры</h2>
          <Link
            to="/admin/upload"
            className="group flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-mut transition-colors hover:text-acc"
          >
            Загрузить ещё
            <ArrowUpRight size={14} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {recent.map((ph) => (
            <div key={ph.id} className="relative aspect-square overflow-hidden border border-line bg-panel">
              <img
                src={ph.image_url}
                alt="Кадр из архива"
                loading="lazy"
                sizes="120px"
                className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
              />
              {isNew(ph.created_at) && (
                <span className="absolute left-1.5 top-1.5 bg-coal/80 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.15em] text-acc">
                  новое
                </span>
              )}
            </div>
          ))}
          {!data &&
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton-pulse aspect-square" />
            ))}
          {data && recent.length === 0 && (
            <p className="col-span-full border border-line px-5 py-8 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-mut">
              В архиве пока нет кадров
            </p>
          )}
        </div>
      </div>

      {/* Быстрые действия */}
      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        <Link
          to="/admin/upload"
          className="group flex items-center justify-between border border-line bg-panel/40 px-6 py-5 transition-all duration-300 hover:border-acc hover:bg-panel"
        >
          <span className="flex items-center gap-4">
            <UploadIcon size={20} className="text-acc" />
            <span>
              <span className="block font-display text-lg font-semibold">Загрузка кадра</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-mut">Файл + EXIF → в архив</span>
            </span>
          </span>
          <ArrowUpRight size={18} className="text-mut transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-acc" />
        </Link>
        <Link
          to="/admin/projects"
          className="group flex items-center justify-between border border-line bg-panel/40 px-6 py-5 transition-all duration-300 hover:border-acc hover:bg-panel"
        >
          <span className="flex items-center gap-4">
            <LayersIcon size={20} className="text-acc" />
            <span>
              <span className="block font-display text-lg font-semibold">Управление проектами</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-mut">Серии, категории, даты</span>
            </span>
          </span>
          <ArrowUpRight size={18} className="text-mut transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-acc" />
        </Link>
      </div>

      <p className="mt-10 flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.2em] text-mut/70">
        <MailIcon size={13} className="text-acc" />
        Резервная копия — это volume portfolio-data (БД, загрузки и секрет сессий)
      </p>
    </div>
  );
}
