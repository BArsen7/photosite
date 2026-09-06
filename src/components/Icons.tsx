/** Кастомные SVG-иконки, нарисованные под проект (stroke: currentColor). */

type IconProps = { size?: number; className?: string };

const base = (size: number | undefined, className: string | undefined) => ({
  width: size ?? 20,
  height: size ?? 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "square" as const,
  className,
  "aria-hidden": true as const,
});

/* Логотип: рамка кадра + диафрагма */
export function LogoMark({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M3 3h5M3 3v5M21 3h-5M21 3v5M3 21h5M3 21v-5M21 21h-5M21 21v-5" />
      <circle cx="12" cy="12" r="5.2" />
      <path d="M12 6.8v2.7M16.5 9.4l-2.3 1.35M16.5 14.6l-2.3-1.35M12 17.2v-2.7M7.5 14.6l2.3-1.35M7.5 9.4l2.3 1.35" strokeWidth="1.2" />
    </svg>
  );
}

export function ArrowUpRight({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M6.5 17.5 17.5 6.5M8 6.5h9.5V16" />
    </svg>
  );
}

export function ArrowUp({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M12 20V4M5.5 10.5 12 4l6.5 6.5" />
    </svg>
  );
}

export function ChevronLeft({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M14.5 5 7.5 12l7 7" />
    </svg>
  );
}

export function ChevronRight({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="m9.5 5 7 7-7 7" />
    </svg>
  );
}

export function CloseIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function SendIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M21 3 10.8 13.2M21 3l-6.8 18-3.4-7.8L3 9.8 21 3Z" />
    </svg>
  );
}

export function MailIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <rect x="3" y="5.5" width="18" height="13" />
      <path d="m3.5 6.5 8.5 6 8.5-6" />
    </svg>
  );
}

export function PinIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M12 21s-6.5-6.2-6.5-10.7a6.5 6.5 0 0 1 13 0C18.5 14.8 12 21 12 21Z" />
      <circle cx="12" cy="10.3" r="2.2" />
    </svg>
  );
}

export function TgIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="m21 4.5-18.5 7.4 5.8 2.1L10.5 20l3-4.2 4.8 3.4L21 4.5Z" />
      <path d="m8.3 14 9.7-7.6" strokeWidth="1.2" />
    </svg>
  );
}

export function IgIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <rect x="3.5" y="3.5" width="17" height="17" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.2 6.8v.01" strokeWidth="2.4" />
    </svg>
  );
}

export function VkIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M3.5 7h2.4c.7 4.6 2.8 6.6 4.1 6.9V7h2.3v2.9c1.3-.14 2.7-1.6 3.2-2.9h2.3c-.4 1.6-1.9 3.1-2.9 3.7 1 .5 2.7 1.8 3.4 3.8h-2.6c-.5-1.7-1.9-3-3.4-3.2v3.2h-.3c-5 0-8.1-3.4-8.5-7.5Z" />
    </svg>
  );
}

export function CheckIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.2 12.3 2.6 2.7 5-5.6" />
    </svg>
  );
}

export function PlusIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function DiamondSep({ size = 7, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 8 8" className={className} aria-hidden="true">
      <rect x="1.6" y="1.6" width="4.8" height="4.8" transform="rotate(45 4 4)" fill="currentColor" />
    </svg>
  );
}

/* Угловые метки кадра — фирменный мотив «контактного листа». */
export function FrameCorners({ className = "" }: { className?: string }) {
  const corners = [
    "left-0 top-0 border-l border-t",
    "right-0 top-0 border-r border-t",
    "left-0 bottom-0 border-l border-b",
    "right-0 bottom-0 border-r border-b",
  ];
  return (
    <div className={`pointer-events-none absolute inset-3 z-10 ${className}`} aria-hidden="true">
      {corners.map((pos) => (
        <span key={pos} className={`absolute h-4 w-4 border-acc ${pos}`} />
      ))}
    </div>
  );
}

/* ── Иконки админ-панели ─────────────────────────────────────────────── */

export function GridIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <rect x="4" y="4" width="7" height="7" />
      <rect x="13" y="4" width="7" height="7" />
      <rect x="4" y="13" width="7" height="7" />
      <rect x="13" y="13" width="7" height="7" />
    </svg>
  );
}

export function UploadIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M12 15V4M7.5 8.5 12 4l4.5 4.5" />
      <path d="M4 15v5h16v-5" />
    </svg>
  );
}

export function LayersIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <rect x="4" y="4" width="12" height="12" />
      <path d="M8 8h12v12H8" />
    </svg>
  );
}

export function ExitIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M14 4H5v16h9" />
      <path d="M10 12h11M17 8l4 4-4 4" />
    </svg>
  );
}

export function TrashIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M4.5 7h15M9.5 7V4.5h5V7" />
      <path d="M6.5 7 7.5 20h9L17.5 7M10 10.5v6M14 10.5v6" />
    </svg>
  );
}

export function PencilIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="m4 20 .8-3.8L15.6 5.4a1.6 1.6 0 0 1 2.3 0l.7.7a1.6 1.6 0 0 1 0 2.3L7.8 19.2 4 20Z" />
      <path d="m13.8 7.2 3 3" />
    </svg>
  );
}

export function FilmIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <rect x="3.5" y="5" width="17" height="14" />
      <path d="M7.5 5v14M16.5 5v14" />
      <path d="M3.5 9h4M3.5 13h4M3.5 17h4M16.5 9h4M16.5 13h4M16.5 17h4" strokeWidth="1.1" />
    </svg>
  );
}

export function SearchIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="m15.2 15.2 5.3 5.3" />
    </svg>
  );
}

export function AlertTriangleIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M12 4 2.8 19.5h18.4L12 4Z" />
      <path d="M12 10v4M12 16.6v.01" strokeWidth="1.8" />
    </svg>
  );
}
