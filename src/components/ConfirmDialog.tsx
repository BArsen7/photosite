import { useEffect, useState, type ReactNode } from "react";
import { useLockBody } from "../lib/motion";
import { AlertTriangleIcon, CloseIcon } from "./Icons";

/**
 * Кастомное окно подтверждения «Are you sure?».
 * Вызывается перед необратимыми действиями (удаление из БД и Storage).
 * children — опциональное превью удаляемого (миниатюра кадра и т.п.).
 */
export default function ConfirmDialog({
  open,
  heading = "Are you sure?",
  message,
  confirmLabel = "Удалить навсегда",
  busyLabel = "Удаляем…",
  onCancel,
  onConfirm,
  children,
}: {
  open: boolean;
  heading?: string;
  message: string;
  confirmLabel?: string;
  busyLabel?: string;
  onCancel: () => void;
  /** Асинхронное действие; диалог сам ведёт состояние «занят». */
  onConfirm: () => Promise<void>;
  children?: ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  useLockBody(open);

  /* Сброс занятости при закрытии */
  useEffect(() => {
    if (!open) setBusy(false);
  }, [open]);

  /* Esc закрывает (пока не идёт удаление) */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label={heading}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-coal/85 p-5 backdrop-blur-sm"
      onClick={() => !busy && onCancel()}
    >
      <div
        className="pop-in w-full max-w-md border border-line bg-panel shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Шапка с предупреждением */}
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <span className="flex items-center gap-3">
            <AlertTriangleIcon size={20} className="text-err" />
            <span className="font-display text-xl font-semibold tracking-tight">{heading}</span>
          </span>
          <button
            onClick={onCancel}
            disabled={busy}
            aria-label="Закрыть"
            className="group p-1.5 text-mut transition-colors hover:text-ink disabled:opacity-40"
          >
            <CloseIcon size={18} className="transition-transform duration-500 group-hover:rotate-90" />
          </button>
        </div>

        {/* Превью удаляемого */}
        {children && <div className="px-6 pt-5">{children}</div>}

        <div className="px-6 py-5">
          <p className="text-sm leading-relaxed text-mut">{message}</p>
        </div>

        {/* Кнопки */}
        <div className="grid grid-cols-2 border-t border-line">
          <button
            onClick={onCancel}
            disabled={busy}
            className="px-6 py-4 font-mono text-[10px] uppercase tracking-[0.25em] text-mut transition-colors hover:bg-raise hover:text-ink disabled:opacity-40"
          >
            Отмена
          </button>
          <button
            onClick={handleConfirm}
            disabled={busy}
            className="flex items-center justify-center gap-2.5 border-l border-line bg-err/[0.08] px-6 py-4 font-mono text-[10px] uppercase tracking-[0.25em] text-err transition-all hover:bg-err hover:text-coal disabled:cursor-wait disabled:opacity-70"
          >
            {busy ? (
              <>
                <span className="pulsedot h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                {busyLabel}
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
