"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const STORAGE_KEY = "mpd_app_popup_dismissed";
const APK_URL = "/app/app.apk";

/**
 * Elegant, one-time app-download promo.
 *
 * Auto-appears a few seconds after the first visit, is fully dismissible, and
 * won't reappear once dismissed or after the user grabs the APK (persisted in
 * localStorage). Links to the same Android APK as the navbar "Download App" button.
 */
export default function AppDownloadPopup() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      dismissed = false;
    }
    if (dismissed) return;

    const timer = setTimeout(() => {
      setMounted(true);
      // next frame → trigger enter transition
      requestAnimationFrame(() => setOpen(true));
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // Escape to close
  useEffect(() => {
    if (!mounted) return;
    const onKey = (e) => e.key === "Escape" && dismiss();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  const dismiss = () => {
    setOpen(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setTimeout(() => setMounted(false), 250);
  };

  const handleDownload = () => {
    // Mark as done so it never nags again once they've grabbed the app
    dismiss();
  };

  if (!mounted) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Download the MyPeptideDosages app"
      className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center"
    >
      {/* Backdrop */}
      <div
        onClick={dismiss}
        className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
      />

      {/* Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20 transition-all duration-300 ease-out ${
          open ? "translate-y-0 scale-100 opacity-100" : "translate-y-6 scale-[0.98] opacity-0"
        }`}
      >
        {/* Close */}
        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-3.5 top-3.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-slate-400 backdrop-blur transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {/* Accent header */}
        <div className="relative bg-gradient-to-br from-emerald-500 to-emerald-600 px-6 pb-8 pt-7 text-center">
          <div className="pointer-events-none absolute inset-0 opacity-[0.15]" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, white 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
          <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg ring-4 ring-white/30">
            <Image src="/logo.png" alt="MyPeptideDosages" width={44} height={44} className="h-11 w-11 rounded-xl object-contain" />
          </div>
          <p className="relative mt-3 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-50/90">Take it anywhere</p>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 pt-5 text-center">
          <h3 className="text-xl font-extrabold tracking-tight text-slate-900">Get the MyPeptideDosages App</h3>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-slate-500">
            Track your dosing schedule, get injection reminders, and access every peptide protocol — right from your phone.
          </p>

          {/* Feature bullets */}
          <div className="mt-4 flex flex-col gap-2 text-left">
            {[
              "Daily injection checklist & reminders",
              "Your saved schedules, always in sync",
              "100+ peptide protocols offline",
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </span>
                <span className="text-sm font-medium text-slate-600">{feat}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <a
            href={APK_URL}
            download="app.apk"
            onClick={handleDownload}
            className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5 hover:bg-slate-800 active:scale-[0.98]"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.523 15.341a.998.998 0 01-.996-.996c0-.55.446-.996.996-.996s.996.446.996.996-.446.996-.996.996m-11.046 0a.998.998 0 01-.996-.996c0-.55.446-.996.996-.996s.996.446.996.996-.446.996-.996.996m11.405-6.02l1.997-3.46a.416.416 0 00-.152-.567.416.416 0 00-.568.152l-2.022 3.503A12.06 12.06 0 0012 6.878c-1.83 0-3.56.42-5.117 1.144L4.86 4.52a.416.416 0 00-.568-.152.416.416 0 00-.152.567l1.997 3.46C2.706 10.29.5 13.617.5 17.5h23c0-3.883-2.206-7.21-5.618-8.179" /></svg>
            Download for Android
          </a>

          <button onClick={dismiss} className="mt-2.5 text-xs font-semibold text-slate-400 transition-colors hover:text-slate-600">
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
