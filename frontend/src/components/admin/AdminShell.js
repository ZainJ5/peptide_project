"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ExternalLink, FlaskConical, LayoutDashboard, LogOut, Menu, Settings, Tags, Users, X,
} from "lucide-react";
import { adminNextPath, useAdminStore, isSessionValid } from "@/lib/admin/store";
import { adminRequest } from "@/lib/admin/api";
import { cx, Spinner } from "./ui";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/peptides", label: "Peptides", icon: FlaskConical },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function isActive(pathname, item) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function Sidebar({ pathname, admin, onNavigate, onLogout }) {
  const initial = (admin?.displayName || admin?.username || "A").charAt(0).toUpperCase();
  const itemCls = (active) =>
    cx(
      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
      active ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
    );
  const iconCls = (active) =>
    cx("h-[18px] w-[18px] shrink-0", active ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600");

  return (
    <div className="flex h-full flex-col border-r border-slate-200 bg-white">
      <Link href="/admin" onClick={onNavigate} className="flex items-center gap-3 border-b border-slate-100 px-5 py-5">
        <Image src="/logo.png" alt="" width={40} height={40} className="h-10 w-10 rounded-xl border border-slate-200 bg-white object-contain p-1 shadow-sm" />
        <div className="leading-tight">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Admin Console</p>
          <p className="text-[15px] font-extrabold tracking-tight text-slate-900">My Peptide Dosages</p>
        </div>
      </Link>

      <nav aria-label="Admin" className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Manage</p>
        {NAV.map((item) => {
          const active = isActive(pathname, item);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={itemCls(active)}>
              <Icon className={iconCls(active)} strokeWidth={1.9} />
              {item.label}
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500" />}
            </Link>
          );
        })}

        <p className="px-3 pb-2 pt-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">Website</p>
        <a href="/" target="_blank" rel="noopener noreferrer" className={itemCls(false)}>
          <ExternalLink className={iconCls(false)} strokeWidth={1.9} />
          View live site
        </a>
      </nav>

      <div className="border-t border-slate-100 p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-800 to-slate-950 text-sm font-bold text-white ring-2 ring-white shadow-sm">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-900">{admin?.displayName || "Administrator"}</p>
            <p className="truncate text-xs text-slate-500">@{admin?.username}</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            aria-label="Sign out"
            title="Sign out"
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminShell({ children }) {
  const pathname = usePathname() || "/admin";
  const router = useRouter();
  const storeHydrated = useAdminStore((s) => s.hydrated);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // Wait for the client mount too, so server and first client render match.
  const hydrated = mounted && (storeHydrated || useAdminStore.persist.hasHydrated());
  const token = useAdminStore((s) => s.token);
  const expiresAt = useAdminStore((s) => s.expiresAt);
  const admin = useAdminStore((s) => s.admin);
  const clearSession = useAdminStore((s) => s.clearSession);
  const setAdmin = useAdminStore((s) => s.setAdmin);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isLoginPage = pathname === "/admin/login";
  const authed = hydrated && isSessionValid({ token, expiresAt });

  // Route guard: unauthenticated -> login, authenticated on login -> dashboard.
  useEffect(() => {
    if (!hydrated) return;
    if (!authed && !isLoginPage) {
      if (token) clearSession();
      router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
    }
    if (authed && isLoginPage) router.replace(adminNextPath());
  }, [hydrated, authed, isLoginPage, pathname, router, token, clearSession]);

  // Confirm the stored session with the server once per load.
  useEffect(() => {
    if (!authed || isLoginPage) return;
    adminRequest("/auth/me").then((res) => setAdmin(res.admin)).catch(() => {});
  }, [authed, isLoginPage, setAdmin]);

  // End the session automatically when the token expires.
  useEffect(() => {
    if (!authed || !expiresAt) return undefined;
    const ms = expiresAt - Date.now();
    const timer = setTimeout(() => clearSession(), Math.min(Math.max(ms, 0), 2 ** 31 - 1));
    return () => clearTimeout(timer);
  }, [authed, expiresAt, clearSession]);

  useEffect(() => setDrawerOpen(false), [pathname]);

  const logout = async () => {
    try {
      await adminRequest("/auth/logout", { method: "POST" });
    } catch {
      /* session is cleared locally either way */
    }
    clearSession();
    router.replace("/admin/login");
  };

  if (isLoginPage) return children;

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  const current = NAV.find((item) => isActive(pathname, item));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] lg:block">
        <Sidebar pathname={pathname} admin={admin} onLogout={logout} />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin navigation">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] shadow-2xl">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close navigation"
              className="absolute right-3 top-5 z-10 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
            <Sidebar pathname={pathname} admin={admin} onNavigate={() => setDrawerOpen(false)} onLogout={logout} />
          </div>
        </div>
      )}

      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
          <div className="flex h-14 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation"
              className="-ml-1 rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-sm">
              <span className="hidden font-medium text-slate-400 sm:inline">Admin</span>
              <span className="hidden text-slate-300 sm:inline">/</span>
              <span className="truncate font-semibold text-slate-800">{current?.label || "Admin"}</span>
            </nav>
            <div className="ml-auto flex items-center gap-2">
              <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/15 sm:inline-flex">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                Secure session
              </span>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
