"use client";

import { useEffect, useId } from "react";
import { Loader2, X } from "lucide-react";

/* Small design-system kit for the admin panel. Mirrors the public site:
   slate neutrals, navy primary (--color-primary), emerald accent, rounded-2xl. */

export function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const BUTTON_VARIANTS = {
  primary: "bg-emerald-500 text-white shadow-sm shadow-emerald-500/25 hover:bg-emerald-600",
  navy: "bg-(--color-primary) text-white shadow-sm shadow-blue-900/20 hover:bg-[#1a3278]",
  secondary: "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  danger: "bg-red-600 text-white shadow-sm shadow-red-600/20 hover:bg-red-700",
  dangerSoft: "border border-red-200 bg-white text-red-600 hover:bg-red-50",
};

const BUTTON_SIZES = {
  sm: "h-8 gap-1.5 rounded-lg px-3 text-xs",
  md: "h-10 gap-2 rounded-xl px-4 text-sm",
  lg: "h-11 gap-2 rounded-xl px-5 text-sm",
  icon: "h-9 w-9 rounded-lg",
};

export function AdminButton({
  variant = "secondary", size = "md", loading = false, icon: Icon, className, children, disabled, type = "button", ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cx(
        "inline-flex shrink-0 items-center justify-center font-semibold transition-all duration-150 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-55 disabled:active:scale-100",
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        className
      )}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon ? <Icon className="h-4 w-4" strokeWidth={2} /> : null}
      {children}
    </button>
  );
}

export function Card({ className, children, ...props }) {
  return (
    <div className={cx("rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]", className)} {...props}>
      {children}
    </div>
  );
}

export function SectionCard({ id, title, description, icon: Icon, actions, children, className }) {
  return (
    <Card id={id} className={cx("scroll-mt-24", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
        <div className="flex min-w-0 items-start gap-3">
          {Icon && (
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-(--color-primary)">
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-[15px] font-bold text-slate-900">{title}</h2>
            {description && <p className="mt-0.5 text-[13px] leading-relaxed text-slate-500">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="px-5 py-5 sm:px-6">{children}</div>
    </Card>
  );
}

export function Field({ label, hint, error, required, children, className, htmlFor, counter }) {
  return (
    <div className={className}>
      {label && (
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <label htmlFor={htmlFor} className="text-[13px] font-semibold text-slate-700">
            {label}
            {required && <span className="ml-0.5 text-red-500">*</span>}
          </label>
          {counter}
        </div>
      )}
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}

const inputBase =
  "w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-4 disabled:bg-slate-50 disabled:text-slate-500";
const inputTone = (error) =>
  error
    ? "border-red-300 focus:border-red-400 focus:ring-red-100"
    : "border-slate-200 hover:border-slate-300 focus:border-(--color-primary) focus:ring-blue-100";

export function TextInput({ error, className, ...props }) {
  return <input className={cx(inputBase, "h-10", inputTone(error), className)} aria-invalid={Boolean(error)} {...props} />;
}

export function TextArea({ error, className, rows = 5, ...props }) {
  return (
    <textarea
      rows={rows}
      className={cx(inputBase, "py-2.5 leading-relaxed", inputTone(error), className)}
      aria-invalid={Boolean(error)}
      {...props}
    />
  );
}

export function SelectInput({ error, className, children, ...props }) {
  return (
    <select className={cx(inputBase, "h-10 pr-8", inputTone(error), className)} aria-invalid={Boolean(error)} {...props}>
      {children}
    </select>
  );
}

export function CharCount({ value, max }) {
  const len = (value || "").length;
  return (
    <span className={cx("text-[11px] font-medium tabular-nums", len > max ? "text-red-500" : "text-slate-400")}>
      {len.toLocaleString()} / {max.toLocaleString()}
    </span>
  );
}

const BADGE_TONES = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  slate: "bg-slate-100 text-slate-600 ring-slate-500/15",
  blue: "bg-blue-50 text-blue-700 ring-blue-600/15",
  violet: "bg-violet-50 text-violet-700 ring-violet-600/15",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
  red: "bg-red-50 text-red-700 ring-red-600/15",
};

export function Badge({ tone = "slate", dot = false, className, children }) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset", BADGE_TONES[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function StatusBadge({ active }) {
  return active ? <Badge tone="green" dot>Live</Badge> : <Badge tone="slate" dot>Hidden</Badge>;
}

export function Switch({ checked, onChange, label, disabled, size = "md" }) {
  const dims = size === "sm" ? "h-5 w-9" : "h-6 w-11";
  const knob = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const shift = size === "sm" ? "translate-x-4" : "translate-x-5";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx(
        "relative inline-flex shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50",
        dims,
        checked ? "bg-emerald-500" : "bg-slate-300"
      )}
    >
      <span className={cx("rounded-full bg-white shadow-sm transition-transform duration-200", knob, checked ? shift : "translate-x-0")} />
    </button>
  );
}

export function Spinner({ className }) {
  return <Loader2 className={cx("h-5 w-5 animate-spin text-slate-400", className)} />;
}

export function Skeleton({ className }) {
  return <div className={cx("animate-pulse rounded-lg bg-slate-200/70", className)} />;
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {Icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <Icon className="h-6 w-6" strokeWidth={1.75} />
        </div>
      )}
      <p className="text-sm font-bold text-slate-900">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <p className="text-sm font-bold text-slate-900">Couldn&apos;t load this data</p>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{error?.message || "Unknown error"}</p>
      {onRetry && <AdminButton className="mt-5" onClick={onRetry}>Try again</AdminButton>}
    </div>
  );
}

export function PageHeader({ title, description, actions, eyebrow }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1.5">{eyebrow}</div>}
        <h1 className="truncate text-2xl font-extrabold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Modal({ open, title, description, onClose, children, footer, busy = false, size = "md" }) {
  const titleId = useId();
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, busy, onClose]);

  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]" onClick={() => !busy && onClose()} />
      <div className={cx("relative w-full overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl", size === "sm" ? "sm:max-w-md" : "sm:max-w-lg")}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <div>
            <h3 id={titleId} className="text-base font-bold text-slate-900">{title}</h3>
            {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
          </div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Close" className="-mr-2 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-3.5">{footer}</div>}
      </div>
    </div>
  );
}

export function formatDate(value, { time = false } = {}) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    ...(time ? { hour: "numeric", minute: "2-digit" } : {}),
  });
}

export function timeAgo(value) {
  if (!value) return "—";
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
}
