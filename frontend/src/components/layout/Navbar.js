"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { apiRequest } from "@/lib/api";
import Button from "@/components/ui/Button";
import { toDisplayImageUrl } from "@/lib/imageUrl";

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

  /* close drawer on Escape */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && mobileMenuOpen) setMobileMenuOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
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
            <Link key={p.id} href={`/library/${p.slug || p.id}`}
              onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
              className="flex items-center gap-3.5 border-b border-slate-50 px-4 py-3 last:border-b-0 transition-colors hover:bg-slate-50"
            >
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
              <Image src="/logo.png" alt="My Peptide Dosages" width={44} height={44}
                className="h-[42px] w-[42px] rounded-xl border border-slate-200 bg-white object-contain p-1 shadow-sm" priority />
              <div className="leading-tight">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Research Portal</p>
                <p className="text-base font-extrabold tracking-tight text-slate-900">My Peptide Dosages</p>
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
                  aria-label="Search peptides"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-(--color-primary)/10 focus:shadow-sm"
                />
              </form>
              {searchOpen && <SearchDropdown />}
            </div>

            {/* Actions */}
            <div className="ml-auto flex items-center gap-3">
              <a href="https://appdistribution.firebase.dev/i/937a9972dbfb3a2e" target="_blank" rel="noopener noreferrer" className="hidden lg:block">
                <Button variant="secondary" className="h-9 rounded-xl border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900">
                  Download App
                </Button>
              </a>

              {user ? (
                <div className="relative ml-1" ref={desktopDropdownRef}>
                  <button onClick={() => setDesktopDropdownOpen(!desktopDropdownOpen)}
                    aria-label="Account menu"
                    aria-expanded={desktopDropdownOpen}
                    className="flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-slate-800 to-slate-950 text-xs font-bold text-white ring-2 ring-transparent transition-all hover:ring-slate-200 hover:shadow-md active:scale-95"
                  >{initials}</button>
                  {desktopDropdownOpen && (
                    <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 origin-top-right">
                      <UserProfileDropdownContent closeMenu={() => setDesktopDropdownOpen(false)} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/signup">
                    <Button className="h-9 cursor-pointer rounded-xl bg-emerald-500 px-5 text-sm font-bold text-white shadow-md shadow-emerald-500/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-600">
                      Get Started
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button className="h-9 cursor-pointer rounded-xl bg-slate-900 px-5 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-slate-800">
                      Login
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Nav Strip */}
          <nav aria-label="Main navigation" className="hidden items-center justify-center gap-1 border-t border-slate-100 py-2 md:flex">
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
          <div className="flex md:hidden items-center gap-3 py-2.5">
            {/* Left — Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Open navigation"
              className="flex h-11 w-11 shrink-0 flex-col items-center justify-center gap-[5px] rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 active:scale-95 active:bg-slate-50"
            >
              <span className="block h-[1.75px] w-[14px] rounded-full bg-slate-700" />
              <span className="block h-[1.75px] w-[10px] self-start ml-[9px] rounded-full bg-slate-400" />
              <span className="block h-[1.75px] w-[14px] rounded-full bg-slate-700" />
            </button>

            {/* Center — Logo (flex-1, centered) */}
            <Link href="/" className="flex flex-1 items-center justify-center gap-2 transition-opacity hover:opacity-80">
              <Image src="/logo.png" alt="MyPeptideDosages" width={32} height={32}
                className="h-8 w-8 shrink-0 rounded-xl border border-slate-200 bg-white object-contain p-[3px] shadow-sm" priority />
              <span className="text-[15px] font-extrabold tracking-tight text-slate-900 whitespace-nowrap">MyPeptideDosages</span>
            </Link>

            {/* Right — avatar or sign-in, fixed width to balance layout */}
            <div className="shrink-0 w-11 flex justify-end">
              {user ? (
                <div className="relative" ref={mobileDropdownRef}>
                  <button
                    onClick={() => setMobileDropdownOpen(!mobileDropdownOpen)}
                    aria-label="Account menu"
                    aria-expanded={mobileDropdownOpen}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-950 text-[11px] font-bold text-white ring-2 ring-transparent transition-all active:scale-95 hover:ring-slate-200 shadow-sm"
                  >
                    {initials}
                  </button>
                  {mobileDropdownOpen && (
                    <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-64 origin-top-right">
                      <UserProfileDropdownContent closeMenu={() => setMobileDropdownOpen(false)} />
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/login"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-(--color-accent) text-white shadow-md shadow-(--color-accent)/25 transition-all active:scale-95"
                  aria-label="Sign In"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                </Link>
              )}
            </div>
          </div>

        </div>
      </header>

      {/* ══════════ MOBILE LEFT DRAWER — BACKDROP ══════════ */}
      <div
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden
        className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${
          mobileMenuOpen
            ? "bg-slate-900/50 backdrop-blur-[2px] pointer-events-auto"
            : "bg-transparent backdrop-blur-none pointer-events-none"
        }`}
      />

      {/* ══════════ MOBILE LEFT DRAWER — PANEL ══════════ */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`fixed inset-y-0 left-0 z-50 md:hidden flex flex-col bg-white transition-transform duration-[350ms] ease-[cubic-bezier(.32,.72,0,1)] ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ width: "min(82vw, 320px)" }}
      >
        {/* ── Drawer Header ── */}
        <div className="relative shrink-0 border-b border-slate-100 bg-white px-4 pb-4 pt-5">
          {/* Brand row */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="MyPeptideDosages" width={28} height={28}
                className="h-7 w-7 rounded-lg border border-slate-200 bg-white object-contain p-[2px] shadow-sm" />
              <div className="leading-none">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Research Portal</p>
                <p className="text-[13px] font-extrabold tracking-tight text-slate-900">MyPeptideDosages</p>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close navigation menu"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 active:scale-95"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {user ? (
            /* ── Authenticated: compact profile card ── */
            <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3">
              <div className="relative shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-[13px] font-extrabold text-white shadow-sm">
                  {initials}
                </div>
                {/* Green online dot */}
                <span className="absolute -bottom-px -right-px h-3 w-3 rounded-full bg-emerald-400 ring-[2px] ring-slate-50" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold text-slate-900 leading-tight">{displayName}</p>
                <p className="truncate text-[11px] text-slate-500 mt-0.5 leading-tight">{user.email}</p>
              </div>
              {/* Active badge */}
              <span className="shrink-0 flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            </div>
          ) : (
            /* ── Guest: minimal prompt ── */
            <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-500">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-slate-800 leading-tight">Guest User</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">Sign in to unlock all features</p>
              </div>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}
                className="shrink-0 rounded-xl bg-(--color-accent) px-3 py-1.5 text-[11px] font-bold text-white shadow-sm shadow-(--color-accent)/20 transition-all active:scale-95"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>

        {/* ── Navigation Section ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-4">

          {/* Section label */}
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Navigation</p>

          {/* Home */}
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`group mb-0.5 flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-150 ${
              pathname === "/"
                ? "bg-(--color-primary)/10 text-(--color-primary)"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100"
            }`}
          >
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
              pathname === "/" ? "bg-(--color-primary)/15 text-(--color-primary)" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
            }`}>
              <svg className="h-[17px] w-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            </span>
            <span className="flex-1 text-[14px] font-semibold leading-none">Home</span>
            {pathname === "/" && (
              <span className="h-1.5 w-1.5 rounded-full bg-(--color-primary)" />
            )}
          </Link>

          {links.map(({ href, label, icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className={`group mb-0.5 flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-150 ${
                  active
                    ? "bg-(--color-primary)/10 text-(--color-primary)"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100"
                }`}
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                  active ? "bg-(--color-primary)/15 text-(--color-primary)" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                }`}>
                  {icon}
                </span>
                <span className="flex-1 text-[14px] font-semibold leading-none">{label}</span>
                {active && (
                  <span className="h-1.5 w-1.5 rounded-full bg-(--color-primary)" />
                )}
              </Link>
            );
          })}

          {/* Divider */}
          <div className="my-4 border-t border-slate-100" />

          {/* Actions section */}
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Actions</p>

          {!user && (
            <>
              <Link href="/signup" onClick={() => setMobileMenuOpen(false)}
                className="group mb-0.5 flex items-center gap-3 rounded-xl px-3 py-3 text-slate-600 transition-all duration-150 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                  <svg className="h-[17px] w-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </span>
                <span className="flex-1 text-[14px] font-semibold leading-none">Create Free Account</span>
                <svg className="h-3.5 w-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
              </Link>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}
                className="group mb-0.5 flex items-center gap-3 rounded-xl px-3 py-3 text-slate-600 transition-all duration-150 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <svg className="h-[17px] w-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                </span>
                <span className="flex-1 text-[14px] font-semibold leading-none">Sign In</span>
                <svg className="h-3.5 w-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
              </Link>
            </>
          )}

          <a href="https://appdistribution.firebase.dev/i/937a9972dbfb3a2e" target="_blank" rel="noopener noreferrer"
            className="group mb-0.5 flex items-center gap-3 rounded-xl px-3 py-3 text-slate-600 transition-all duration-150 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 group-hover:bg-violet-50 group-hover:text-violet-600 transition-colors">
              <svg className="h-[17px] w-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            </span>
            <span className="flex-1 text-[14px] font-semibold leading-none">Download App</span>
            <svg className="h-3 w-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </a>
        </div>

        {/* ── Drawer Footer ── */}
        {user && (
          <div className="shrink-0 border-t border-slate-100 px-4 py-4">
            <button
              onClick={() => { clearAuth(); setMobileMenuOpen(false); }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 active:bg-red-100"
            >
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Sign out of account
            </button>
          </div>
        )}

        {/* Thin accent bar on right edge of drawer */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-slate-200 to-transparent" />
      </aside>
    </>
  );
}