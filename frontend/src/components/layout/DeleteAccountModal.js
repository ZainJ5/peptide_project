"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { useToast } from "@/components/ui/ToastProvider";

/**
 * Permanent account deletion — two-step, email-verified.
 *   1. Request a 6-digit confirmation code (emailed to the account).
 *   2. Enter the code to permanently delete the account.
 */
export default function DeleteAccountModal({ onClose }) {
  const router = useRouter();
  const { showToast } = useToast();

  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const [step, setStep] = useState("warn"); // "warn" | "code"
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !loading && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, loading]);

  const authOpts = {
    token,
    refreshToken,
    onRefresh: (p) => setAuth({ token: p.token, refreshToken: p.refreshToken, user: p.user }),
  };

  const requestCode = async () => {
    setError("");
    setLoading(true);
    try {
      await apiRequest("/users/me/deletion/request", { method: "POST", ...authOpts });
      setStep("code");
      showToast("Confirmation code sent to your email.", "success");
    } catch (e) {
      setError(e?.message || "Could not send the code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    setError("");
    if (!/^\d{6}$/.test(code.trim())) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setLoading(true);
    try {
      await apiRequest("/users/me/deletion/confirm", {
        method: "POST",
        body: { code: code.trim() },
        ...authOpts,
      });
      clearAuth();
      onClose();
      showToast("Your account has been permanently deleted.", "success");
      router.push("/");
    } catch (e) {
      setError(e?.message || "Invalid or expired code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Delete account" className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !loading && onClose()} />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete account</h3>
          </div>
          <button onClick={onClose} disabled={loading} aria-label="Close" className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-5 py-5">
          {step === "warn" ? (
            <>
              <p className="text-sm leading-relaxed text-slate-600">
                This <strong className="text-slate-900">permanently deletes</strong> your account and all of your dosing schedules. This <strong>cannot be undone.</strong>
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                To confirm it&apos;s really you, we&apos;ll email a 6-digit code to{" "}
                <span className="font-semibold text-slate-800">{user?.email}</span>.
              </p>
              {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{error}</p>}
              <div className="mt-6 flex items-center justify-end gap-2">
                <button onClick={onClose} disabled={loading} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={requestCode} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
                  Email me a code
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm leading-relaxed text-slate-600">
                We emailed a 6-digit code to <span className="font-semibold text-slate-800">{user?.email}</span>. Enter it below to permanently delete your account.
              </p>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="######"
                aria-label="6-digit confirmation code"
                className="mt-4 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 text-center text-lg font-bold tracking-[0.5em] text-slate-800 outline-none transition-all focus:border-red-300 focus:bg-white focus:ring-2 focus:ring-red-500/10"
              />
              {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{error}</p>}
              <div className="mt-4 flex items-center justify-between">
                <button onClick={requestCode} disabled={loading} className="text-xs font-semibold text-slate-500 transition-colors hover:text-slate-700 disabled:opacity-50">
                  Resend code
                </button>
                <div className="flex items-center gap-2">
                  <button onClick={onClose} disabled={loading} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-50">
                    Cancel
                  </button>
                  <button onClick={confirmDelete} disabled={loading || code.length !== 6} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">
                    {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
                    Delete permanently
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
