"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const STORAGE_KEY = "mpd_app_popup_dismissed_v2";
const APP_URL = "https://apps.apple.com/us/app/my-peptide-dosages/id6798623177";

/**
 * Minimal one-time app-download prompt.
 *
 * Appears once, a few seconds after the first visit (bottom sheet on mobile,
 * centered card on desktop), is fully dismissible, and won't reappear once
 * dismissed or after the user grabs the APK (persisted in localStorage).
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
      requestAnimationFrame(() => setOpen(true));
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

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

  if (!mounted) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Get the MyPeptideDosages app"
      className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center"
    >
      {/* Backdrop */}
      <div
        onClick={dismiss}
        className={`absolute inset-0 bg-slate-900/25 backdrop-blur-[2px] transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
      />

      {/* Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-950/[0.06] transition-all duration-300 ease-out ${
          open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}
      >
        {/* Close */}
        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-3.5 top-3.5 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {/* Header: icon + name */}
        <div className="flex items-center gap-3.5">
          <Image
            src="/logo.png"
            alt="MyPeptideDosages"
            width={48}
            height={48}
            className="h-12 w-12 shrink-0 rounded-xl bg-white object-contain p-1 ring-1 ring-slate-200"
          />
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold tracking-tight text-slate-900">Get the app</h3>
            <p className="text-[13px] text-slate-500">Free · on the App Store</p>
          </div>
        </div>

        {/* One line of copy */}
        <p className="mt-4 text-[13.5px] leading-relaxed text-slate-600">
          Your schedules, dosing calendar, and every peptide protocol — right on your phone.
        </p>

        {/* CTA */}
        <a
          href={APP_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={dismiss}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
        >
          <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 12.04c-.03-2.8 2.29-4.14 2.39-4.21-1.3-1.9-3.33-2.16-4.05-2.19-1.72-.17-3.36 1.01-4.23 1.01-.87 0-2.21-.99-3.64-.96-1.87.03-3.6 1.09-4.56 2.76-1.95 3.38-.5 8.38 1.39 11.12.92 1.34 2.02 2.85 3.46 2.8 1.39-.06 1.91-.9 3.59-.9 1.68 0 2.15.9 3.62.87 1.5-.03 2.45-1.37 3.37-2.72 1.06-1.56 1.5-3.07 1.52-3.15-.03-.01-2.92-1.12-2.95-4.44M14.28 3.87c.77-.93 1.29-2.22 1.15-3.51-1.11.05-2.46.74-3.25 1.67-.71.82-1.33 2.14-1.16 3.4 1.24.1 2.5-.63 3.26-1.56" /></svg>
          Download on the App Store
        </a>

        {/* Dismiss */}
        <button
          onClick={dismiss}
          className="mt-2 w-full py-1 text-center text-xs font-medium text-slate-400 transition-colors hover:text-slate-600"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
