import Link from "next/link";
import Image from "next/image";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function PeptideCard({ peptide, view = "grid" }) {
  const isList = view === "list";
  const imageSrc = peptide.imageUrl || "/fallback-peptide.png";

  return (
    <Card className={`group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-(--color-primary)/5 ${isList ? 'flex flex-col sm:flex-row' : 'flex flex-col'}`}>
      {/* Image Section */}
      <div className={`relative bg-slate-100 ${isList ? 'h-48 w-full sm:h-auto sm:w-48 shrink-0' : 'aspect-video w-full'} overflow-hidden`}>
        {peptide.imageUrl ? (
          <img 
            src={imageSrc} 
            alt={peptide.name} 
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-200/50">
            <span className="text-sm font-medium text-slate-400">No Image</span>
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase text-(--color-primary) shadow-sm backdrop-blur-md">
            {peptide.type}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-(--color-primary) transition-colors line-clamp-1">{peptide.name}</h3>
            <p className="mt-1 text-sm font-medium text-slate-500">{peptide.mgAmount || "Varies"}</p>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold capitalize tracking-tight text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
            {peptide.healthCategories?.[0] || "General"}
          </span>
        </div>
        
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-600 flex-1">
          {peptide.howItWorks || peptide.protocolTitle || "Comprehensive clinical protocol data unavailable."}
        </p>
        
        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
          <Link href={`/library/${peptide.id}`} className="w-full">
            <Button variant="secondary" className="w-full font-bold bg-slate-50 hover:bg-slate-200 hover:text-slate-900 transition-colors">
              View Protocol Details
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
