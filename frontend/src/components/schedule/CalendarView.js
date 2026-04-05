"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { downloadSchedulePdf } from "@/lib/api";

const WEEKDAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarView({ calendar, scheduleId, message, authState, onToggleComplete }) {
  const months = useMemo(() =>
    Object.entries(calendar || {})
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthKey, dates]) => ({ monthKey, dates })),
    [calendar]
  );

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(months[0]?.monthKey || "");

  const selectedEvents = useMemo(() => {
    if (!selectedDate || !calendar) return [];
    for (const dates of Object.values(calendar)) {
      if (dates[selectedDate]) return dates[selectedDate];
    }
    return [];
  }, [calendar, selectedDate]);

  const monthIdx = months.findIndex((m) => m.monthKey === selectedMonth);
  const canPrev = monthIdx > 0;
  const canNext = monthIdx < months.length - 1;

  if (months.length === 0) {
    return <p className="text-sm text-slate-500 text-center py-8">No calendar entries found.</p>;
  }

  const currentMonthData = months[monthIdx] || months[0];
  const [year, monthNum] = (currentMonthData?.monthKey || "2024-01").split("-").map(Number);
  const monthLabel = new Date(year, monthNum - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const firstDay = new Date(year, monthNum - 1, 1).getDay();
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const dayEventsMap = useMemo(() => {
    const map = {};
    if (!currentMonthData?.dates) return map;
    for (const [dateStr, events] of Object.entries(currentMonthData.dates)) {
      const day = parseInt(dateStr.split("-")[2], 10);
      map[day] = events;
    }
    return map;
  }, [currentMonthData]);

  const monthStats = useMemo(() => {
    let total = 0, completed = 0, rest = 0;
    if (currentMonthData?.dates) {
      for (const events of Object.values(currentMonthData.dates)) {
        for (const ev of events) {
          total++;
          if (ev.isCompleted) completed++;
          if (ev.isRestDay) rest++;
        }
      }
    }
    return { total, completed, rest, pending: total - completed - rest };
  }, [currentMonthData]);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Injection Calendar</h2>
          {message && <p className="text-sm text-emerald-600 font-medium">{message}</p>}
        </div>
        <button onClick={() => downloadSchedulePdf(scheduleId, { token: authState.token, refreshToken: authState.refreshToken, onRefresh: authState.setAuth })}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-lg transition-all hover:bg-slate-800 hover:-translate-y-0.5">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
          PDF
        </button>
      </div>

      {/* Calendar Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Month Nav */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <button onClick={() => { canPrev && setSelectedMonth(months[monthIdx - 1].monthKey); setSelectedDate(null); }} disabled={!canPrev}
            className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-slate-100 disabled:opacity-20 disabled:cursor-not-allowed">
            <svg className="h-3.5 w-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          </button>
          <h3 className="text-[13px] font-bold text-slate-900 tracking-tight">{monthLabel}</h3>
          <button onClick={() => { canNext && setSelectedMonth(months[monthIdx + 1].monthKey); setSelectedDate(null); }} disabled={!canNext}
            className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-slate-100 disabled:opacity-20 disabled:cursor-not-allowed">
            <svg className="h-3.5 w-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 bg-slate-50/70 border-b border-slate-100">
          {WEEKDAY_HEADERS.map((d) => (
            <div key={d} className="py-1.5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">{d}</div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (day === null) return <div key={`e-${idx}`} className="h-11 border-b border-r border-slate-50/80" />;

            const dateStr = `${year}-${String(monthNum).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const events = dayEventsMap[day] || [];
            const hasEvents = events.length > 0;
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const allCompleted = hasEvents && events.every((e) => e.isCompleted);
            const hasRest = hasEvents && events.some((e) => e.isRestDay);
            const hasAM = events.some((e) => (e.timeOfDay === "AM" || e.timeOfDay === "BOTH") && !e.isRestDay);
            const hasPM = events.some((e) => (e.timeOfDay === "PM" || e.timeOfDay === "BOTH") && !e.isRestDay);

            return (
              <button key={day} onClick={() => hasEvents && setSelectedDate(isSelected ? null : dateStr)}
                className={`relative flex flex-col items-center justify-center h-11 border-b border-r border-slate-50/80 transition-all ${
                  isSelected ? "bg-emerald-50 z-10 shadow-[inset_0_0_0_1.5px_theme(colors.emerald.400)]" :
                  hasEvents ? "hover:bg-slate-50/80 cursor-pointer" : "cursor-default"
                }`}>
                <span className={`text-[12px] leading-none ${
                  isToday ? "flex h-5.5 w-5.5 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-[11px]" :
                  isSelected ? "text-emerald-700 font-bold" :
                  hasEvents ? "text-slate-800 font-medium" : "text-slate-300"
                }`}>{day}</span>
                {hasEvents && (
                  <div className="flex items-center gap-px mt-0.5">
                    {allCompleted ? (
                      <div className="h-[5px] w-[5px] rounded-full bg-emerald-500" />
                    ) : hasRest && !hasAM && !hasPM ? (
                      <div className="h-[5px] w-[5px] rounded-full bg-slate-300" />
                    ) : (
                      <>
                        {hasAM && <div className="h-[5px] w-[5px] rounded-full bg-teal-500" />}
                        {hasPM && <div className="h-[5px] w-[5px] rounded-full bg-indigo-500" />}
                        {hasRest && <div className="h-[5px] w-[5px] rounded-full bg-slate-300" />}
                      </>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Mini legend + stats bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/50 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-teal-500" /><span className="text-[10px] text-slate-400 font-medium">AM</span></div>
            <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-indigo-500" /><span className="text-[10px] text-slate-400 font-medium">PM</span></div>
            <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-slate-300" /><span className="text-[10px] text-slate-400 font-medium">Rest</span></div>
            <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-emerald-500" /><span className="text-[10px] text-slate-400 font-medium">Done</span></div>
          </div>
          <div className="text-[10px] font-semibold text-slate-400">
            {monthStats.completed}/{monthStats.total} completed
          </div>
        </div>
      </div>

      {/* Selected Date Detail Panel */}
      <AnimatePresence>
        {selectedDate && selectedEvents.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15, ease: "easeOut" }}>
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <p className="text-[13px] font-bold text-slate-900">
                  {new Date(selectedDate + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
                </p>
                <button onClick={() => setSelectedDate(null)} className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="divide-y divide-slate-50">
                {selectedEvents.map((ev, idx) => {
                  const completed = ev.isCompleted;
                  return (
                    <div key={ev.id || `${selectedDate}-${idx}`} className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${completed ? "bg-emerald-50/20" : "hover:bg-slate-50/50"}`}>
                      <button onClick={() => onToggleComplete(ev.id, completed)}
                        className={`group flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-[1.5px] transition-all ${
                          completed ? "border-emerald-500 bg-emerald-500 scale-100" : "border-slate-300 bg-white hover:border-emerald-400 hover:scale-105"
                        }`}>
                        {completed && (
                          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        )}
                      </button>
                      <span className={`inline-flex items-center justify-center rounded-md px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase min-w-[32px] ${
                        ev.isRestDay ? "bg-slate-100 text-slate-400" :
                        ev.timeOfDay === "PM" ? "bg-indigo-100/80 text-indigo-600" :
                        ev.timeOfDay === "BOTH" ? "bg-amber-100/80 text-amber-600" :
                        "bg-teal-100/80 text-teal-600"
                      }`}>
                        {ev.isRestDay ? "Rest" : ev.timeOfDay || "AM"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-[13px] font-semibold truncate leading-tight ${completed ? "text-slate-400 line-through decoration-slate-300" : "text-slate-800"}`}>
                          {ev.peptideDisplayName || ev.peptideName || ev.peptideProtocolTitle || "Peptide"}
                        </p>
                      </div>
                      <span className={`text-[11px] font-medium shrink-0 ${completed ? "text-slate-300" : "text-slate-500"}`}>
                        {ev.doseLabel || `${ev.doseUnits}u`}
                      </span>
                      {completed && !ev.isRestDay && (
                        <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 shrink-0">Done</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Month pills */}
      {months.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {months.map(({ monthKey }) => {
            const [y, m] = monthKey.split("-").map(Number);
            const label = new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: "short" });
            const isCurrent = monthKey === selectedMonth;
            return (
              <button key={monthKey} onClick={() => { setSelectedMonth(monthKey); setSelectedDate(null); }}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all ${
                  isCurrent ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20" : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                }`}>
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
