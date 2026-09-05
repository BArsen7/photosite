import { useEffect, useRef, useState, type DragEvent, type FormEvent } from "react";
import { PageHead, Banner, FieldLabel, inputCls } from "../ui";
import { UploadIcon } from "../../../components/Icons";
import { fetchPortfolio, supabase, type PortfolioData } from "../../../lib/api";
import { isSupabaseConfigured } from "../../../lib/supabase/browser";
import { readDemoUploads, DEMO_UPLOADS_KEY, type DemoUpload } from "../dashboard/page";

/** /admin/upload — загрузка кадра: файл → превью → EXIF → Supabase (или демо). */
export default function AdminUploadPage() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const [projectId, setProjectId] = useState("");
  const [camera, setCamera] = useState("");
  const [lens, setLens] = useState("");
  const [settings, setSettings] = useState("");
  const [sortOrder, setSortOrder] = useState(1);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sessionUploads, setSessionUploads] = useState<DemoUpload[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPortfolio().then((d) => {
      if (cancelled) return;
      setData(d);
      if (d.projects.length && !projectId) setProjectId(d.projects[0].id);
    });
    setSessionUploads(readDemoUploads());
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Чтение файла: тип + реальные размеры для width/height в БД */
  const acceptFile = (f: File) => {
    setError(null);
    setSuccess(null);
    if (!f.type.startsWith("image/")) {
      setError("Можно загружать только изображения");
      return;
    }
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      setFile(f);
      setPreview(url);
      setDims({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.onerror = () => setError("Не удалось прочитать изображение");
    img.src = url;
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) acceptFile(f);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!file || !dims) {
      setError("Сначала выберите файл кадра");
      return;
    }
    if (!projectId) {
      setError("Выберите проект для кадра");
      return;
    }
    setBusy(true);

    const row = {
      project_id: projectId,
      width: dims.w,
      height: dims.h,
      exif_camera: camera.trim() || null,
      exif_lens: lens.trim() || null,
      exif_settings: settings.trim() || null,
      sort_order: sortOrder,
    };

    if (supabase) {
      /* Боевой режим: файл → Storage, строка → photos */
      const path = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      const { error: upErr } = await supabase.storage.from("photos").upload(path, file);
      if (upErr) {
        setBusy(false);
        setError(`Storage: ${upErr.message}`);
        return;
      }
      const { data: pub } = supabase.storage.from("photos").getPublicUrl(path);
      const { error: insErr } = await supabase
        .from("photos")
        .insert({ ...row, image_url: pub.publicUrl });
      setBusy(false);
      if (insErr) {
        setError(`Insert: ${insErr.message}`);
        return;
      }
      setSuccess("Кадр загружен в Supabase и добавлен в проект");
    } else {
      /* Демо: миниатюра в localStorage, чтобы дашборд её показал */
      let thumb: string | null = null;
      if (file.size < 1.5 * 1024 * 1024) {
        thumb = await new Promise<string | null>((resolve) => {
          const r = new FileReader();
          r.onload = () => resolve(typeof r.result === "string" ? r.result : null);
          r.onerror = () => resolve(null);
          r.readAsDataURL(file);
        });
      }
      const entry: DemoUpload = {
        id: `up-${Date.now()}`,
        name: file.name,
        thumb,
        project_id: projectId,
        created: new Date().toISOString(),
      };
      const list = [entry, ...readDemoUploads()].slice(0, 12);
      localStorage.setItem(DEMO_UPLOADS_KEY, JSON.stringify(list));
      setSessionUploads(list);
      await new Promise((r) => setTimeout(r, 600));
      setBusy(false);
      setSuccess("Кадр принят (демо-режим): Supabase не подключён, запись не ушла в БД");
    }

    /* Сброс формы под следующий кадр */
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setDims(null);
    setCamera("");
    setLens("");
    setSettings("");
    setSortOrder((s) => s + 1);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="px-6 py-10 md:px-10">
      <PageHead
        kicker="Darkroom · Upload"
        title="Upload Photo"
        sub="Кадр привязывается к проекту; EXIF попадёт в бейджи на странице серии."
      />

      {!isSupabaseConfigured && (
        <div className="mb-8">
          <Banner tone="warn">
            Демо-режим: файл не уходит в Storage, запись имитируется. Подключите
            VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY для боевой записи.
          </Banner>
        </div>
      )}
      {error && (
        <div className="mb-8">
          <Banner tone="err">{error}</Banner>
        </div>
      )}
      {success && (
        <div className="mb-8">
          <Banner tone="ok">{success}</Banner>
        </div>
      )}

      <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-2">
        {/* Drop-zone / превью */}
        <div>
          <FieldLabel htmlFor="up-file">Файл кадра</FieldLabel>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") inputRef.current?.click();
            }}
            className={`relative flex min-h-[340px] cursor-pointer flex-col items-center justify-center overflow-hidden border-2 border-dashed p-6 transition-all duration-300 ${
              dragOver
                ? "border-acc bg-acc/[0.06]"
                : preview
                  ? "border-line bg-panel/40"
                  : "border-line bg-panel/20 hover:border-acc/60 hover:bg-panel/40"
            }`}
          >
            <input
              ref={inputRef}
              id="up-file"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) acceptFile(f);
              }}
            />
            {preview && dims ? (
              <>
                <img
                  src={preview}
                  alt="Превью загружаемого кадра"
                  className="lb-in max-h-[420px] w-auto max-w-full object-contain"
                />
                <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-mut">
                  {dims.w} × {dims.h} px · {(file?.size ?? 0) > 1024 * 1024
                    ? `${((file?.size ?? 0) / 1024 / 1024).toFixed(1)} MB`
                    : `${Math.round((file?.size ?? 0) / 1024)} KB`}
                </p>
              </>
            ) : (
              <>
                <UploadIcon size={34} className={`transition-colors ${dragOver ? "text-acc" : "text-mut"}`} />
                <p className="mt-4 font-display text-xl font-semibold">
                  {dragOver ? "Отпускайте — поймаем" : "Перетащите кадр сюда"}
                </p>
                <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-mut">
                  или кликните для выбора · JPG / PNG
                </p>
              </>
            )}
          </div>
        </div>

        {/* Метаданные */}
        <div className="space-y-6">
          <div>
            <FieldLabel htmlFor="up-project">Проект</FieldLabel>
            <select
              id="up-project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className={`${inputCls} appearance-none`}
            >
              {(data?.projects ?? []).map((p) => (
                <option key={p.id} value={p.id} className="bg-coal">
                  {p.title} · {p.date?.slice(0, 4) ?? "—"}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="up-camera">Камера</FieldLabel>
              <input
                id="up-camera"
                value={camera}
                onChange={(e) => setCamera(e.target.value)}
                placeholder="Leica M6"
                className={inputCls}
              />
            </div>
            <div>
              <FieldLabel htmlFor="up-lens">Объектив</FieldLabel>
              <input
                id="up-lens"
                value={lens}
                onChange={(e) => setLens(e.target.value)}
                placeholder="Summicron 35mm ƒ/2"
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <FieldLabel htmlFor="up-settings">Настройки (ƒ / выдержка / ISO)</FieldLabel>
            <input
              id="up-settings"
              value={settings}
              onChange={(e) => setSettings(e.target.value)}
              placeholder="ƒ/2 · 1/60 · ISO 1600"
              className={inputCls}
            />
          </div>
          <div className="max-w-[140px]">
            <FieldLabel htmlFor="up-order">Порядок</FieldLabel>
            <input
              id="up-order"
              type="number"
              min={1}
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value) || 1)}
              className={inputCls}
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="group flex w-full items-center justify-center gap-3 border border-ink/50 py-4 font-mono text-[11px] uppercase tracking-[0.3em] text-ink transition-all duration-400 hover:border-acc hover:bg-acc hover:text-coal disabled:cursor-wait disabled:opacity-60 sm:max-w-xs"
          >
            {busy ? (
              <>
                <span className="pulsedot h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                Проявляем…
              </>
            ) : (
              <>
                <UploadIcon size={16} />
                {supabase ? "Загрузить в Supabase" : "Загрузить (демо)"}
              </>
            )}
          </button>
        </div>
      </form>

      {/* Загрузки текущей сессии (демо) */}
      {sessionUploads.length > 0 && (
        <div className="mt-14">
          <h2 className="mb-4 font-display text-xl font-semibold">Загружено в этой сессии</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {sessionUploads.map((u) => (
              <div key={u.id} className="relative aspect-square overflow-hidden border border-line bg-panel">
                {u.thumb ? (
                  <img src={u.thumb} alt={u.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center p-2 text-center font-mono text-[9px] uppercase tracking-[0.12em] text-mut">
                    {u.name}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
