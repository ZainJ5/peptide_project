"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { apiRequest } from "@/lib/api";
import Button from "@/components/ui/Button";

const links = [
  {
    href: "/library", label: "Peptide Library",
    icon: <svg className="h-[17px] w-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>,
  },
  {
    href: "/schedule", label: "Schedule Builder",
    icon: <svg className="h-[17px] w-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>,
  },
  {
    href: "/videos", label: "Videos Library",
    icon: <svg className="h-[17px] w-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" /></svg>,
  },
  {
    href: "/community", label: "Community",
    icon: <svg className="h-[17px] w-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>,
  },
];

export default function Navbar() {
  const pathname  = usePathname();
  const router    = useRouter();
  const user         = useAuthStore((s) => s.user);
  const token        = useAuthStore((s) => s.token);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const setAuth      = useAuthStore((s) => s.setAuth);
  const clearAuth    = useAuthStore((s) => s.clearAuth);

  const [dropdownOpen,   setDropdownOpen]   = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [requestOpen,    setRequestOpen]    = useState(false);
  const [submitting,     setSubmitting]     = useState(false);
  const [requestError,   setRequestError]   = useState("");
  const [requestSuccess, setRequestSuccess] = useState("");
  const [requestForm,    setRequestForm]    = useState({ peptideName: "", goal: "", details: "" });

  const dropdownRef = useRef(null);

  /* search */
  const [searchQuery,   setSearchQuery]   = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen,    setSearchOpen]    = useState(false);
  const desktopSearchRef = useRef(null);
  const mobileSearchRef  = useRef(null);
  const searchTimerRef   = useRef(null);

  /* lock scroll when menu open */
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  /* outside-click handlers */
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
      if (desktopSearchRef.current && !desktopSearchRef.current.contains(e.target)) setSearchOpen(false);
      if (mobileSearchRef.current  && !mobileSearchRef.current.contains(e.target))  setSearchOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* debounced search */
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
    setMobileMenuOpen(false);
    router.push(`/library?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const initials     = user ? (user.firstName ? user.firstName[0] : user.email[0]).toUpperCase() : "";
  const displayName  = user
    ? (user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user.email.split("@")[0])
    : "";

  const handleRequestSubmit = async (event) => {
    event.preventDefault();
    setRequestError(""); setRequestSuccess(""); setSubmitting(true);
    try {
      const response = await apiRequest("/community/request-peptide", {
        method: "POST", body: requestForm, token, refreshToken,
        onRefresh: (p) => setAuth({ token: p.token, refreshToken: p.refreshToken, user: p.user }),
      });
      setRequestSuccess(response?.message || "Request submitted successfully.");
      setRequestForm({ peptideName: "", goal: "", details: "" });
      setTimeout(() => { setRequestOpen(false); setRequestSuccess(""); }, 1200);
    } catch (err) {
      if (err?.status === 401) clearAuth();
      setRequestError(err?.message || "Unable to submit request right now.");
    } finally { setSubmitting(false); }
  };

  /* ── shared search-results dropdown ── */
  const SearchDropdown = () => (
    <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-2xl shadow-slate-900/10 ring-1 ring-black/[.03]">
      {searchLoading ? (
        <div className="flex items-center gap-3 px-5 py-4">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700" />
          <span className="text-sm text-slate-500">Searching protocols…</span>
        </div>
      ) : searchResults.length > 0 ? (
        <div className="max-h-[340px] overflow-y-auto overscroll-contain">
          {searchResults.map((p) => (
            <Link
              key={p.id} href={`/library/${p.id}`}
              onClick={() => { setSearchOpen(false); setSearchQuery(""); setMobileMenuOpen(false); }}
              className="flex items-center gap-3.5 border-b border-slate-50 px-4 py-3 last:border-b-0 transition-colors hover:bg-slate-50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                {p.imageUrl
                  ? <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                  : <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                }
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{p.name}</p>
                <p className="truncate text-xs text-slate-400 mt-0.5">
                  {p.mgAmount || p.type}{p.healthCategories?.[0] ? ` · ${p.healthCategories[0]}` : ""}
                </p>
              </div>
              <svg className="h-4 w-4 shrink-0 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </Link>
          ))}
          <Link
            href={`/library?search=${encodeURIComponent(searchQuery)}`}
            onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
            className="flex items-center justify-center gap-2 bg-slate-50/80 px-4 py-3.5 text-sm font-semibold text-(--color-primary) transition-colors hover:bg-slate-100"
          >
            View all results
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </Link>
        </div>
      ) : (
        <div className="px-5 py-8 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
            <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" /></svg>
          </div>
          <p className="text-sm font-medium text-slate-600">No results for &ldquo;{searchQuery}&rdquo;</p>
          <Link
            href={`/library?search=${encodeURIComponent(searchQuery)}`}
            onClick={() => setSearchOpen(false)}
            className="mt-2 inline-block text-xs font-semibold text-(--color-primary)"
          >Browse all protocols →</Link>
        </div>
      )}
    </div>
  );

  /* ════════════════════════════════════════════════
      RENDER
  ════════════════════════════════════════════════ */
  return (
    <>
      {/* ══════════ HEADER ══════════ */}
      <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/95 backdrop-blur-2xl">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6">

          {/* ── DESKTOP ── */}
          <div className="hidden md:flex items-center gap-4 py-3">
            {/* Logo */}
            <Link href="/" className="flex shrink-0 items-center gap-2.5 opacity-100 transition-opacity hover:opacity-80">
              <Image src="/logo.png" alt="MyPeptideDosage" width={44} height={44}
                className="h-10 w-10 rounded-xl border border-slate-200 bg-white object-contain p-1" priority />
              <div className="leading-[1.2]">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Research &amp; Protocol</p>
                <p className="text-[15px] font-extrabold tracking-tight text-slate-900">MyPeptideDosage</p>
              </div>
            </Link>

            {/* Search */}
            <div className="relative flex-1 max-w-lg" ref={desktopSearchRef}>
              <form onSubmit={handleSearchSubmit}>
                <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
                </svg>
                <input type="search" value={searchQuery} onChange={handleSearchChange}
                  onFocus={() => { if (searchResults.length > 0) setSearchOpen(true); }}
                  placeholder="Search peptides, protocols, schedules…"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-(--color-primary)/10"
                />
              </form>
              {searchOpen && <SearchDropdown />}
            </div>

            {/* Actions */}
            <div className="ml-auto flex items-center gap-2">
              <a href="https://example.com/download-app" target="_blank" rel="noopener noreferrer" className="hidden lg:block">
                <Button variant="secondary" className="h-9 rounded-xl border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                  Download App
                </Button>
              </a>

              {user ? (
                <button type="button"
                  onClick={() => { setRequestError(""); setRequestSuccess(""); setRequestOpen(true); }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-(--color-accent) px-4 text-sm font-semibold text-white shadow-sm shadow-(--color-accent)/25 transition-all hover:-translate-y-px"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                  Request a Peptide
                </button>
              ) : (
                <Link href="/login">
                  <Button className="h-9 rounded-xl bg-(--color-accent) px-4 text-sm font-semibold text-white shadow-sm shadow-(--color-accent)/25 hover:-translate-y-px">
                    Sign in to Request
                  </Button>
                </Link>
              )}

              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-950 text-[11px] font-bold text-white ring-2 ring-slate-100 transition-all hover:ring-slate-200 hover:shadow-md"
                  >{initials}</button>
                  {dropdownOpen && (
                    <div className="absolute right-0 top-full z-50 mt-2 w-56">
                      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-2xl shadow-slate-900/10">
                        <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-950 text-[11px] font-bold text-white">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
                            <p className="truncate text-xs text-slate-400">{user.email}</p>
                          </div>
                        </div>
                        <div className="p-1.5">
                          <button onClick={() => { clearAuth(); setDropdownOpen(false); }}
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            Sign out
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/signup">
                  <Button className="h-9 cursor-pointer rounded-full px-5 text-sm font-semibold shadow-md shadow-(--color-primary)/15 transition-all hover:-translate-y-0.5">
                    Get Started
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Desktop nav strip */}
          <nav className="hidden items-center justify-center gap-0.5 border-t border-slate-100 py-1.5 md:flex">
            {links.map(({ href, label }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link key={href} href={href}
                  className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition-all duration-150 ${
                    active ? "bg-(--color-primary)/8 text-(--color-primary)" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >{label}</Link>
              );
            })}
          </nav>

          {/* ── MOBILE top bar ── */}
          <div className="flex md:hidden items-center gap-3 py-2.5">
            <Link href="/" className="flex shrink-0 items-center gap-2 transition-opacity hover:opacity-80">
              <Image src="/logo.png" alt="MyPeptideDosage" width={36} height={36}
                className="h-9 w-9 rounded-xl border border-slate-200 bg-white object-contain p-1" priority />
              <span className="text-[15px] font-extrabold tracking-tight text-slate-900">MyPeptideDosage</span>
            </Link>

            <div className="flex-1" />

            {/* Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              className={`relative flex h-9 w-9 flex-col items-center justify-center gap-[5px] rounded-xl border transition-all duration-200 ${
                mobileMenuOpen ? "border-slate-300 bg-slate-100" : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <span className={`block h-[1.75px] w-[18px] rounded-full bg-slate-700 transition-all duration-200 origin-center ${mobileMenuOpen ? "translate-y-[6.75px] rotate-45" : ""}`} />
              <span className={`block h-[1.75px] w-[14px] rounded-full bg-slate-700 transition-all duration-200 ${mobileMenuOpen ? "opacity-0 scale-x-0" : ""}`} />
              <span className={`block h-[1.75px] w-[18px] rounded-full bg-slate-700 transition-all duration-200 origin-center ${mobileMenuOpen ? "-translate-y-[6.75px] -rotate-45" : ""}`} />
              {/* avatar indicator dot */}
              {user && !mobileMenuOpen && (
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-(--color-primary) ring-1 ring-white" />
              )}
            </button>
          </div>

        </div>
      </header>

      {/* ══════════ MOBILE MENU ══════════ */}
      {/* Backdrop */}
      <div
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden
        className={`fixed inset-0 z-40 md:hidden bg-slate-950/40 backdrop-blur-[3px] transition-opacity duration-300 ${
          mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Slide-down panel – premium enterprise styling */}
      <div
        className={`fixed inset-x-0 top-0 z-40 md:hidden flex flex-col bg-white shadow-2xl shadow-slate-900/20 transition-transform duration-[320ms] ease-[cubic-bezier(.32,.72,0,1)] ${
          mobileMenuOpen ? "translate-y-0" : "-translate-y-full"
        }`}
        style={{ maxHeight: "93dvh" }}
      >
        {/* ── Panel header ── */}
        <div className="flex shrink-0 items-center gap-3 border-b border-slate-100 px-4 py-2.5">
          <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2">
            <Image src="/logo.png" alt="MyPeptideDosage" width={36} height={36}
              className="h-9 w-9 rounded-xl border border-slate-200 bg-white object-contain p-1" />
            <span className="text-[15px] font-extrabold tracking-tight text-slate-900">MyPeptideDosage</span>
          </Link>
          <div className="flex-1" />
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto overscroll-contain">

          {/* Search – premium input */}
          <div className="px-4 pt-4 pb-2" ref={mobileSearchRef}>
            <div className="relative">
              <form onSubmit={handleSearchSubmit}>
                <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
                </svg>
                <input type="search" value={searchQuery} onChange={handleSearchChange}
                  onFocus={() => { if (searchResults.length > 0) setSearchOpen(true); }}
                  placeholder="Search peptides, protocols…"
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-(--color-primary)/10"
                />
              </form>
              {searchOpen && <SearchDropdown />}
            </div>
          </div>

          {/* Nav links – premium enterprise layout with Home button */}
          <div className="px-4 pt-3">
            <p className="mb-1 px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Navigation</p>
            <div className="flex flex-col gap-1">
              {/* Home button – added for small devices */}
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`group flex items-center gap-3 rounded-2xl px-4 py-4 transition-all duration-200 ${
                  pathname === "/"
                    ? "bg-(--color-primary)/10 text-(--color-primary) shadow-sm"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span
                  className={`shrink-0 transition-colors ${
                    pathname === "/" ? "text-(--color-primary)" : "text-slate-400 group-hover:text-slate-500"
                  }`}
                >
                  <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1v-5m10-10l2 2m-2-2v10a1 1 0 01-1 1v-5m-6 0a1 1 0 001-1v5" />
                  </svg>
                </span>
                <span className="flex-1 text-[15px] font-semibold leading-none">Home</span>
                {pathname === "/" ? (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-(--color-primary)" />
                ) : (
                  <svg className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-slate-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </Link>

              {/* Original nav links – refined spacing and styling for premium feel */}
              {links.map(({ href, label, icon }) => {
                const active = pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`group flex items-center gap-3 rounded-2xl px-4 py-4 transition-all duration-200 ${
                      active
                        ? "bg-(--color-primary)/10 text-(--color-primary) shadow-sm"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <span className={`shrink-0 transition-colors ${active ? "text-(--color-primary)" : "text-slate-400 group-hover:text-slate-500"}`}>
                      {icon}
                    </span>
                    <span className="flex-1 text-[15px] font-semibold leading-none">{label}</span>
                    {active ? (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-(--color-primary)" />
                    ) : (
                      <svg className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-slate-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="mx-4 mt-6 border-t border-slate-100" />

          {/* CTA buttons – premium elevated cards */}
          <div className="px-4 pt-4 pb-1 flex flex-col gap-3">
            {user ? (
              <button
                type="button"
                onClick={() => { setRequestError(""); setRequestSuccess(""); setRequestOpen(true); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 rounded-2xl bg-(--color-accent) px-5 py-4 text-[15px] font-semibold text-white shadow-lg shadow-(--color-accent)/25 transition-all active:scale-[.97]"
              >
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                Request a Peptide
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-2xl bg-(--color-accent) px-5 py-4 text-[15px] font-semibold text-white shadow-lg shadow-(--color-accent)/25 transition-all active:scale-[.97]"
              >
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                Sign in to Request a Peptide
              </Link>
            )}
            <a
              href="https://example.com/download-app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-[15px] font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-[.97]"
            >
              <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Download App
            </a>
          </div>

          {/* Profile / Auth – premium enterprise user card */}
          <div className="px-4 pt-4 pb-8">
            {user ? (
              <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-inner">
                <div className="flex items-center gap-4 border-b border-slate-100 px-5 py-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-950 text-base font-bold text-white ring-2 ring-white shadow-sm">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold text-slate-900">{displayName}</p>
                    <p className="truncate text-sm text-slate-400 mt-px">{user.email}</p>
                  </div>
                  <span className="shrink-0 rounded-3xl border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 tracking-wider">
                    ACTIVE
                  </span>
                </div>
                <button
                  onClick={() => { clearAuth(); setMobileMenuOpen(false); }}
                  className="flex w-full items-center gap-3 px-5 py-4 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50/70 active:bg-red-50"
                >
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-3xl bg-(--color-primary) py-4 text-[15px] font-semibold text-white shadow-xl shadow-(--color-primary)/20 transition-all active:scale-[.97]"
                >
                  Get Started — It&apos;s Free
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white py-4 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50 active:scale-[.97]"
                >
                  Already have an account? Sign in
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════ REQUEST MODAL ══════════ */}
      {requestOpen && user && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200/70 bg-white shadow-2xl shadow-slate-900/20">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Request a Peptide</h3>
                <p className="mt-0.5 text-xs text-slate-400">Submit a research request for admin review.</p>
              </div>
              <button type="button" onClick={() => setRequestOpen(false)}
                className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleRequestSubmit} className="space-y-4 px-5 py-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Peptide Name</label>
                <input value={requestForm.peptideName}
                  onChange={(e) => setRequestForm((p) => ({ ...p, peptideName: e.target.value }))}
                  required minLength={2} maxLength={120} placeholder="Example: BPC-157"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-(--color-primary)/10"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Goal</label>
                <input value={requestForm.goal}
                  onChange={(e) => setRequestForm((p) => ({ ...p, goal: e.target.value }))}
                  required minLength={5} maxLength={300} placeholder="What are you trying to research or achieve?"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-(--color-primary)/10"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Details</label>
                <textarea value={requestForm.details}
                  onChange={(e) => setRequestForm((p) => ({ ...p, details: e.target.value }))}
                  required minLength={10} maxLength={5000} rows={5}
                  placeholder="Share protocol context, dosage questions, or required data points."
                  className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-3 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-(--color-primary)/10"
                />
              </div>
              {requestError   && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">{requestError}</p>}
              {requestSuccess && <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">{requestSuccess}</p>}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button type="button" onClick={() => setRequestOpen(false)}
                  className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="inline-flex h-10 items-center rounded-xl bg-(--color-accent) px-5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60">
                  {submitting ? "Sending…" : "Send Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}