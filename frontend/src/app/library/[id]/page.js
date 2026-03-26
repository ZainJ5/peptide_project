"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Syringe } from "lucide-react";
import PageTransition from "@/components/shared/PageTransition";
import Accordion from "@/components/ui/Accordion";
import Button from "@/components/ui/Button";
import DataTable from "@/components/ui/DataTable";
import Skeleton from "@/components/ui/Skeleton";
import StickyNav from "@/components/library/StickyNav";
import { usePeptideDetail } from "@/lib/hooks";
import { toDisplayImageUrl } from "@/lib/imageUrl";

const RECONSTITUTION_REFERENCE_IMAGE = "/OXYTOCIN 5MG RECONSTITUTION IMAGE.png";

function asCleanText(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  return String(value).trim();
}

function toBulletList(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => asCleanText(item)).filter(Boolean).flatMap((item) => toBulletList(item));
  }
  const text = asCleanText(value).replace(/\\n/g, "\n").replace(/\r/g, "").replace(/•/g, "\n• ").replace(/\n\s*[-*·]\s*/g, "\n");
  const lines = text.split("\n").map((line) => line.replace(/^\s*[-*•·]+\s*/, "").trim()).filter(Boolean);
  if (lines.length > 1) return lines;
  if (lines.length === 0) return [];
  const maybeSingleLine = lines[0];
  if (maybeSingleLine.includes(";")) return maybeSingleLine.split(";").map((p) => p.trim()).filter(Boolean);
  return [maybeSingleLine];
}

function formatCategoryLabel(value) {
  return asCleanText(value).split(/[\s_-]+/).filter(Boolean).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
}

