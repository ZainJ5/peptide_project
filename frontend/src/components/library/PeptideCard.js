import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { toDisplayImageUrl } from "@/lib/imageUrl";

export default function PeptideCard({ peptide, view = "grid" }) {
  const isList = view === "list";
  const imageSrc = toDisplayImageUrl(peptide.imageUrl) || "/fallback-peptide.png";
  const primaryCategory = peptide.healthCategories?.[0] || "General";
  const isGeneralCategory = String(primaryCategory).toLowerCase() === "general";

  return (
    <Card className={`group relative min-w-0 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-(--color-primary)/5 ${isList ? 'flex flex-col sm:flex-row' : 'flex flex-col'}`}>
      {/* Image Section */}
      <div className={`relative bg-slate-100 ${isList ? 'aspect-8/9 w-full sm:w-48 shrink-0' : 'aspect-8/9 w-full'} overflow-hidden`}>
        {peptide.imageUrl ? (
          <img 
            src={imageSrc} 
            alt={peptide.name} 
            className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-200/50">
            <span className="text-sm font-medium text-slate-400">No Image</span>
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="rounded-full bg-white/90 px-2 py-0.5 text-[9px] sm:px-2.5 sm:py-1 sm:text-[10px] font-bold tracking-wide uppercase text-(--color-primary) shadow-sm backdrop-blur-md">
            {peptide.type}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-(--color-primary) transition-colors leading-snug wrap-break-word sm:line-clamp-1">{peptide.name}</h3>
            <p className="mt-1 text-sm font-medium text-slate-500">{peptide.mgAmount || "Varies"}</p>
          </div>
          <span className={`shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold capitalize tracking-tight text-emerald-700 ring-1 ring-inset ring-emerald-600/20 ${isGeneralCategory ? "hidden sm:inline-flex" : "inline-flex"}`}>
            {primaryCategory}
          </span>
        </div>
        
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-600 flex-1 min-h-10">
          {peptide.howItWorks || peptide.protocolTitle || "Comprehensive clinical protocol data unavailable."}
        </p>
        
        <div className=" flex items-center justify-between border-t border-slate-100 pt-2 sm:pt-2">
          <Link href={`/library/${peptide.id}`} className="w-full">
            <Button variant="secondary" className="w-full font-bold bg-slate-50 hover:bg-slate-200 hover:text-slate-900 transition-colors text-sm">
              <span className="sm:hidden">View Details</span>
              <span className="hidden sm:inline">View Protocol Details</span>
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
