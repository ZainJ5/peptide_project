import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function PeptideCard({ peptide, view = "grid" }) {
  const isList = view === "list";
  const summaryText = peptide.protocolTitle || peptide.howItWorks || "Comprehensive clinical protocol data unavailable.";

  if (isList) {
    return (
      <Card className="group relative min-w-0 overflow-hidden border border-slate-200/80 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg">
        <div className="h-0.5 w-full bg-linear-to-r from-(--color-primary)/90 via-emerald-500/80 to-cyan-500/70" />
        <div className="grid gap-2.5 p-3 sm:p-4 md:grid-cols-12 md:items-center md:gap-4">
          <div className="md:col-span-7 min-w-0">
            <div className="mb-1.5 flex flex-wrap items-center gap-1.5 sm:mb-2">
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-700">
                {peptide.type}
              </span>
              {peptide.mgAmount && (
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-blue-700">
                  {peptide.mgAmount}
                </span>
              )}
            </div>

            <h3 className="text-sm sm:text-base font-bold leading-snug text-slate-900 transition-colors group-hover:text-(--color-primary) line-clamp-2 sm:line-clamp-1">
              {peptide.name}
            </h3>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 sm:text-xs">
              Clinical Protocol
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600 line-clamp-2 sm:mt-2 sm:text-sm">
              {summaryText}
            </p>
          </div>

          <div className="md:col-span-12 pt-1 md:pt-0 md:flex md:justify-end">
            <Link href={`/library/${peptide.id}`} className="flex w-full md:w-auto">
              <Button variant="secondary" className="w-full bg-slate-50 px-4 py-2 text-xs font-bold transition-colors hover:bg-slate-200 hover:text-slate-900 sm:text-sm md:w-auto">
                View Protocol Details
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="group relative min-w-0 overflow-hidden border border-slate-200/80 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg flex flex-col">
      <div className="w-full h-1 bg-linear-to-r from-(--color-primary)/90 via-emerald-500/80 to-cyan-500/70" />
      <div className="flex flex-1 min-w-0 flex-col p-2.5 sm:p-5">
        <div className="mb-2 flex flex-wrap items-center gap-1 sm:mb-3 sm:gap-2">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-700 sm:px-2.5 sm:py-1 sm:text-[10px] sm:tracking-[0.14em]">
            {peptide.type}
          </span>
          {peptide.mgAmount && (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-blue-700 sm:px-2.5 sm:py-1 sm:text-[10px] sm:tracking-[0.14em]">
              {peptide.mgAmount}
            </span>
          )}
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 w-full">
            <h3 className="text-sm font-bold leading-snug text-slate-900 transition-colors group-hover:text-(--color-primary) line-clamp-2 wrap-break-word sm:text-base sm:line-clamp-1">
              {peptide.name}
            </h3>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              Clinical Protocol
            </p>
          </div>
        </div>

        <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 line-clamp-2 sm:line-clamp-3">
          {summaryText}
        </p>

        <div className="mt-2 pt-2 border-t border-slate-100 sm:mt-4 sm:pt-3">
          <Link href={`/library/${peptide.id}`} className="w-full">
            <Button variant="secondary" className="w-full bg-slate-50 px-2 py-1.5 text-xs font-bold transition-colors hover:bg-slate-200 hover:text-slate-900 sm:text-sm sm:py-2">
              <span className="sm:hidden">View Details</span>
              <span className="hidden sm:inline">View Protocol Details</span>
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
