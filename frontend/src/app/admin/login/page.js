"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, KeyRound, Lock, ShieldCheck, User } from "lucide-react";
import { adminRequest } from "@/lib/admin/api";
import { adminNextPath, useAdminStore } from "@/lib/admin/store";
import { AdminButton, cx } from "@/components/admin/ui";

export default function AdminLoginPage() {
  const router = useRouter();
  const setSession = useAdminStore((s) => s.setSession);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Enter your username and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await adminRequest("/auth/login", {
        method: "POST",
        body: { username: username.trim(), password },
        auth: false,
      });
      setSession(res);
      router.replace(adminNextPath());
    } catch (err) {
      setError(err.message);
      setPassword("");
      setLoading(false);
    }
  };

  const inputWrap = "relative";
  const inputCls =
    "h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition-colors hover:border-slate-300 focus:border-(--color-primary) focus:outline-none focus:ring-4 focus:ring-blue-100";

  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#1e3a8a] via-[#142a6b] to-[#0b1636] lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "28px 28px" }}
        />

        <div className="relative flex items-center gap-3">
          <Image src="/logo.png" alt="" width={48} height={48} className="h-12 w-12 rounded-2xl bg-white object-contain p-1.5 shadow-xl shadow-black/20" priority />
          <div className="leading-tight text-white">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-200/80">Research Portal</p>
            <p className="text-lg font-extrabold tracking-tight">My Peptide Dosages</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-white!">
            Manage every protocol from one calm, secure place.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-blue-100/80">
            Edit peptide details, dosing tables, reconstitution guidance and categories — changes go live on the site in seconds.
          </p>
          <div className="mt-8 grid gap-3">
            {["Protocol & dosing editor with unit calculator", "Publish, hide or duplicate peptides instantly", "Locked-down admin access with session revocation"].map((t) => (
              <div key={t} className="flex items-center gap-3 text-sm font-medium text-blue-50/90">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </span>
                {t}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-blue-200/60">© {new Date().getFullYear()} MyPeptideDosages.com · Authorized personnel only</p>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Image src="/logo.png" alt="" width={44} height={44} className="h-11 w-11 rounded-xl border border-slate-200 bg-white object-contain p-1 shadow-sm" priority />
            <div className="leading-tight">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Admin Console</p>
              <p className="text-base font-extrabold tracking-tight text-slate-900">My Peptide Dosages</p>
            </div>
          </div>

          <div className="mb-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-(--color-primary) ring-1 ring-inset ring-blue-600/10">
              <KeyRound className="h-6 w-6" strokeWidth={1.8} />
            </div>
            <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900">Admin sign in</h1>
            <p className="mt-1.5 text-sm text-slate-500">Use your admin credentials to access the control panel.</p>
          </div>

          <form onSubmit={submit} noValidate className="space-y-4">
            <div>
              <label htmlFor="admin-username" className="mb-1.5 block text-[13px] font-semibold text-slate-700">Username</label>
              <div className={inputWrap}>
                <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="admin-username"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={inputCls}
                  placeholder="Enter username"
                />
              </div>
            </div>

            <div>
              <label htmlFor="admin-password" className="mb-1.5 block text-[13px] font-semibold text-slate-700">Password</label>
              <div className={inputWrap}>
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cx(inputCls, "pr-12")}
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <AdminButton type="submit" variant="navy" size="lg" loading={loading} className="w-full">
              {loading ? "Signing in…" : "Sign in to dashboard"}
            </AdminButton>
          </form>

          <p className="mt-8 flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            Repeated failed attempts temporarily lock the account.
          </p>
        </div>
      </div>
    </div>
  );
}
