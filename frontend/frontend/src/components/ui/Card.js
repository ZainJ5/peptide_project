export default function Card({ children, className = "" }) {
  return (
    <div className={`rounded-xl border border-slate-200/70 bg-(--color-card)/90 shadow-[0_10px_35px_rgba(15,23,42,0.06)] backdrop-blur ${className}`}>
      {children}
    </div>
  );
}
