import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageHead } from "../ui";
import { UploadIcon, LayersIcon, ArrowUpRight } from "../../../components/Icons";
import { fetchPortfolio, type PortfolioData } from "../../../lib/api";
import { isSupabaseConfigured } from "../../../lib/supabase/browser";

export interface DemoUpload {
  id: string;
  name: string;
  thumb: string | null;
  project_id: string;
  created: string;
}

export const DEMO_UPLOADS_KEY = "av_demo_uploads";

export function readDemoUploads(): DemoUpload[] {
  try {
    return JSON.parse(localStorage.getItem(DEMO_UPLOADS_KEY) ?? "[]") as DemoUpload[];
  } catch {
    return [];
  }
}

/** /admin/dashboard — сводка архива: кадры, проекты, режим, последние загрузки. */
export default function AdminDashboardPage() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [demoUploads, setDemoUploads] = useState<DemoUpload[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchPortfolio().then((d) => {
      if (!cancelled) setData(d);
    });
    setDemoUploads(readDemoUploads());
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

  const recent = useMemo(() => {
    if (!data) return [];
    return [...data.photos].sort((a, b) => b.sort_order - a.sort_order).slice(0, 6);
  }, [data]);

  return (
    <div className="px-6 py-10 md:px-10">
      <PageHead
        kicker="Тёмная комната · Сводка"
        title="Сводка архива"
        sub="Живые цифры по проектам и кадрам. Данные — из Supabase или демо-набора."
      />

      {!stats ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="skeleton-pulse h-64 lg:col-span-2" />
          <div className="skeleton-pulse h-64" />
        </div>
      ) : (
        /* Асимметричная сетка: большая плитка кадров + колонка показателей */
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
                {stats.categories} категорий · плёнка + цифра
              </p>
            </div>

            {/* Распределение по категориям — живые полосы */}
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
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex-1 border border-line bg-panel/50 p-6 transition-colors duration-300 hover:border-acc/40">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-mut">Проекты</p>
              <p className="mt-2 font-display text-5xl font-semibold">{stats.projects}</p>
            </div>
            <div className="flex-1 border border-line bg-panel/50 p-6 transition-colors duration-300 hover:border-acc/40">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-mut">Категории</p>
              <p className="mt-2 font-display text-5xl font-semibold">{stats.categories}</p>
            </div>
            <div className="flex-1 border border-line bg-panel/50 p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-mut">Режим данных</p>
              <p className={`mt-2 font-display text-2xl font-semibold ${isSupabaseConfigured ? "text-[#8fc79a]" : "text-acc"}`}>
                {isSupabaseConfigured ? "Supabase · подключён" : "Демо-данные"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Последние загрузки */}
      <div className="mt-12">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold">Последние загрузки</h2>
          <Link
            to="/admin/upload"
            className="group flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-mut transition-colors hover:text-acc"
          >
            Загрузить ещё
            <ArrowUpRight size={14} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {demoUploads.slice(0, 6).map((u) => (
            <div key={u.id} className="relative aspect-square overflow-hidden border border-line bg-panel">
              {u.thumb ? (
                <img src={u.thumb} alt={u.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center p-2 text-center font-mono text-[9px] uppercase tracking-[0.15em] text-mut">
                  {u.name}
                </div>
              )}
              <span className="absolute left-1.5 top-1.5 bg-coal/80 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.15em] text-acc">
                новое
              </span>
            </div>
          ))}
          {recent.map((ph) => (
            <div key={ph.id} className="aspect-square overflow-hidden border border-line bg-panel">
              <img src={ph.image_url} alt="Кадр из архива" className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
            </div>
          ))}
          {!data &&
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton-pulse aspect-square" />
            ))}
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
              <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-mut">Новый кадр в архив</span>
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
    </div>
  );
}