export default function PeptideDetailPage() {
  const params = useParams();
  const router = useRouter();
  const peptideQuery = usePeptideDetail(params.id);

  const peptide = peptideQuery.data?.data;
  const primaryVariant = peptide?.scheduleVariants?.[0];

  const tableData = primaryVariant?.steps || [];
  const chartData = tableData.map((step) => ({
    week: step.weekStart || step.stepOrder,
    units: step.unitsPerInjection || 0,
  }));

  const benefits = useMemo(() => toBulletList(peptide?.benefits), [peptide?.benefits]);
  const sideEffects = useMemo(() => toBulletList(peptide?.sideEffects), [peptide?.sideEffects]);
  const preparationNotes = useMemo(() => toBulletList(peptide?.preparationNotes), [peptide?.preparationNotes]);
  const reconstitutionRequirements = useMemo(
    () => toBulletList(peptide?.reconstitutionRaw || peptide?.reconstitutionMl),
    [peptide?.reconstitutionRaw, peptide?.reconstitutionMl]
  );
  const hasReconstitutionImage = Boolean(peptide?.reconstitutionRaw || peptide?.preparationNotes);

  const columns = useMemo(
    () => [
      { header: "Step", accessorKey: "stepOrder" },
      { header: "Week Range", accessorKey: "weekRangeLabel" },
      { header: "Dose", accessorKey: "dailyDoseLabel" },
      { header: "Units", accessorKey: "unitsPerInjection" },
    ],
    []
  );

  if (peptideQuery.isLoading) {
    return (
      <div className="grid lg:grid-cols-[240px_minmax(0,1fr)] gap-8 animate-pulse">
        <Skeleton className="h-75 hidden lg:block rounded-2xl" />
        <div className="space-y-6">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!peptide) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h2 className="text-xl font-bold text-slate-900">Protocol Not Found</h2>
        <p className="mt-2 text-slate-500">The clinical protocol you are looking for does not exist.</p>
        <Button className="mt-6" onClick={() => router.push("/library")}>Return to Library</Button>
      </div>
    );
  }

  const sections = [
    { id: "overview", label: "Peptide Overview" },
    { id: "reconstitution", label: "Reconstitution Method" },
    { id: "dosage", label: "Dosing Schedule" },
    { id: "benefits", label: "Benefits" },
    { id: "side-effects", label: "Side effects" },
    { id: "injection-frequency", label: "Injection Frequency" },
    { id: "cycle-schedule", label: "Cycle Schedule" },
    { id: "final-prep-notes", label: "Final Prep Notes" },
  ];

  const imageSrc = toDisplayImageUrl(peptide.imageUrl) || "/fallback-peptide.png";
  const primaryCategory = formatCategoryLabel(peptide.healthCategories?.[0] || "General");

  return (
    <PageTransition>
      <div className="pt-2 sm:pt-6 lg:pt-8">

        {/* ═══ HERO SECTION ═══ */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm">

          {/* Mobile: stacked layout — image on top, content below */}
          <div className="block md:hidden">
            {/* Image — full width, contained */}
            <div className="relative w-full bg-gradient-to-b from-slate-100 to-slate-50">
              {peptide.imageUrl ? (
                <div className="flex items-center justify-center p-6 pb-4">
                  <img src={imageSrc} alt={peptide.name} className="h-48 w-auto max-w-full object-contain drop-shadow-md" />
                </div>
              ) : (
                <div className="flex h-44 items-center justify-center">
                  <Syringe className="h-16 w-16 text-slate-300" strokeWidth={1} />
                </div>
              )}
            </div>
            {/* Content */}
            <div className="px-5 pb-6 pt-4">
              <div className="mb-3 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-700 ring-1 ring-inset ring-emerald-600/15">{primaryCategory}</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-600">{peptide.type}</span>
                {peptide.mgAmount && <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-blue-700">{peptide.mgAmount}</span>}
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-(--color-primary)">{peptide.name}</h1>
              {peptide.protocolTitle && <p className="mt-2 text-sm leading-relaxed text-slate-500">{peptide.protocolTitle}</p>}
              <div className="mt-5">
                <Button size="lg" className="w-full shadow-lg shadow-emerald-600/15" onClick={() => router.push(`/schedule?add=${peptide.id}`)}>
                  Add to Schedule
                </Button>
              </div>
            </div>
          </div>

          {/* Desktop: side-by-side */}
          <div className="hidden md:grid md:grid-cols-[1fr_340px] lg:grid-cols-[1fr_400px]">
            {/* Left: content */}
            <div className="flex flex-col justify-center p-8 lg:p-10 xl:p-12">
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-emerald-700 ring-1 ring-inset ring-emerald-600/15">{primaryCategory}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-slate-600">{peptide.type}</span>
                {peptide.mgAmount && <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-blue-700">{peptide.mgAmount}</span>}
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-(--color-primary) lg:text-4xl xl:text-[2.75rem] xl:leading-tight">{peptide.name}</h1>
              <p className="mt-2 text-lg font-medium text-slate-600">{peptide.mgAmount || "Standard Dosage"} Protocol</p>
              {peptide.protocolTitle && <p className="mt-3 text-sm leading-relaxed text-slate-500 max-w-lg">{peptide.protocolTitle}</p>}
              <div className="mt-7">
                <Button size="lg" className="shadow-lg shadow-emerald-600/15" onClick={() => router.push(`/schedule?add=${peptide.id}`)}>
                  Add to Schedule
                </Button>
              </div>
            </div>
            {/* Right: image */}
            <div className="relative bg-gradient-to-br from-slate-50 to-slate-100/80">
              {peptide.imageUrl ? (
                <>
                  <div className="absolute inset-0 flex items-center justify-center p-2">
                    <img src={imageSrc} alt={peptide.name} className="h-full w-full object-contain drop-shadow-sm" />
                  </div>
                  <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-white to-transparent pointer-events-none" />
                </>
              ) : (
                <div className="flex h-full min-h-[280px] items-center justify-center">
                  <Syringe className="h-20 w-20 text-slate-300" strokeWidth={0.8} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══ QUICK STATS ROW ═══ */}
        <div className="mb-8 grid grid-cols-3 gap-2 sm:gap-3">
          <QuickStat icon="frequency" label="Injection Freq." value={asCleanText(peptide.injectionFrequencyRaw) || "Not specified"} />
          <QuickStat icon="cycle" label="Cycle Sched." value={asCleanText(peptide.cycleDurationRaw) || "Not specified"} />
          <QuickStat icon="recon" label="Reconstitution" value={asCleanText(peptide.reconstitutionRaw) || "Standard protocol"} />
        </div>

        {/* ═══ MAIN CONTENT ═══ */}
        <div className="flex flex-col lg:flex-row">
          {/* Sidebar nav */}
          <aside className="hidden lg:block w-56 shrink-0 lg:border-r lg:border-slate-200 lg:pr-6 lg:mr-8 mb-8 lg:mb-0">
            <div className="sticky top-36 space-y-8">
              <Link href="/library" className="group inline-flex items-center text-sm font-semibold text-slate-500 hover:text-(--color-primary) transition-all">
                <div className="mr-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 group-hover:bg-(--color-primary)/10 transition-colors">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </div>
                Back to Library
              </Link>
              <div>
                <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">On this page</h3>
                <StickyNav sections={sections} />
              </div>
            </div>
          </aside>

          {/* Content panels */}
          <section className="flex-1 min-w-0 space-y-6">

            {/* Peptide Overview */}
            <div id="overview" className="scroll-mt-6">
              <SectionCard title="Peptide Overview" icon="overview">
                <div className="text-[15px] leading-[1.8] text-slate-600">
                  {peptide.howItWorks || "Detailed mechanism of action data is currently unavailable for this protocol."}
                </div>
              </SectionCard>
            </div>

            {/* Reconstitution Method */}
            <div id="reconstitution" className="scroll-mt-6">
              <CustomCollapsibleSection
                title="Reconstitution Method"
                iconElem={
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--color-primary)/10">
                    <Syringe className="h-4.5 w-4.5 text-(--color-primary)" strokeWidth={1.5} />
                  </div>
                }
              >
                {hasReconstitutionImage && (
                  <div className="bg-gradient-to-b from-slate-900 to-slate-800 px-5 sm:px-8 py-6 sm:py-8">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-4 text-center">Reconstitution Method</p>
                    <img
                      src={RECONSTITUTION_REFERENCE_IMAGE}
                      alt="Reconstitution method reference"
                      className="mx-auto w-full max-w-md rounded-xl object-contain shadow-lg"
                    />
                  </div>
                )}
                <div className="p-5 sm:p-6">
                  <div className="rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-200/60 p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-(--color-primary) text-white text-xs font-bold">1</div>
                      <h3 className="text-sm font-bold text-slate-900">Reconstitution Requirements</h3>
                    </div>
                    {reconstitutionRequirements.length > 0 ? (
                      <ul className="space-y-2.5 ml-10">
                        {reconstitutionRequirements.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2.5">
                            <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-(--color-primary)/60" />
                            <span className="text-[13px] leading-relaxed text-slate-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-500 ml-10">No specific reconstitution instructions provided.</p>
                    )}
                  </div>
                </div>
              </CustomCollapsibleSection>
            </div>

            {/* Dosing Schedule */}
            <div id="dosage" className="scroll-mt-6">
              <SectionCard title="Dosing Schedule" icon="dosage">
                {peptide.scheduleVariants?.length > 1 && (
                  <div className="mb-5 overflow-hidden rounded-xl border border-slate-200">
                    <Accordion
                      items={peptide.scheduleVariants.map((variant) => ({
                        title: variant.name,
                        content: (
                          <div className="space-y-1.5 pr-4">
                            <p className="text-sm text-slate-600">Escalation steps: {variant.steps?.length || 0}</p>
                            {variant.summary?.maxDefinedWeek && (
                              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Defined through week {variant.summary.maxDefinedWeek}</p>
                            )}
                          </div>
                        ),
                      }))}
                    />
                  </div>
                )}
                {tableData.length > 0 ? (
                  <div className="space-y-5">
                    <div className="overflow-hidden rounded-xl border border-slate-200">
                      <DataTable data={tableData} columns={columns} />
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 sm:p-5">
                      <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Dose Escalation Curve</h3>
                      <div className="h-52 sm:h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} width={35} />
                            <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "13px" }} />
                            <Line type="monotone" dataKey="units" stroke="#1E3A8A" strokeWidth={2.5} dot={{ r: 3, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 5 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
                    <p className="text-sm font-medium text-slate-700">No structured dosing table available.</p>
                    <p className="mt-1 text-sm text-slate-500">Review injection frequency and cycle schedule below.</p>
                  </div>
                )}
              </SectionCard>
            </div>

            {/* Benefits */}
            <div id="benefits" className="scroll-mt-6">
              <SectionCard title="Benefits" icon="benefits">
                {benefits.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {benefits.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3 rounded-xl bg-emerald-50/50 border border-emerald-100/80 p-3.5">
                        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500">
                          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <span className="text-[13px] leading-relaxed text-slate-700">{item}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">No specific benefits listed.</p>
                )}
              </SectionCard>
            </div>

            {/* Side effects */}
            <div id="side-effects" className="scroll-mt-6">
              <CustomCollapsibleSection
                title="Side effects"
                headerBg="bg-red-50/40"
                headerBorder="border-red-100"
                titleColor="text-red-900"
                iconElem={
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
                    <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                  </div>
                }
              >
                <div className="p-5 sm:p-6 bg-white border border-red-200/60 border-t-0 rounded-b-2xl">
                  {sideEffects.length > 0 ? (
                    <div className="space-y-2.5">
                      {sideEffects.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3 rounded-lg bg-red-50/40 border border-red-100/60 p-3">
                          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 border border-red-200/60">
                            <svg className="h-3 w-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008" /></svg>
                          </div>
                          <span className="text-[13px] leading-relaxed text-red-800">{item}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-red-500/70">No specific side effects listed.</p>
                  )}
                </div>
              </CustomCollapsibleSection>
            </div>

            {/* Injection Frequency */}
            <div id="injection-frequency" className="scroll-mt-6">
              <SectionCard title="Injection Frequency" icon="guidance">
                <p className="text-sm leading-relaxed text-slate-600">{asCleanText(peptide.injectionFrequencyRaw) || "No injection frequency listed."}</p>
              </SectionCard>
            </div>

            {/* Cycle Schedule */}
            <div id="cycle-schedule" className="scroll-mt-6">
              <SectionCard title="Cycle Schedule" icon="dosage">
                <p className="text-sm leading-relaxed text-slate-600">{asCleanText(peptide.cycleDurationRaw) || "No cycle duration listed."}</p>
              </SectionCard>
            </div>

            {/* Final Prep Notes */}
            <div id="final-prep-notes" className="scroll-mt-6">
              <SectionCard title="Final Prep Notes" icon="reconstitution">
                {preparationNotes.length > 0 ? (
                  <ul className="space-y-2.5">
                    {preparationNotes.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-(--color-primary)/60" />
                        <span className="text-[13px] leading-relaxed text-slate-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">Standard clinical preparation protocols apply.</p>
                )}
              </SectionCard>
            </div>

          </section>
        </div>
      </div>
    </PageTransition>
  );
}


/* ── Custom Collapsible Section ── */
function CustomCollapsibleSection({ title, children, iconElem, headerBg = "bg-white", headerBorder = "border-slate-100", titleColor = "text-slate-900", startsOpen = true }) {
  const [isOpen, setIsOpen] = useState(startsOpen);
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden transition-all">
      <div 
        className={`flex items-center justify-between px-5 sm:px-6 py-4 border-b cursor-pointer select-none hover:opacity-90 transition-opacity ${headerBg} ${headerBorder}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2.5 sm:gap-3">
          {iconElem}
          <h2 className={`text-base font-bold sm:text-lg ${titleColor}`}>{title}</h2>
        </div>
        <svg
          className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {isOpen && <div className="animate-in fade-in slide-in-from-top-2">{children}</div>}
    </div>
  );
}

/* ── Reusable Section Card ── */
function SectionCard({ title, icon, children, startsOpen = true }) {
  const [isOpen, setIsOpen] = useState(startsOpen);

  const iconPaths = {
    overview: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />,
    guidance: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />,
    benefits: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    dosage: <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />,
    reconstitution: <Syringe className="h-4 w-4" strokeWidth={1.7} />,
  };
  const colorMap = {
    overview: "bg-(--color-primary)/10 text-(--color-primary)",
    guidance: "bg-amber-50 text-amber-600",
    benefits: "bg-emerald-50 text-emerald-600",
    dosage: "bg-indigo-50 text-indigo-600",
    reconstitution: "bg-cyan-50 text-cyan-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden transition-all">
      <div 
        className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-white hover:bg-slate-50 cursor-pointer select-none transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2.5">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${colorMap[icon] || "bg-slate-100 text-slate-600"}`}>
            {icon === "reconstitution" ? (
              iconPaths[icon]
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">{iconPaths[icon]}</svg>
            )}
          </div>
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">{title}</h2>
        </div>
        <svg
          className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {isOpen && <div className="p-5 sm:p-6 bg-white animate-in fade-in slide-in-from-top-2">{children}</div>}
    </div>
  );
}


/* ── Quick Stat Card ── */
function QuickStat({ icon, label, value }) {
  const icons = {
    frequency: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />,
    cycle: <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />,
    recon: <Syringe className="h-3 w-3 sm:h-4 sm:w-4" strokeWidth={1.8} />,
  };

  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 sm:gap-3.5 rounded-xl border border-slate-200/80 bg-white p-2.5 sm:p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
      <div className="flex h-6 w-6 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 border border-slate-200/60">
        {icon === "recon" ? (
          icons[icon]
        ) : (
          <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">{icons[icon]}</svg>
        )}
      </div>
      <div className="min-w-0 w-full">
        <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.05em] sm:tracking-[0.15em] text-slate-400 truncate">{label}</p>
        <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-[13px] font-semibold leading-snug text-slate-800 line-clamp-2">{value}</p>
      </div>
    </div>
  );
}
