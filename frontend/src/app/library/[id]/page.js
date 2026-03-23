"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import PageTransition from "@/components/shared/PageTransition";
import Card from "@/components/ui/Card";
import Accordion from "@/components/ui/Accordion";
import Button from "@/components/ui/Button";
import DataTable from "@/components/ui/DataTable";
import Skeleton from "@/components/ui/Skeleton";
import StickyNav from "@/components/library/StickyNav";
import { usePeptideDetail } from "@/lib/hooks";

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
        <Skeleton className="h-[300px] hidden lg:block rounded-2xl" />
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
    { id: "overview", label: "Overview & Mechanism" },
    { id: "benefits", label: "Benefits & Side Effects" },
    { id: "dosage", label: "Dosage & Escalation" },
    { id: "reconstitution", label: "Reconstitution & Prep" },
  ];

  const imageSrc = peptide.imageUrl || "/fallback-peptide.png";

  return (
    <PageTransition>
      {/* Sticky Floating Back Button (Mobile & Tablet only) */}
      <div className="sticky top-20 z-40 mb-6 flex justify-start sm:top-24 lg:hidden">
        <Link href="/library" className="inline-flex items-center rounded-full bg-white/90 px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-300 drop-shadow-sm backdrop-blur-md transition-all hover:bg-slate-50 hover:text-(--color-primary) active:scale-95 cursor-pointer">
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Peptide Library
        </Link>
      </div>

      {/* Hero Section */}
      <Card className="mb-8 overflow-hidden rounded-[24px] border border-slate-200/60 p-0 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_400px]">
          <div className="order-2 md:order-1 flex flex-col justify-center p-6 sm:p-8 md:p-12">
            <div className="mb-6 flex flex-wrap gap-2">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                {peptide.healthCategories?.[0] || "General"}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-slate-700">
                {peptide.type}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-(--color-primary) sm:text-4xl md:text-5xl">
              {peptide.name}
            </h1>
            <p className="mt-3 text-lg sm:text-xl font-medium text-slate-600">
              {peptide.mgAmount || "Standard Dosage"} Protocol
            </p>
            <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-500">
              {peptide.protocolTitle}
            </p>
            <div className="mt-8">
              <Button size="lg" className="w-full sm:w-auto shadow-lg shadow-blue-900/20" onClick={() => router.push(`/schedule?add=${peptide.id}`)}>
                Add to Schedule
              </Button>
            </div>
          </div>
          
          <div className="order-1 md:order-2 relative h-64 w-full bg-slate-100 sm:h-80 md:h-full md:min-h-[400px]">
            {peptide.imageUrl ? (
              <img src={imageSrc} alt={peptide.name} className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-slate-100">
                <span className="text-slate-400">Image unavilable</span>
              </div>
            )}
            <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent w-24"></div>
            <div className="block md:hidden absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent h-24 mt-auto"></div>
          </div>
        </div>
      </Card>

      <div className="flex flex-col lg:flex-row">
        {/* Left Sticky Navigation (Flush full height) */}
        <aside className="hidden lg:block w-[240px] shrink-0 lg:border-r lg:border-slate-200 lg:pr-8 lg:mr-8 mb-8 lg:mb-0">
          <div className="sticky top-28 space-y-10">
            <div>
              <Link href="/library" className="group inline-flex items-center text-sm font-semibold text-slate-500 hover:text-(--color-primary) transition-all">
                <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 group-hover:bg-(--color-primary)/10 group-hover:text-(--color-primary) transition-colors shadow-sm ring-1 ring-slate-200/60">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </div>
                Back to Library
              </Link>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-500">On this page</h3>
              <StickyNav sections={sections} />
            </div>
          </div>
        </aside>

        {/* Right Content Panels */}
        <section className="flex-1 min-w-0 space-y-8">
          
          {/* Overview & Mechanism */}
          <div id="overview" className="scroll-mt-6">
            <Card className="p-8 shadow-sm rounded-xl">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Overview & Mechanism</h2>
              <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed">
                <p>{peptide.howItWorks || "Detailed mechanism of action data is currently unavailable for this protocol."}</p>
              </div>
            </Card>
          </div>

          {/* Benefits & Side Effects */}
          <div id="benefits" className="scroll-mt-6 space-y-6">
            <Card className="p-6 sm:p-8 shadow-sm rounded-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Clinical Benefits</h2>
              </div>
              <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
                {(peptide.benefits || []).map((item, idx) => (
                  <li key={idx} className="flex items-start text-slate-600">
                    <span className="mr-3 mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                    <span className="leading-relaxed text-sm sm:text-base">{item}</span>
                  </li>
                ))}
                {(!peptide.benefits || peptide.benefits.length === 0) && (
                  <p className="text-sm text-slate-400 italic">No specific benefits listed.</p>
                )}
              </ul>
            </Card>

            <div className="rounded-xl border border-red-200 bg-red-50 p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h2 className="text-xl font-bold text-red-900">Potential Side Effects & Risks</h2>
              </div>
              <ul className="space-y-3">
                {(peptide.sideEffects || []).map((item, idx) => (
                  <li key={idx} className="flex items-start text-red-800 font-medium">
                    <span className="mr-3 mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                    <span className="leading-relaxed text-sm sm:text-base">{item}</span>
                  </li>
                ))}
                {(!peptide.sideEffects || peptide.sideEffects.length === 0) && (
                  <p className="text-sm text-red-600/80 italic">No specific side effects listed.</p>
                )}
              </ul>
            </div>
          </div>

          {/* Dosage & Escalation */}
          <div id="dosage" className="scroll-mt-6">
            <Card className="p-8 shadow-sm rounded-2xl">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Dosage & Escalation</h2>
              {tableData.length > 0 ? (
                <div className="space-y-8">
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <DataTable data={tableData} columns={columns} />
                  </div>
                  
                  <div className="h-72 rounded-xl border border-slate-200 bg-slate-50/50 p-6">
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500">Dose Escalation Curve</h3>
                    <ResponsiveContainer width="100%" height="85%">
                      <LineChart data={chartData}>
                        <XAxis dataKey="week" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }} />
                        <Line type="monotone" dataKey="units" stroke="#1E3A8A" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 italic">No structured dosing tables available for this protocol.</p>
              )}
            </Card>
          </div>

          {/* Reconstitution & Prep Notes */}
          <div id="reconstitution" className="scroll-mt-6">
            <Card className="p-6 sm:p-8 shadow-sm rounded-2xl bg-white border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Reconstitution & Preparation</h2>
              
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">Reconstitution Requirements</h3>
                  <div className="prose prose-sm sm:prose-base prose-slate max-w-none text-slate-600">
                    <p>{peptide.reconstitutionRaw || "No specific reconstitution instructions provided."}</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">Clinical Preparation Notes</h3>
                  <div className="prose prose-sm sm:prose-base prose-slate max-w-none text-slate-600">
                    <p>{peptide.preparationNotes || "Standard clinical preparation protocols apply."}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

        </section>
      </div>
    </PageTransition>
  );
}
