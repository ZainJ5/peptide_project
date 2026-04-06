"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Syringe } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import PageTransition from "@/components/shared/PageTransition";
import ScheduleWizard from "@/components/schedule/ScheduleWizard";
import CalendarView from "@/components/schedule/CalendarView";
import { useSchedules, useScheduleCalendar, useCompleteEvent, usePrefetchScheduleCalendars } from "@/lib/hooks";
import { useAuthStore } from "@/lib/auth-store";
import { downloadSchedulePdf } from "@/lib/api";
import { useToast } from "@/components/ui/ToastProvider";

export default function SchedulePage() {
  const token = useAuthStore((s) => s.token);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const setAuth = useAuthStore((s) => s.setAuth);
  const schedulesQuery = useSchedules();
  const schedules = schedulesQuery.data?.data || [];
  const activeSchedules = useMemo(() => schedules.filter((s) => s.isGenerated), [schedules]);
  const [view, setView] = useState("builder");

  // Prefetch today's calendar data in background so "Today" tab loads instantly
  usePrefetchScheduleCalendars(activeSchedules);

  return (
    <PageTransition>
      <div className="flex flex-col gap-8">

        {/* ÔöÇÔöÇ Page Header ÔöÇÔöÇ */}
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
                onClick={() => setView("today")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  view === "today"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
                Today
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
            </div>
          )}
        </div>

        {/* ÔöÇÔöÇ Content Area ÔöÇÔöÇ */}
        {view === "today" && token ? (
          <TodayDashboard
            schedules={activeSchedules}
            loading={schedulesQuery.isLoading}
            token={token}
            refreshToken={refreshToken}
            setAuth={setAuth}
            onNewSchedule={() => setView("builder")}
          />
        ) : view === "schedules" && token ? (
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


/* ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
   TODAY'S SCHEDULE DASHBOARD
   ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ */
function TodayDashboard({ schedules, loading, token, refreshToken, setAuth, onNewSchedule }) {
  const { showToast } = useToast();
  const completeEventMutation = useCompleteEvent();

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const todayLabel = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });

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
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
          </svg>
        </div>
        <p className="text-lg font-bold text-slate-900">No active schedules</p>
        <p className="mt-1 text-sm text-slate-500">Create and generate a schedule to see your daily injections here</p>
        <button onClick={onNewSchedule} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600 hover:-translate-y-0.5">
          Create Schedule
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Today Header Card */}
      <div className="rounded-2xl border border-slate-200 bg-linear-to-br from-white to-emerald-50/30 p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Today&apos;s Schedule</h2>
            <p className="text-sm text-slate-500 font-medium">{todayLabel}</p>
          </div>
        </div>
      </div>

      {/* Per-schedule injection cards */}
      {schedules.map((schedule) => (
        <TodayScheduleCard
          key={schedule.id}
          schedule={schedule}
          todayStr={todayStr}
          token={token}
          refreshToken={refreshToken}
          setAuth={setAuth}
          completeEventMutation={completeEventMutation}
          showToast={showToast}
        />
      ))}
    </div>
  );
}

