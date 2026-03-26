"use client";

import { useState } from "react";
import { Syringe } from "lucide-react";
import PageTransition from "@/components/shared/PageTransition";
import ScheduleWizard from "@/components/schedule/ScheduleWizard";
import { useSchedules } from "@/lib/hooks";
import { useAuthStore } from "@/lib/auth-store";
import { downloadSchedulePdf } from "@/lib/api";

export default function SchedulePage() {
  const token = useAuthStore((s) => s.token);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const setAuth = useAuthStore((s) => s.setAuth);
  const schedulesQuery = useSchedules();
  const schedules = schedulesQuery.data?.data || [];
  const [view, setView] = useState("builder");

  return (
    <PageTransition>
      <div className="flex flex-col gap-8">

        {/* ── Page Header — matches Library / Community style ── */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pt-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Schedule Builder</h1>
            <p className="mt-2 text-base text-slate-500 leading-relaxed max-w-xl">
              Plan up to 10 peptides with dosing protocols, escalation variants, rest periods, and PDF calendars.
            </p>
          </div>

          {/* View Toggle */}
          {token && (
            <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 p-1">
              <button
                onClick={() => setView("builder")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  view === "builder"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                New
              </button>
              <button
                onClick={() => setView("schedules")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  view === "schedules"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                My Schedules
                {schedules.length > 0 && (
                  <span className="rounded-full bg-emerald-100 text-emerald-700 px-1.5 py-0.5 text-[10px] font-bold">{schedules.length}</span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* ── Content Area ── */}
        {view === "schedules" && token ? (
          <SavedSchedules
            schedules={schedules}
            loading={schedulesQuery.isLoading}
            token={token}
            refreshToken={refreshToken}
            setAuth={setAuth}
            onNewSchedule={() => setView("builder")}
          />
        ) : (
          <ScheduleWizard />
        )}
      </div>
    </PageTransition>
  );
}

/* ── Saved Schedules List ── */
function SavedSchedules({ schedules, loading, token, refreshToken, setAuth, onNewSchedule }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-slate-200 border-t-emerald-500" />
      </div>
    );
  }

  if (schedules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-16 px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 mb-5">
          <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
        </div>
        <p className="text-lg font-bold text-slate-900">No schedules yet</p>
        <p className="mt-1 text-sm text-slate-500">Create your first peptide schedule to get started</p>
        <button onClick={onNewSchedule} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600 hover:-translate-y-0.5">
          Create Schedule
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {schedules.map((schedule) => {
        const isActive = schedule.isGenerated;
        const startDateLabel = new Date(schedule.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
        return (
          <div key={schedule.id} className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-slate-300 hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${isActive ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
              <div>
                <p className="text-[15px] font-bold text-slate-900">{schedule.name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    {startDateLabel}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {schedule.durationWeeks} weeks
                  </span>
                  <span className="flex items-center gap-1">
                    <Syringe className="h-3.5 w-3.5" strokeWidth={2} />
                    {schedule.items?.length || 0} peptides
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                {isActive ? "Active" : "Draft"}
              </span>
              {isActive && (
                <button
                  onClick={() => downloadSchedulePdf(schedule.id, { token, refreshToken, onRefresh: setAuth })}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                  PDF
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
