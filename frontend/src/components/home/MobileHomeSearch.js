"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "@/lib/api";

export default function MobileHomeSearch() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  
  const searchRef = useRef(null);
  const searchTimerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, []);

  const handleSearchChange = useCallback((e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!q.trim()) { setSearchResults([]); setSearchOpen(false); return; }
    searchTimerRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await apiRequest(`/peptides?search=${encodeURIComponent(q.trim())}&limit=10`);
        setSearchResults(res?.data || []);
        setSearchOpen(true);
      } catch { setSearchResults([]); }
      finally { setSearchLoading(false); }
    }, 300);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchOpen(false);
    router.push(`/library?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <div className="sm:hidden block px-2 w-full mt-6 relative z-40 max-w-lg mx-auto" ref={searchRef}>
      <form onSubmit={handleSearchSubmit} className="relative group">
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          <svg className="h-5 w-5 text-slate-400 group-focus-within:text-slate-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
        </div>
        <input type="search" value={searchQuery} onChange={handleSearchChange}
          onFocus={() => { if (searchResults.length > 0) setSearchOpen(true); }}
          placeholder="Search peptides, protocols..."  
          className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-10 text-[15px] font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-slate-300 focus:ring-4 focus:ring-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_25px_-4px_rgba(0,0,0,0.08)] appearance-none"
        />
        {searchQuery && (
          <button 
            type="button" 
            onClick={() => { setSearchQuery(""); setSearchOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-full transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </form>
      
      {searchOpen && (
        <div className="absolute left-4 right-4 top-[calc(100%+12px)] overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-xl shadow-2xl shadow-slate-900/10 ring-1 ring-black/[.02]">
          {searchLoading ? (
            <div className="flex items-center gap-3 px-5 py-6">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-slate-800" />
              <span className="text-sm font-medium text-slate-600">Searching global library…</span>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="max-h-[60vh] overflow-y-auto overscroll-contain">
              {searchResults.map((p) => (
                <Link key={p.id} href={`/library/${p.id}`}
                  onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                  className="flex items-center gap-3.5 border-b border-slate-100/60 px-5 py-3.5 last:border-b-0 transition-colors hover:bg-slate-50 active:bg-slate-100"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-bold text-slate-900">{p.name}</p>
                    <p className="truncate text-xs font-semibold text-slate-500 mt-0.5">
                      {p.mgAmount || p.type}{p.healthCategories?.[0] ? ` · ${p.healthCategories[0]}` : ""}
                    </p>
                  </div>
                  <svg className="h-4 w-4 shrink-0 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                </Link>
              ))}
              <Link href={`/library?search=${encodeURIComponent(searchQuery)}`}
                onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                className="flex items-center justify-center gap-2 bg-slate-50 border-t border-slate-100 px-5 py-4 text-sm font-bold text-(--color-primary) transition-colors hover:bg-slate-100 active:bg-slate-200"
              >
                View all results
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
            </div>
          ) : (
            <div className="px-5 py-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" /></svg>
              </div>
              <p className="text-[15px] font-semibold text-slate-800">No matching protocols</p>
              <p className="text-sm font-medium text-slate-500 mt-1">Try another search term</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}