function TodayScheduleCard({ schedule, todayStr, token, refreshToken, setAuth, completeEventMutation, showToast }) {
  const currentMonth = todayStr.slice(0, 7);
  const calendarQuery = useScheduleCalendar(schedule.id, currentMonth);
  const calendarData = calendarQuery.data?.data;

  const todayEvents = useMemo(() => {
    if (!calendarData) return [];
    for (const dates of Object.values(calendarData)) {
      if (dates[todayStr]) return dates[todayStr];
    }
    return [];
  }, [calendarData, todayStr]);

  const stats = useMemo(() => {
    const total = todayEvents.length;
    const completed = todayEvents.filter((e) => e.isCompleted).length;
    const rest = todayEvents.filter((e) => e.isRestDay).length;
    return { total, completed, rest, pending: total - completed - rest };
  }, [todayEvents]);

  const handleToggleComplete = useCallback(async (eventId, currentlyCompleted) => {
    try {
      await completeEventMutation.mutateAsync({
        scheduleId: schedule.id,
        eventId,
        completed: !currentlyCompleted,
      });
      showToast(!currentlyCompleted ? "Injection marked as completed." : "Injection marked as incomplete.", "success");
    } catch {
      showToast("Failed to update injection status.", "error");
    }
  }, [schedule.id, completeEventMutation, showToast]);

  if (calendarQuery.isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500" />
          <span className="text-sm text-slate-500">Loading {schedule.name}...</span>
        </div>
      </div>
    );
  }

  if (todayEvents.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{schedule.name}</p>
            <p className="text-xs text-slate-500">No injections scheduled for today</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Schedule header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Syringe className="h-4.5 w-4.5" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{schedule.name}</p>
            <p className="text-[11px] text-slate-500 font-medium">
              {stats.completed}/{stats.total - stats.rest} completed today
            </p>
          </div>
        </div>
        {/* Progress ring */}
        <div className="flex items-center gap-2">
          {stats.total - stats.rest > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-20 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${Math.round((stats.completed / (stats.total - stats.rest)) * 100)}%` }}
                />
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                {Math.round((stats.completed / (stats.total - stats.rest)) * 100)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Injection rows */}
      <div className="divide-y divide-slate-50">
        {todayEvents.map((ev, idx) => {
          const completed = ev.isCompleted;
          return (
            <div key={ev.id || `today-${idx}`} className={`flex items-center gap-3 px-5 py-3.5 transition-colors ${completed ? "bg-emerald-50/20" : "hover:bg-slate-50/50"}`}>
              {/* Checkbox */}
              <button onClick={() => handleToggleComplete(ev.id, completed)}
                className={`group flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-all ${
                  completed ? "border-emerald-500 bg-emerald-500 scale-100" : "border-slate-300 bg-white hover:border-emerald-400 hover:scale-105"
                }`}>
                {completed && (
                  <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                )}
              </button>

              {/* Time pill */}
              <span className={`inline-flex items-center justify-center rounded-lg px-2 py-1 text-[10px] font-bold tracking-wider uppercase min-w-9 ${
                ev.isRestDay ? "bg-slate-100 text-slate-400" :
                ev.timeOfDay === "PM" ? "bg-indigo-100/80 text-indigo-600" :
                ev.timeOfDay === "BOTH" ? "bg-amber-100/80 text-amber-600" :
                "bg-teal-100/80 text-teal-600"
              }`}>
                {ev.isRestDay ? "Rest" : ev.timeOfDay || "AM"}
              </span>

              {/* Name */}
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold truncate ${completed ? "text-slate-400 line-through decoration-slate-300" : "text-slate-800"}`}>
                  {ev.peptideDisplayName || ev.peptideName || ev.peptideProtocolTitle || "Peptide"}
                </p>
              </div>

              {/* Dose */}
              <span className={`text-xs font-semibold shrink-0 ${completed ? "text-slate-300" : "text-slate-500"}`}>
                {ev.doseLabel || `${ev.doseUnits}u`}
              </span>

              {/* Status */}
              {completed && !ev.isRestDay && (
                <span className="rounded-lg bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 shrink-0">Done</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


/* ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
   SAVED SCHEDULES LIST
   ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ */
function SavedSchedules({ schedules, loading, token, refreshToken, setAuth, onNewSchedule }) {
  const [viewingScheduleId, setViewingScheduleId] = useState(null);

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
        const isViewing = viewingScheduleId === schedule.id;
        const startDateLabel = new Date(schedule.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
        return (
          <div key={schedule.id} className="rounded-2xl border border-slate-200 bg-white transition-all hover:border-slate-300 hover:shadow-md overflow-hidden">
            {/* Schedule card header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5">
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
                  <>
                    <button
                      onClick={() => setViewingScheduleId(isViewing ? null : schedule.id)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                        isViewing
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                      </svg>
                      {isViewing ? "Hide Calendar" : "View Calendar"}
                    </button>
                    <button
                      onClick={() => downloadSchedulePdf(schedule.id, { token, refreshToken, onRefresh: setAuth })}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                      PDF
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Expanded Calendar View */}
            <AnimatePresence>
              {isViewing && isActive && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                  <div className="border-t border-slate-100 p-5 bg-slate-50/30">
                    <ScheduleCalendarViewer
                      scheduleId={schedule.id}
                      token={token}
                      refreshToken={refreshToken}
                      setAuth={setAuth}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}


/* ÔöÇÔöÇ Inline calendar viewer for a saved schedule ÔöÇÔöÇ */
function ScheduleCalendarViewer({ scheduleId, token, refreshToken, setAuth }) {
  const { showToast } = useToast();
  const calendarQuery = useScheduleCalendar(scheduleId);
  const completeEventMutation = useCompleteEvent();
  const authState = { token, refreshToken, setAuth };

  const handleToggleComplete = useCallback(async (eventId, currentlyCompleted) => {
    try {
      await completeEventMutation.mutateAsync({
        scheduleId,
        eventId,
        completed: !currentlyCompleted,
      });
      showToast(!currentlyCompleted ? "Injection marked as completed." : "Injection marked as incomplete.", "success");
    } catch {
      showToast("Failed to update injection status.", "error");
    }
  }, [scheduleId, completeEventMutation, showToast]);

  if (calendarQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500" />
          <span className="text-sm text-slate-500">Loading calendar...</span>
        </div>
      </div>
    );
  }

  if (!calendarQuery.data?.data) {
    return <p className="text-sm text-slate-500 text-center py-8">Unable to load calendar data.</p>;
  }

  return (
    <CalendarView
      calendar={calendarQuery.data.data}
      scheduleId={scheduleId}
      message=""
      authState={authState}
      onToggleComplete={handleToggleComplete}
    />
  );
}
