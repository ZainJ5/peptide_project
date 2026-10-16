"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Lock, ShieldCheck, User } from "lucide-react";
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

  const inputCls =
    "h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition-colors hover:border-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-12">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-120 w-180 -translate-x-1/2 rounded-full bg-emerald-200/40 blur-3xl" />

      <div className="relative w-full max-w-100">
        <div className="mb-7 flex flex-col items-center text-center">
          <Image
            src="/logo.png"
            alt="My Peptide Dosages"
            width={56}
            height={56}
            priority
            className="h-14 w-14 rounded-2xl border border-slate-200 bg-white object-contain p-1.5 shadow-sm"
          />
          <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Admin Console</p>
          <p className="text-lg font-extrabold tracking-tight text-slate-900">My Peptide Dosages</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-900/5 sm:p-8">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Sign in</h1>
          <p className="mt-1 text-sm text-slate-500">Enter your admin credentials to continue.</p>

          <form onSubmit={submit} noValidate className="mt-6 space-y-4">
            <div>
              <label htmlFor="admin-username" className="mb-1.5 block text-[13px] font-semibold text-slate-700">Username</label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cx(inputCls, "pr-11")}
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <AdminButton type="submit" variant="primary" size="lg" loading={loading} className="w-full">
              {loading ? "Signing in…" : "Sign in"}
            </AdminButton>
          </form>
        </div>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          Authorized personnel only
        </p>
      </div>
    </div>
  );
}
