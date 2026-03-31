"use client";

import { useState } from "react";
import Link from "next/link";

const SCHEDULER_DEMO_URL = "https://www.youtube.com/embed/Dm9dZS12QDk";

export default function ScheduleBanner() {
  const [showDemo, setShowDemo] = useState(false);

  return (
    <section className="mx-auto max-w-7xl px-0 sm:px-6 w-full">
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl">
        {/* Background texture */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
        <div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-teal-400/8 blur-3xl" />

        <div className="relative grid lg:grid-cols-2 gap-8 lg:gap-0">
          {/* Left — Copy */}
          <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-white/8 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-emerald-300 w-fit mb-6 backdrop-blur-sm border border-white/5">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Schedule Builder
            </div>

            {/* Headline */}
            <h2
              style={{ color: "white" }}
              className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl leading-[1.1]"
            >
              Build Your
              <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-teal-300">
                Perfect Schedule
              </span>
            </h2>

            <p className="mt-5 text-base text-slate-300 leading-relaxed max-w-md">
              Select peptides, configure dosing, and generate a complete injection calendar with escalation
              protocols — all automated and ready to export.
            </p>

            {/* ── Button Group ── */}
            <div className="mt-8 flex flex-row flex-wrap gap-3">
              {/* Primary CTA — always visible */}
              <Link
                href="/schedule"
                className="
                  group relative inline-flex h-11 items-center justify-center gap-2
                  rounded-xl bg-emerald-500 px-6 text-[13px] font-semibold text-white
                  shadow-[0_1px_2px_rgba(0,0,0,0.3),0_4px_16px_rgba(16,185,129,0.25)]
                  ring-1 ring-inset ring-emerald-400/30
                  transition-all duration-150
                  hover:bg-emerald-400
                  hover:shadow-[0_2px_4px_rgba(0,0,0,0.3),0_6px_20px_rgba(16,185,129,0.35)]
                  hover:-translate-y-px
                  active:translate-y-0 active:shadow-none active:bg-emerald-600
                  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400
                  whitespace-nowrap
                "
              >
                Launch Schedule Builder
                <svg
                  className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>

              {/* Browse Protocols — desktop only */}
              <Link
                href="/library"
                className="
                  hidden lg:inline-flex h-11 items-center justify-center gap-2
                  rounded-xl border border-white/12 bg-white/[0.04]
                  px-5 text-[13px] font-semibold text-slate-300
                  shadow-[0_1px_2px_rgba(0,0,0,0.2)]
                  backdrop-blur-sm
                  transition-all duration-150
                  hover:bg-white/[0.08] hover:border-white/20 hover:text-white
                  active:bg-white/[0.03]
                  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40
                  whitespace-nowrap
                "
              >
                Browse Protocols
              </Link>

              {/* Watch demo — mobile only (hidden on lg+, shown in right panel on desktop) */}
              <button
                type="button"
                onClick={() => setShowDemo(true)}
                className="
                  lg:hidden group inline-flex h-11 items-center justify-center gap-2
                  rounded-xl border border-white/10 bg-white/[0.04]
                  px-5 text-[13px] font-semibold text-slate-300
                  transition-all duration-150
                  hover:bg-white/[0.08] hover:border-white/18 hover:text-white
                  active:bg-white/[0.03]
                  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40
                  whitespace-nowrap
                "
              >
                <svg
                  className="h-4 w-4 text-emerald-400/80 group-hover:text-emerald-400 transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-4.197-2.398A1 1 0 009 9.618v4.764a1 1 0 001.555.832l4.197-2.398a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                How to use scheduler
              </button>
            </div>

            {/* Stats */}
            <div className="mt-10 flex gap-8">
              {[
                { value: "103+", label: "Protocols" },
                { value: "52", label: "Week Cycles" },
                { value: "PDF", label: "Export" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-black text-white">{stat.value}</p>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Mock schedule card */}
          <div className="hidden lg:flex flex-col items-center justify-center gap-5 p-8 lg:p-12">
            <div className="w-full max-w-sm">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-10 w-10 rounded-xl bg-linear-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Recovery Protocol</p>
                    <p className="text-xs text-slate-400">8 Week Cycle</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { week: "Week 1-2", dose: "200 mcg", active: true },
                    { week: "Week 3-4", dose: "400 mcg", active: false },
                    { week: "Week 5-8", dose: "600 mcg", active: false },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div
                        className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                          item.active ? "bg-emerald-400 shadow-sm shadow-emerald-400/50" : "bg-slate-600"
                        }`}
                      />
                      <div className="flex flex-1 items-center justify-between rounded-lg bg-white/5 px-3 py-2.5">
                        <span className="text-xs font-medium text-slate-300">{item.week}</span>
                        <span className={`text-xs font-bold ${item.active ? "text-emerald-400" : "text-slate-500"}`}>
                          {item.dose}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex items-center justify-between rounded-lg bg-emerald-500/10 border border-emerald-500/15 px-3 py-2.5">
                  <span className="text-xs font-medium text-emerald-300">Auto-escalation</span>
                  <span className="text-xs font-bold text-emerald-400">Enabled</span>
                </div>
              </div>
            </div>

            {/* Desktop-only demo text link */}
            <button
              type="button"
              onClick={() => setShowDemo(true)}
              className="group flex items-center gap-2.5 text-slate-500 transition-colors duration-150 hover:text-slate-300"
            >
              {/* Mini play circle */}
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-700 bg-white/[0.03] transition-all duration-150 group-hover:border-emerald-500/50 group-hover:bg-emerald-500/10">
                <svg
                  className="h-3 w-3 translate-x-px text-slate-500 transition-colors duration-150 group-hover:text-emerald-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
              <span className="text-[12px] font-black tracking-wide">
                Watch how it works
              </span>
              <svg
                className="h-3 w-3 opacity-0 -translate-x-1 transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Demo modal */}
        {showDemo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setShowDemo(false)}
            />
            <div
              className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10 animate-in zoom-in-95"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between bg-slate-900/90 px-4 py-3 border-b border-slate-800 text-white">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-7 items-center rounded-full bg-emerald-500/20 px-3 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-500/40">
                    Quick demo
                  </span>
                  <h3 className="text-sm font-semibold drop-shadow-sm">How to use the Schedule Builder</h3>
                </div>
                <button
                  onClick={() => setShowDemo(false)}
                  className="rounded-full bg-slate-800/80 p-2 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="aspect-video w-full bg-black">
                <iframe
                  className="h-full w-full border-none"
                  src={`${SCHEDULER_DEMO_URL}?autoplay=1`}
                  title="How to use the Schedule Builder"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}