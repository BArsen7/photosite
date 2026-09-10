import { useEffect, useRef, useState, type DragEvent } from "react";
import { PageHead } from "../ui";
import { UploadIcon, CheckIcon } from "../../../components/Icons";
import { fetchPortfolio, uploadPhoto, type PortfolioData } from "../../../lib/api";

const inputCls =
  "w-full border border-line bg-coal px-4 py-2.5 font-mono text-sm text-ink outline-none transition-colors duration-300 placeholder:text-mut/50 focus:border-acc";
const labelCls = "mb-2 block font-mono text-[9px] uppercase tracking-[0.25em] text-mut";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

/** /admin/upload — загрузка кадра: файл + проект + EXIF → локальное хранилище. */
export default function AdminUploadPage() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState<{ url: string; width: number; height: number } | null>(null);
  const [previews, setPreviews] = useState<Array<{ url: string; width: number; height: number; file: File }>>([]);
  const [projectId, setProjectId] = useState("");
  const [exif, setExif] = useState({ camera: "Canon R8", lens: "", settings: "" });
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [savedUrl, setSavedUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputMultipleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPortfolio().then((d) => {
      if (!cancelled) setData(d);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  /* Принять файл: проверка типа/размера + превью с реальными размерами */
  const acceptFile = (f: File) => {
    setError(null);
    if (!ACCEPTED.includes(f.type)) {
      setError("Поддерживаются jpeg, png, webp, gif, avif");
      return;
    }
    if (f.size > 100 * 1024 * 1024) {
      setError("Файл больше 100 МБ");
      return;
    }
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => setPreview({ url, width: img.naturalWidth, height: img.naturalHeight });
    img.src = url;
    setFile(f);
    setStatus("idle");
  };

  /* Принять несколько файлов для загрузки */
  const acceptFiles = (fileList: File[]) => {
    setError(null);
    const validFiles: File[] = [];
    const newPreviews: Array<{ url: string; width: number; height: number; file: File }> = [];

    for (const f of fileList) {
      if (!ACCEPTED.includes(f.type)) {
        setError(`Файл "${f.name}" имеет неподдерживаемый формат`);
        continue;
      }
      if (f.size > 100 * 1024 * 1024) {
        setError(`Файл "${f.name}" больше 100 МБ`);
        continue;
      }
      validFiles.push(f);
      const url = URL.createObjectURL(f);
      const img = new Image();
      img.onload = () => {
        newPreviews.push({ url, width: img.naturalWidth, height: img.naturalHeight, file: f });
        setPreviews([...newPreviews]);
      };
      img.src = url;
    }

    setFiles(validFiles);
    setStatus("idle");
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) acceptFile(f);
  };

  const onDropMultiple = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const fileList = Array.from(e.dataTransfer.files || []);
    if (fileList.length > 0) acceptFiles(fileList);
  };

  const submit = async () => {
    if (!file || !projectId) return;
    setError(null);
    setStatus("saving");
    try {
      const res = await uploadPhoto(file, {
        project_id: projectId,
        exif_camera: exif.camera.trim() || undefined,
        exif_lens: exif.lens.trim() || undefined,
        exif_settings: exif.settings.trim() || undefined,
        width: preview?.width,
        height: preview?.height,
      });
      setSavedUrl(res.image_url);
      setStatus("done");
      /* Сброс формы под следующий кадр */
      if (preview) URL.revokeObjectURL(preview.url);
      setFile(null);
      setPreview(null);
      setExif({ camera: "Canon R8", lens: "", settings: "" });
      if (inputRef.current) inputRef.current.value = "";
    } catch (e) {
      setStatus("idle");
      setError(e instanceof Error ? e.message : "Не удалось загрузить файл");
    }
  };

  const submitMultiple = async () => {
    if (files.length === 0 || !projectId) return;
    setError(null);
    setStatus("saving");
    let successCount = 0;
    let lastImageUrl: string | null = null;

    try {
      for (const f of files) {
        const img = new Image();
        const url = URL.createObjectURL(f);
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.src = url;
        });

        const res = await uploadPhoto(f, {
          project_id: projectId,
          exif_camera: exif.camera.trim() || undefined,
          exif_lens: exif.lens.trim() || undefined,
          exif_settings: exif.settings.trim() || undefined,
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
        lastImageUrl = res.image_url;
        successCount++;
        URL.revokeObjectURL(url);
      }

      setSavedUrl(lastImageUrl);
      setStatus("done");
      /* Сброс формы */
      setFiles([]);
      setPreviews([]);
      setExif({ camera: "Canon R8", lens: "", settings: "" });
      if (inputRef.current) inputRef.current.value = "";
    } catch (e) {
      setStatus("idle");
      setError(e instanceof Error ? e.message : `Загружено ${successCount} из ${files.length}`);
    }
  };

  return (
    <div className="px-6 py-10 md:px-10">
      <PageHead
        kicker="Тёмная комната · Загрузка"
        title="Загрузка кадра"
        sub="Файл уходит в volume на сервере, строка с EXIF — в базу. jpeg / png / webp / gif / avif, до 100 МБ."
      />

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Дроп-зона для одиночного файла */}
        <div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`flex aspect-[4/3] w-full flex-col items-center justify-center gap-4 border border-dashed transition-all duration-300 ${
              dragOver
                ? "border-acc bg-acc/[0.07] scale-[1.01]"
                : "border-line bg-panel/40 hover:border-acc/60"
            }`}
          >
            {preview ? (
              <>
                <img src={preview.url} alt="Предпросмотр кадра" className="max-h-[280px] max-w-[85%] object-contain" />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-mut">
                  {file?.name} · {preview.width}×{preview.height}
                </span>
              </>
            ) : (
              <>
                <UploadIcon size={34} className={dragOver ? "text-acc" : "text-mut"} />
                <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-mut">
                  Перетащите файл или кликните
                </span>
              </>
            )}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED.join(",")}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) acceptFile(f);
            }}
          />
          {savedUrl && status === "done" && (
            <div className="fadeup mt-4 flex items-center gap-4 border border-acc/50 bg-acc/[0.06] p-3">
              <img src={savedUrl} alt="Загруженный кадр" className="h-14 w-14 object-cover" />
              <div>
                <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-acc">
                  <CheckIcon size={15} /> Кадр в архиве
                </p>
                <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.15em] text-mut">
                  Можно загружать следующий
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Дроп-зона для нескольких файлов */}
        <div>
          <button
            type="button"
            onClick={() => inputMultipleRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDropMultiple}
            className={`flex aspect-[4/3] w-full flex-col items-center justify-center gap-4 border border-dashed transition-all duration-300 ${
              dragOver
                ? "border-acc bg-acc/[0.07] scale-[1.01]"
                : "border-line bg-panel/40 hover:border-acc/60"
            }`}
          >
            {previews.length > 0 ? (
              <>
                <div className="flex flex-wrap justify-center gap-2">
                  {previews.map((p, i) => (
                    <img key={i} src={p.url} alt={`Предпросмотр ${i + 1}`} className="h-16 w-16 object-cover" />
                  ))}
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-mut">
                  Файлов выбрано: {previews.length}
                </span>
              </>
            ) : (
              <>
                <UploadIcon size={34} className={dragOver ? "text-acc" : "text-mut"} />
                <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-mut">
                  Перетащите несколько файлов или кликните
                </span>
              </>
            )}
          </button>
          <input
            ref={inputMultipleRef}
            type="file"
            accept={ACCEPTED.join(",")}
            multiple
            className="hidden"
            onChange={(e) => {
              const fileList = Array.from(e.target.files || []);
              if (fileList.length > 0) acceptFiles(fileList);
            }}
          />
        </div>

        {/* Метаданные */}
        <div className="space-y-5">
          <div>
            <label htmlFor="up-project" className={labelCls}>Проект *</label>
            <select
              id="up-project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className={inputCls}
            >
              <option value="">— выберите проект —</option>
              {(data?.projects ?? []).map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
            {data && data.projects.length === 0 && (
              <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.15em] text-err">
                Сначала создайте проект на странице «Проекты»
              </p>
            )}
          </div>
          <div>
            <label htmlFor="up-cam" className={labelCls}>Камера</label>
            <input id="up-cam" value={exif.camera} onChange={(e) => setExif({ ...exif, camera: e.target.value })} placeholder="Canon R8" className={inputCls} />
          </div>
          <div>
            <label htmlFor="up-lens" className={labelCls}>Объектив</label>
            <input id="up-lens" value={exif.lens} onChange={(e) => setExif({ ...exif, lens: e.target.value })} placeholder="EF 35mm ƒ/2.0" className={inputCls} />
          </div>
          <div>
            <label htmlFor="up-set" className={labelCls}>Параметры съёмки</label>
            <input id="up-set" value={exif.settings} onChange={(e) => setExif({ ...exif, settings: e.target.value })} placeholder="ƒ/2.0 · 1/250 · ISO 100" className={inputCls} />
          </div>

          {error && (
            <div role="alert" className="border border-err/50 bg-err/[0.08] px-4 py-3 text-sm text-err">
              {error}
            </div>
          )}

          <button
            onClick={submit}
            disabled={!file || !projectId || status === "saving"}
            className="flex w-full items-center justify-center gap-3 border border-ink/50 py-3.5 font-mono text-[11px] uppercase tracking-[0.3em] text-ink transition-all duration-400 hover:border-acc hover:bg-acc hover:text-coal disabled:cursor-not-allowed disabled:opacity-40"
          >
            {status === "saving" ? (
              <>
                <span className="pulsedot h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                Проявляем…
              </>
            ) : (
              "Загрузить в архив"
            )}
          </button>

          <button
            onClick={submitMultiple}
            disabled={files.length === 0 || !projectId || status === "saving"}
            className="flex w-full items-center justify-center gap-3 border border-ink/50 py-3.5 font-mono text-[11px] uppercase tracking-[0.3em] text-ink transition-all duration-400 hover:border-acc hover:bg-acc hover:text-coal disabled:cursor-not-allowed disabled:opacity-40"
          >
            {status === "saving" ? (
              <>
                <span className="pulsedot h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                Проявляем…
              </>
            ) : (
              `Загрузить ${files.length} файл(ов)`
            )}
          </button>
          <p className="font-mono text-[9px] uppercase leading-relaxed tracking-[0.18em] text-mut/70">
            Ширина и высота считываются из файла автоматически — сетка
            портфолио соберётся без сдвигов.
          </p>
        </div>
      </div>
    </div>
  );
}
