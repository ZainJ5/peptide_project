"use client";

export default function Button({ children, variant = "primary", className = "", ...props }) {
  const variants = {
    primary: "bg-(--color-accent) text-white hover:bg-[#0da472]",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100",
    ghost: "bg-transparent text-(--color-primary) hover:bg-slate-100",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2 flex-shrink-0 text-sm font-semibold cursor-pointer transition-all duration-200 active:scale-95 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
