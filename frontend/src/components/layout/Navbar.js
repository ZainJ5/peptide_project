"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { apiRequest } from "@/lib/api";
import Button from "@/components/ui/Button";
import { ArrowForward } from "@mui/icons-material";

const links = [
  {
    href: "/library", label: "Peptide Library",
    icon: <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>,
  },
  {
    href: "/schedule", label: "Schedule Builder",
    icon: <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>,
  },
  {
    href: "/videos", label: "Videos Library",
    icon: <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" /></svg>,
  },
  {
    href: "/community", label: "Community",
    icon: <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>,
  },
];

export default function Navbar() {
  const pathname   = usePathname();
  const router     = useRouter();
  const user       = useAuthStore((s) => s.user);
  const token      = useAuthStore((s) => s.token);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const setAuth    = useAuthStore((s) => s.setAuth);
  const clearAuth  = useAuthStore((s) => s.clearAuth);

  const [desktopDropdownOpen, setDesktopDropdownOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen]   = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen]           = useState(false);
  const [requestOpen, setRequestOpen]                 = useState(false);
  const [submitting, setSubmitting]                   = useState(false);
  const [requestError, setRequestError]               = useState("");
  const [requestSuccess, setRequestSuccess]           = useState("");
  const [requestForm, setRequestForm]                 = useState({ peptideName: "", goal: "", details: "" });

  const desktopDropdownRef = useRef(null);
  const mobileDropdownRef  = useRef(null);

  /* search (desktop only now) */
  const [searchQuery, setSearchQuery]     = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen]       = useState(false);
  const desktopSearchRef = useRef(null);
  const searchTimerRef   = useRef(null);

  /* lock scroll when menu open */
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  /* outside-click handlers */
  useEffect(() => {
    const handler = (e) => {
      if (desktopDropdownRef.current && !desktopDropdownRef.current.contains(e.target)) setDesktopDropdownOpen(false);
      if (mobileDropdownRef.current && !mobileDropdownRef.current.contains(e.target)) setMobileDropdownOpen(false);
      if (desktopSearchRef.current && !desktopSearchRef.current.contains(e.target)) setSearchOpen(false);
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

  const initials    = user ? (user.firstName ? user.firstName[0] : user.email[0]).toUpperCase() : "";
  const displayName = user
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

  /* ── Reusable Enterprise User Dropdown ── */
  const UserProfileDropdownContent = ({ closeMenu }) => (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-xl shadow-2xl shadow-slate-900/10 ring-1 ring-black/[.02]">
      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/50 px-4 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-800 to-slate-950 text-xs font-bold text-white shadow-sm ring-2 ring-white">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-900">{displayName}</p>
          <p className="truncate text-xs font-medium text-slate-500">{user.email}</p>
        </div>
      </div>
      <div className="p-2">
        <button onClick={() => { clearAuth(); closeMenu(); }}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 active:bg-red-100"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          Sign out
        </button>
      </div>
    </div>
  );

  /* ── Desktop Shared search-results dropdown ── */
  const SearchDropdown = () => (
    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-xl shadow-2xl shadow-slate-900/10 ring-1 ring-black/[.02]">
      {searchLoading ? (
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-slate-800" />
          <span className="text-sm font-medium text-slate-500">Searching global library…</span>
        </div>
      ) : searchResults.length > 0 ? (
        <div className="max-h-[380px] overflow-y-auto overscroll-contain">
          {searchResults.map((p) => (
            <Link key={p.id} href={`/library/${p.id}`}
              onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
              className="flex items-center gap-3.5 border-b border-slate-50 px-4 py-3 last:border-b-0 transition-colors hover:bg-slate-50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 border border-slate-200/50">
                {p.imageUrl
                  ? <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                  : <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                }
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{p.name}</p>
                <p className="truncate text-xs font-medium text-slate-400 mt-0.5">
                  {p.mgAmount || p.type}{p.healthCategories?.[0] ? ` · ${p.healthCategories[0]}` : ""}
                </p>
              </div>
              <svg className="h-4 w-4 shrink-0 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </Link>
          ))}
          <Link href={`/library?search=${encodeURIComponent(searchQuery)}`}
            onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
            className="flex items-center justify-center gap-2 bg-slate-50/80 px-4 py-3.5 text-sm font-semibold text-(--color-primary) transition-colors hover:bg-slate-100"
          >
            View full directory
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </Link>
        </div>
      ) : (
        <div className="px-5 py-8 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
            <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" /></svg>
          </div>
          <p className="text-sm font-medium text-slate-600">No matching protocols for &ldquo;{searchQuery}&rdquo;</p>
        </div>
      )}
    </div>
  );

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6">

          {/* ══════════ DESKTOP HEADER ══════════ */}
          <div className="hidden md:flex items-center gap-5 py-3.5">
            {/* Logo */}
            <Link href="/" className="flex shrink-0 items-center gap-3 transition-opacity hover:opacity-80">
              <Image src="/logo.png" alt="MyPeptideDosage" width={44} height={44}
                className="h-[42px] w-[42px] rounded-xl border border-slate-200 bg-white object-contain p-1 shadow-sm" priority />
              <div className="leading-tight">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Research Portal</p>
                <p className="text-base font-extrabold tracking-tight text-slate-900">MyPeptideDosage</p>
              </div>
            </Link>

            {/* Desktop Search */}
            <div className="relative flex-1 max-w-lg ml-4" ref={desktopSearchRef}>
              <form onSubmit={handleSearchSubmit}>
                <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
                </svg>
                <input type="search" value={searchQuery} onChange={handleSearchChange}
                  onFocus={() => { if (searchResults.length > 0) setSearchOpen(true); }}
                  placeholder="Search peptides, protocols, or health goals..."
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-(--color-primary)/10 focus:shadow-sm"
                />
              </form>
              {searchOpen && <SearchDropdown />}
            </div>

            {/* Actions */}
            <div className="ml-auto flex items-center gap-3">
              <a href="https://example.com/download-app" target="_blank" rel="noopener noreferrer" className="hidden lg:block">
                <Button variant="secondary" className="h-9 rounded-xl border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900">
                  Download App
                </Button>
              </a>

              {user ? (
                <button type="button" onClick={() => { setRequestError(""); setRequestSuccess(""); setRequestOpen(true); }}
                  className="inline-flex h-9 items-center gap-2 rounded-xl bg-(--color-accent) px-4 text-sm font-bold text-white shadow-md shadow-(--color-accent)/20 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-(--color-accent)/30"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                  Request Protocol
                </button>
              ) : (
                <Link href="/login">
                  <Button className="h-9 rounded-xl bg-(--color-accent) px-5 text-sm font-bold text-white shadow-md shadow-(--color-accent)/20 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-(--color-accent)/30">
                    Sign In to request a protocol <ArrowForward className="ml-1 !text-[18px]" />
                  </Button>
                </Link>
              )}

              {user ? (
                <div className="relative ml-1" ref={desktopDropdownRef}>
                  <button onClick={() => setDesktopDropdownOpen(!desktopDropdownOpen)}
                    className="flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-slate-800 to-slate-950 text-xs font-bold text-white ring-2 ring-transparent transition-all hover:ring-slate-200 hover:shadow-md active:scale-95"
                  >{initials}</button>
                  {desktopDropdownOpen && (
                    <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 origin-top-right">
                      <UserProfileDropdownContent closeMenu={() => setDesktopDropdownOpen(false)} />
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/signup">
                  <Button className="h-9 cursor-pointer rounded-xl bg-slate-900 px-5 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-slate-800">
                    Get Started
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Desktop Nav Strip */}
          <nav className="hidden items-center justify-center gap-1 border-t border-slate-100 py-2 md:flex">
            {links.map(({ href, label }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link key={href} href={href}
                  className={`rounded-lg px-4 py-2 text-sm font-bold transition-all duration-200 ${
                    active ? "bg-(--color-primary)/10 text-(--color-primary)" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >{label}</Link>
              );
            })}
          </nav>

          {/* ══════════ MOBILE HEADER ══════════ */}
          <div className="flex md:hidden items-center justify-between py-2.5">
            <Link href="/" className="flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-80">
              <Image src="/logo.png" alt="MyPeptideDosage" width={38} height={38}
                className="h-[38px] w-[38px] rounded-xl border border-slate-200 bg-white object-contain p-1 shadow-sm" priority />
              <span className="text-[17px] font-extrabold tracking-tight text-slate-900">MyPeptideDosage</span>
            </Link>

            <div className="flex items-center gap-3">
              {/* Mobile User Avatar Dropdown */}
              {user && (
                <div className="relative" ref={mobileDropdownRef}>
                  <button onClick={() => setMobileDropdownOpen(!mobileDropdownOpen)}
                    className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-gradient-to-br from-slate-800 to-slate-950 text-[11px] font-bold text-white ring-2 ring-transparent transition-all active:scale-95 hover:ring-slate-200"
                  >
                    {initials}
                  </button>
                  {mobileDropdownOpen && (
                    <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-64 origin-top-right">
                      <UserProfileDropdownContent closeMenu={() => setMobileDropdownOpen(false)} />
                    </div>
                  )}
                </div>
              )}

              {/* Hamburger */}
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu"
                className={`relative flex h-[34px] w-[34px] flex-col items-center justify-center gap-[5px] rounded-xl border transition-all duration-200 ${
                  mobileMenuOpen ? "border-slate-300 bg-slate-100" : "border-slate-200 bg-white active:bg-slate-50"
                }`}
              >
                <span className={`block h-[1.75px] w-[16px] rounded-full bg-slate-800 transition-all duration-200 origin-center ${mobileMenuOpen ? "translate-y-[6.75px] rotate-45" : ""}`} />
                <span className={`block h-[1.75px] w-[12px] rounded-full bg-slate-800 transition-all duration-200 ${mobileMenuOpen ? "opacity-0 scale-x-0" : ""}`} />
                <span className={`block h-[1.75px] w-[16px] rounded-full bg-slate-800 transition-all duration-200 origin-center ${mobileMenuOpen ? "-translate-y-[6.75px] -rotate-45" : ""}`} />
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* ══════════ MOBILE MENU BACKDROP & PANEL ══════════ */}
      <div onClick={() => setMobileMenuOpen(false)} aria-hidden
        className={`fixed inset-0 z-40 md:hidden bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      <div className={`fixed inset-x-0 top-0 z-40 md:hidden flex flex-col bg-white shadow-2xl shadow-slate-900/20 transition-transform duration-[320ms] ease-[cubic-bezier(.32,.72,0,1)] rounded-b-3xl ${
          mobileMenuOpen ? "translate-y-0" : "-translate-y-full"
        }`}
        style={{ maxHeight: "90dvh" }}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100/80 px-5 py-4">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Navigation Menu</span>
          <button onClick={() => setMobileMenuOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition-colors hover:bg-slate-100 active:scale-95"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-6">
          <div className="flex flex-col gap-1.5">
            <Link href="/" onClick={() => setMobileMenuOpen(false)}
              className={`group flex items-center gap-3.5 rounded-2xl px-4 py-4 transition-all duration-200 ${
                pathname === "/" ? "bg-(--color-primary)/10 text-(--color-primary) shadow-sm" : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span className={`shrink-0 transition-colors ${pathname === "/" ? "text-(--color-primary)" : "text-slate-400"}`}>
                <svg className="h-[20px] w-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1v-5m10-10l2 2m-2-2v10a1 1 0 01-1 1v-5m-6 0a1 1 0 001-1v5" /></svg>
              </span>
              <span className="flex-1 text-[16px] font-bold leading-none">Home Platform</span>
            </Link>

            {links.map(({ href, label, icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link key={href} href={href} onClick={() => setMobileMenuOpen(false)}
                  className={`group flex items-center gap-3.5 rounded-2xl px-4 py-4 transition-all duration-200 ${
                    active ? "bg-(--color-primary)/10 text-(--color-primary) shadow-sm" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className={`shrink-0 transition-colors ${active ? "text-(--color-primary)" : "text-slate-400"}`}>{icon}</span>
                  <span className="flex-1 text-[16px] font-bold leading-none">{label}</span>
                </Link>
              );
            })}
          </div>

          <div className="border-t border-slate-100" />

          <div className="flex flex-col gap-3 pb-6">
            {user ? (
              <button type="button" onClick={() => { setRequestError(""); setRequestSuccess(""); setRequestOpen(true); setMobileMenuOpen(false); }}
                className="flex items-center justify-center gap-2.5 rounded-2xl bg-(--color-accent) px-5 py-4 text-[16px] font-bold text-white shadow-lg shadow-(--color-accent)/25 transition-all active:scale-[.98]"
              >
                <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                Request Custom Protocol
              </button>
            ) : (
              <>
                <Link href="/signup" onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-4 text-[16px] font-bold text-white shadow-lg shadow-slate-900/20 transition-all active:scale-[.98]"
                >
                  Create Free Account
                </Link>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-4 text-[16px] font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-[.98]"
                >
                  Sign In
                </Link>
              </>
            )}
            <a href="https://example.com/download-app" target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-[16px] font-bold text-slate-600 transition-all active:scale-[.98]"
            >
              <svg className="h-[18px] w-[18px] text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Download Mobile App
            </a>
          </div>
        </div>
      </div>

      {/* ══════════ REQUEST MODAL ══════════ */}
      {requestOpen && user && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md">
          <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200/50 bg-white shadow-2xl shadow-slate-900/30">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-5">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">Request Data & Protocol</h3>
                <p className="mt-1 text-sm font-medium text-slate-500">Submit a research ticket for admin review.</p>
              </div>
              <button type="button" onClick={() => setRequestOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600 shadow-sm"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleRequestSubmit} className="space-y-5 px-6 py-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Peptide / Compound Name</label>
                <input value={requestForm.peptideName} onChange={(e) => setRequestForm((p) => ({ ...p, peptideName: e.target.value }))}
                  required minLength={2} maxLength={120} placeholder="e.g., BPC-157 or Semaglutide"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Primary Goal</label>
                <input value={requestForm.goal} onChange={(e) => setRequestForm((p) => ({ ...p, goal: e.target.value }))}
                  required minLength={5} maxLength={300} placeholder="What are you trying to research?"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Additional Context</label>
                <textarea value={requestForm.details} onChange={(e) => setRequestForm((p) => ({ ...p, details: e.target.value }))}
                  required minLength={10} maxLength={5000} rows={4}
                  placeholder="Share protocol context, dosage questions, or specifics."
                  className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                />
              </div>
              
              {requestError   && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{requestError}</p>}
              {requestSuccess && <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{requestSuccess}</p>}
              
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setRequestOpen(false)}
                  className="h-11 rounded-xl px-5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="inline-flex h-11 items-center rounded-xl bg-(--color-accent) px-6 text-sm font-bold text-white shadow-md shadow-(--color-accent)/20 transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70">
                  {submitting ? "Submitting Ticket…" : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}