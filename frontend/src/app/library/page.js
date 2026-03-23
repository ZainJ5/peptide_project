"use client";

import { useEffect, useMemo, useState } from "react";
import PageTransition from "@/components/shared/PageTransition";
import Card from "@/components/ui/Card";
import Select from "@/components/ui/Select";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastProvider";
import PeptideCard from "@/components/library/PeptideCard";
import { usePeptides, usePeptideCategories } from "@/lib/hooks";

export default function LibraryPage() {
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [view, setView] = useState("grid");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSearch(params.get("search") || "");
    setCategory(params.get("category") || "");
  }, []);

  const filters = useMemo(
    () => ({ type, limit: 100, offset: 0 }),
    [type]
  );

  const peptidesQuery = usePeptides(filters);
  const categoryQuery = usePeptideCategories();

  const peptides = useMemo(() => {
    const source = peptidesQuery.data?.data || [];
    const normalizedSearch = search.trim().toLowerCase();

    return source.filter((item) => {
      const concernPool = [
        ...(item.healthCategories || []),
        ...(item.benefits || []),
        ...(item.sideEffects || []),
        item.injectionFrequencyRaw,
        item.cycleDurationRaw,
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());

      const categoryMatch = !category || concernPool.some((value) => value.includes(category.toLowerCase()));
      if (!categoryMatch) return false;
      if (!normalizedSearch) return true;

      return [
        item.name,
        item.mgAmount,
        item.protocolTitle,
        ...(item.healthCategories || []),
        ...(item.benefits || []),
        ...(item.sideEffects || []),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch));
    });
  }, [peptidesQuery.data, search, category]);

  const concernOptions = useMemo(() => {
    const backendCategories = categoryQuery.data?.categories || [];
    if (backendCategories.length > 0) return backendCategories;

    return [
      "weight",
      "recovery",
      "sleep",
      "focus",
      "inflammation",
      "energy",
      "joint",
      "gut",
    ];
  }, [categoryQuery.data]);

  useEffect(() => {
    if (peptidesQuery.error) {
      showToast(peptidesQuery.error.message || "Failed to load peptide data.", "error");
    }
  }, [peptidesQuery.error, showToast]);

  return (
    <PageTransition>
      <div className="flex flex-col lg:flex-row">
        {/* Left Sidebar (Sticky over md screens, full height flush) */}
        <aside className="w-full lg:w-[300px] shrink-0 lg:border-r lg:border-slate-200 lg:pr-8 lg:mr-8 mb-8 lg:mb-0">
          <div className="sticky top-28">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Peptide Library</h1>
              <p className="mt-2 text-base text-slate-500 leading-relaxed">
                Search and filter our clinical-grade peptides by protocol or target health outcome.
              </p>
            </div>

            <div className="space-y-8">
              <div>
                <label className="mb-2.5 block text-base font-semibold text-slate-800">Search Protocol</label>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="e.g. BPC-157, 10MG"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base transition-colors focus:border-(--color-primary) focus:outline-none focus:ring-1 focus:ring-(--color-primary)"
                />
              </div>

              <div>
                <label className="mb-2.5 block text-base font-semibold text-slate-800">Protocol Type</label>
                <Select value={type} onChange={(event) => setType(event.target.value)} className="w-full rounded-xl bg-white border-slate-200 py-3 text-base">
                  <option value="">All Types</option>
                  <option value="single">Single Peptide</option>
                  <option value="blend">Peptide Blend</option>
                </Select>
              </div>

              <div>
                <label className="mb-2.5 block text-base font-semibold text-slate-800">Clinical Focus</label>
                <Select value={category} onChange={(event) => setCategory(event.target.value)} className="w-full rounded-xl bg-white border-slate-200 py-3 text-base">
                  <option value="">All Targets</option>
                  {concernOptions.map((item) => (
                    <option key={item} value={item} className="capitalize">{item}</option>
                  ))}
                </Select>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Content Panel */}
        <section className="flex-1 min-w-0">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-sm font-medium text-slate-500">
              Showing <span className="font-bold text-slate-900">{peptidesQuery.data?.total || 0}</span> advanced protocols
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setView("grid")} 
                className={`cursor-pointer rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${view === "grid" ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
              >
                Grid
              </button>
              <button 
                onClick={() => setView("list")} 
                className={`cursor-pointer rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${view === "list" ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
              >
                List
              </button>
            </div>
          </div>

          {peptidesQuery.isLoading ? (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-64 rounded-xl" />)}
            </div>
          ) : (
            <div className={view === "grid" ? "grid gap-4 grid-cols-2 lg:grid-cols-2 xl:grid-cols-3" : "space-y-4"}>
              {peptides.map((peptide) => (
                <PeptideCard key={peptide.id} peptide={peptide} view={view} />
              ))}
              {peptides.length === 0 && (
                <div className="col-span-full py-16 text-center text-slate-500">
                  <p className="text-lg">No clinical protocols found.</p>
                  <p className="mt-1 text-sm">Please adjust your current filter criteria.</p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </PageTransition>
  );
}
