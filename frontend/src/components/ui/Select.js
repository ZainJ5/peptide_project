export default function Select({ className = "", children, id, ...props }) {
  return (
    <select
      id={id}
      className={`w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-(--color-primary) focus:outline-none ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
