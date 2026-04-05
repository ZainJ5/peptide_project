"use client";

export default function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-8 w-14 min-h-[44px] min-w-[44px] items-center rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-primary) ${checked ? "bg-(--color-accent)" : "bg-slate-300"}`}
      aria-checked={checked}
      aria-label={label}
    >
      <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${checked ? "left-7" : "left-1"}`} />
    </button>
  );
}
