"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useToast } from "@/components/ui/ToastProvider";
import { apiRequest, downloadSchedulePdf } from "@/lib/api";
import { usePeptides, useScheduleBuilderMutations } from "@/lib/hooks";
import { useAuthStore } from "@/lib/auth-store";
import { toDisplayImageUrl } from "@/lib/imageUrl";

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function emptySlot(position) {
  return {
    position,
    peptideId: null,
    peptideName: null,
    peptideImage: null,
    peptideMg: null,
    peptideType: null,
    selectedScheduleName: "",
    timeOfDay: "AM",
    daysOfWeek: [],
    isOverridden: false,
    overrideConfirmed: false,
    doseUnits: "",
    restWeeks: "",
  };
}

export default function ScheduleWizard() {
  const authState = useAuthStore();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const peptidesQuery = usePeptides({
    limit: 100,
    offset: 0,
    ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
  });
  const mutations = useScheduleBuilderMutations();
  const isLoggedIn = Boolean(authState.token);

  // Schedule configuration
  const [scheduleName, setScheduleName] = useState("My Peptide Schedule");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [durationWeeks, setDurationWeeks] = useState(12);

  // 10 peptide slots
  const [slots, setSlots] = useState(() => Array.from({ length: 10 }, (_, i) => emptySlot(i + 1)));

  // Editing & picking state
  const [editingSlot, setEditingSlot] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSelections, setPickerSelections] = useState([]);

  // Variant data
  const [variantMap, setVariantMap] = useState({});

  // Result state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateStep, setGenerateStep] = useState("");
  const [result, setResult] = useState({ scheduleId: "", calendar: null, message: "" });

  const peptideOptions = peptidesQuery.data?.data || [];
  const filledSlots = slots.filter((s) => s.peptideId).length;

  // Load variants
  const loadVariants = useCallback(async (peptideId) => {
    if (variantMap[peptideId]) return;
    try {
      const payload = await apiRequest(`/peptides/${peptideId}`, {
        token: authState.token,
        refreshToken: authState.refreshToken,
        onRefresh: authState.setAuth,
      });
      setVariantMap((prev) => ({ ...prev, [peptideId]: payload.data?.scheduleVariants || [] }));
    } catch {
      setVariantMap((prev) => ({ ...prev, [peptideId]: [] }));
    }
  }, [authState, variantMap]);

  const updateSlot = (position, patch) => {
    setSlots((prev) => prev.map((s) => (s.position === position ? { ...s, ...patch } : s)));
  };

  const clearSlot = (position) => {
    setSlots((prev) => prev.map((s) => (s.position === position ? emptySlot(position) : s)));
  };

  const isPeptideUsedInSlots = (peptideId) => slots.some((s) => s.peptideId === peptideId);

  // Open picker
  const openPicker = () => {
    setPickerOpen(true);
    setSearchQuery("");
    setPickerSelections([]);
  };

  // Toggle peptide in picker multi-select
  const togglePickerSelection = (peptide) => {
    setPickerSelections((prev) => {
      const exists = prev.some((p) => p.id === peptide.id);
      if (exists) return prev.filter((p) => p.id !== peptide.id);
      return [...prev, peptide];
    });
  };

  // Confirm picker
  const confirmPicker = () => {
    const toAdd = pickerSelections.filter((p) => !isPeptideUsedInSlots(p.id));
    if (toAdd.length === 0) {
      showToast("All selected peptides are already in your schedule.", "info");
      return;
    }

    setSlots((prev) => {
      const updated = [...prev];
      let added = 0;
      for (const peptide of toAdd) {
        const emptyIdx = updated.findIndex((s) => !s.peptideId);
        if (emptyIdx === -1) break;
        updated[emptyIdx] = {
          ...updated[emptyIdx],
          peptideId: peptide.id,
          peptideName: peptide.name,
          peptideImage: peptide.imageUrl || null,
          peptideMg: peptide.mgAmount || null,
          peptideType: peptide.type || null,
        };
        loadVariants(peptide.id);
        added++;
      }
      if (added < toAdd.length) {
        showToast(`Only ${added} slot${added === 1 ? "" : "s"} available. ${toAdd.length - added} peptide${toAdd.length - added === 1 ? "" : "s"} could not be added.`, "info");
      }
      return updated;
    });

    showToast(`Successfully added ${toAdd.length} peptide${toAdd.length > 1 ? "s" : ""} to your schedule.`, "success");
    setPickerOpen(false);
    setPickerSelections([]);
  };

  // Generate schedule
  const buildSchedule = async () => {
    if (!isLoggedIn) { showToast("Please sign in to generate and save schedules.", "error"); return; }
    if (filledSlots === 0) { showToast("Please add at least one peptide before generating.", "error"); return; }

    setIsGenerating(true);
    setGenerateStep("Creating schedule...");
    try {
      const res = await mutations.createSchedule.mutateAsync({
        name: scheduleName, startDate, durationWeeks: Number(durationWeeks),
      });
      const scheduleId = res.data.id;
      const filledItems = slots.filter((s) => s.peptideId);

      setGenerateStep(`Adding ${filledItems.length} peptide${filledItems.length > 1 ? "s" : ""}...`);
      for (let i = 0; i < filledItems.length; i++) {
        const item = filledItems[i];
        await mutations.addItem.mutateAsync({
          scheduleId,
          body: {
            peptideId: item.peptideId,
            position: i + 1,
            selectedScheduleName: item.selectedScheduleName || undefined,
            isOverridden: item.isOverridden,
            overrideConfirmed: item.isOverridden ? item.overrideConfirmed : false,
            overrideTimeOfDay: item.timeOfDay || undefined,
            overrideDaysOfWeek: item.daysOfWeek.length > 0 ? item.daysOfWeek.map((d) => d.toUpperCase()) : undefined,
            overrideDoseUnits: item.isOverridden && item.doseUnits ? Number(item.doseUnits) : undefined,
            overrideRestWeeks: item.restWeeks ? Number(item.restWeeks) : undefined,
          },
        });
      }

      setGenerateStep("Generating calendar...");
      await mutations.generate.mutateAsync(scheduleId);
      const calendar = await mutations.calendar.mutateAsync(scheduleId);
      setResult({ scheduleId, calendar: calendar.data, message: "Your schedule has been generated successfully!" });
      showToast("Schedule generated successfully! View your injection calendar below.", "success");
    } catch (error) {
      showToast(error?.message || "Something went wrong while generating your schedule. Please try again.", "error");
    } finally {
      setIsGenerating(false);
      setGenerateStep("");
    }
  };

  // Mark event complete/incomplete — optimistic update
  const toggleEventComplete = useCallback(async (eventId, currentlyCompleted) => {
    if (!result.scheduleId) return;
    const newVal = !currentlyCompleted;

    // Optimistic: update UI instantly
    setResult((prev) => {
      const updated = { ...prev, calendar: { ...prev.calendar } };
      for (const month of Object.keys(updated.calendar)) {
        updated.calendar[month] = { ...updated.calendar[month] };
        for (const date of Object.keys(updated.calendar[month])) {
          updated.calendar[month][date] = updated.calendar[month][date].map((ev) =>
            ev.id === eventId ? { ...ev, isCompleted: newVal } : ev
          );
        }
      }
      return updated;
    });

    // Fire API in background
    try {
      await mutations.completeEvent.mutateAsync({
        scheduleId: result.scheduleId,
        eventId,
        completed: newVal,
      });
      showToast(newVal ? "Injection marked as completed." : "Injection marked as incomplete.", "success");
    } catch {
      // Revert on failure
      setResult((prev) => {
        const reverted = { ...prev, calendar: { ...prev.calendar } };
        for (const month of Object.keys(reverted.calendar)) {
          reverted.calendar[month] = { ...reverted.calendar[month] };
          for (const date of Object.keys(reverted.calendar[month])) {
            reverted.calendar[month][date] = reverted.calendar[month][date].map((ev) =>
              ev.id === eventId ? { ...ev, isCompleted: currentlyCompleted } : ev
            );
          }
        }
        return reverted;
      });
      showToast("Failed to update injection status. Please try again.", "error");
    }
  }, [result.scheduleId, mutations, showToast]);

  return (
    <div className="space-y-6">

      {/* ── Schedule Configuration Card ── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
          </div>
          <h2 className="text-sm font-bold text-slate-900">Schedule Configuration</h2>
        </div>
        <div className="p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-3">
              <label className="mb-1.5 block text-xs font-semibold text-slate-600 uppercase tracking-wider">Schedule Name</label>
              <input type="text" value={scheduleName} onChange={(e) => setScheduleName(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
                placeholder="e.g. Recovery Phase Q2" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600 uppercase tracking-wider">Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-medium text-slate-800 outline-none transition-all focus:border-emerald-300 focus:bg-white focus:ring-2 focus:ring-emerald-500/10" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600 uppercase tracking-wider">Duration</label>
              <select value={durationWeeks} onChange={(e) => setDurationWeeks(Number(e.target.value))}
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 px-4 pr-10 text-sm font-medium text-slate-800 outline-none transition-all focus:border-emerald-300 focus:bg-white focus:ring-2 focus:ring-emerald-500/10">
                {[4, 8, 12, 16, 20, 24, 36, 52].map((w) => <option key={w} value={w}>{w} Weeks</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <div className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 text-sm font-bold text-emerald-700">
                {filledSlots} / 10 Peptides
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Peptide Slots Section ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Your Peptide Slots</h2>
          <p className="text-sm text-slate-500">Configure each peptide&apos;s dosing settings individually</p>
        </div>
        <button onClick={openPicker} disabled={filledSlots >= 10}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Add Peptides
        </button>
      </div>

      {/* ── Slot Cards ── */}
      <div className="space-y-2.5">
        {slots.map((slot) => {
          const filled = Boolean(slot.peptideId);
          if (!filled) return null;

          const imgSrc = toDisplayImageUrl(slot.peptideImage);
          return (
            <div key={slot.position} className="rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:border-slate-300 overflow-hidden">
              <div className="flex items-center gap-3.5 px-4 py-3.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-xs font-bold text-emerald-700">
                  {slot.position}
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 border border-slate-200/50 overflow-hidden">
                  {imgSrc ? (
                    <img src={imgSrc} alt="" className="h-full w-full object-contain" />
                  ) : (
                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0" />
                    </svg>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 truncate">{slot.peptideName}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {slot.peptideMg && <span className="text-[11px] text-slate-500">{slot.peptideMg}</span>}
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                      slot.timeOfDay === "AM" ? "bg-teal-50 text-teal-700" :
                      slot.timeOfDay === "PM" ? "bg-indigo-50 text-indigo-700" :
                      "bg-amber-50 text-amber-700"
                    }`}>{slot.timeOfDay}</span>
                    {slot.isOverridden && <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">OVERRIDE</span>}
                    {slot.daysOfWeek.length > 0 && <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">{slot.daysOfWeek.join("/")}</span>}
                  </div>
                </div>
                <button onClick={() => setEditingSlot(editingSlot === slot.position ? null : slot.position)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${editingSlot === slot.position ? "bg-emerald-100 text-emerald-700" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"}`} title="Configure">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                  </svg>
                </button>
                <button onClick={() => clearSlot(slot.position)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500" title="Remove">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Expanded Settings Panel */}
              <AnimatePresence>
                {editingSlot === slot.position && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                    <SlotEditor slot={slot} variants={variantMap[slot.peptideId] || []} onUpdate={(patch) => updateSlot(slot.position, patch)} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {/* Empty state */}
        {filledSlots === 0 && (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/30 py-12 px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 mb-4">
              <svg className="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-700">No peptides added yet</p>
            <p className="mt-1 text-xs text-slate-500">Click &quot;Add Peptides&quot; to browse and select from the library</p>
          </div>
        )}
      </div>

      {/* ── Generate Button ── */}
      {filledSlots > 0 && (
        <button onClick={buildSchedule} disabled={isGenerating || !isLoggedIn}
          className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 text-white font-bold text-[15px] shadow-xl shadow-emerald-600/25 transition-all hover:bg-emerald-500 hover:-translate-y-0.5 hover:shadow-2xl disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0">
          {isGenerating ? (
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              <span>{generateStep}</span>
            </div>
          ) : (
            <>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              Generate Calendar ({filledSlots} Peptide{filledSlots === 1 ? "" : "s"})
            </>
          )}
        </button>
      )}

      {!isLoggedIn && filledSlots > 0 && (
        <p className="text-center text-sm text-slate-500"><span className="font-bold text-slate-700">Sign in</span> to generate and save your peptide schedule</p>
      )}

      {/* ── Generating Overlay ── */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-4 rounded-2xl bg-white border border-slate-200 shadow-2xl px-10 py-8">
              <div className="h-10 w-10 animate-spin rounded-full border-3 border-slate-200 border-t-emerald-500" />
              <div className="text-center">
                <p className="text-base font-bold text-slate-900">Generating Your Schedule</p>
                <p className="mt-1 text-sm text-slate-500">{generateStep}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Calendar Result ── */}
      {result.scheduleId && (
        <CalendarView
          calendar={result.calendar}
          scheduleId={result.scheduleId}
          message={result.message}
          authState={authState}
          onToggleComplete={toggleEventComplete}
        />
      )}

      {/* ══════════ PEPTIDE PICKER MODAL ══════════ */}
      <AnimatePresence>
        {pickerOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
            onClick={() => setPickerOpen(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">

              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 shrink-0">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add Peptides to Schedule</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Select one or more — {10 - filledSlots} slot{10 - filledSlots === 1 ? "" : "s"} available</p>
                </div>
                <button onClick={() => setPickerOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Search */}
              <div className="px-5 py-3 border-b border-slate-100 shrink-0">
                <div className="relative">
                  {peptidesQuery.isFetching ? (
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500" />
                  ) : (
                    <svg className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                  )}
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search peptides by name, dosage, or category..."
                    autoFocus className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-2 focus:ring-emerald-500/10" />
                </div>
              </div>

              {/* Selection summary bar */}
              {pickerSelections.length > 0 && (
                <div className="flex items-center justify-between border-b border-emerald-100 bg-emerald-50/50 px-5 py-2.5 shrink-0">
                  <p className="text-sm font-semibold text-emerald-800">{pickerSelections.length} selected</p>
                  <button onClick={() => setPickerSelections([])} className="text-xs font-semibold text-emerald-600 hover:text-emerald-800">Clear all</button>
                </div>
              )}

              {/* Peptide Grid */}
              <div className="flex-1 overflow-y-auto p-4">
                {peptidesQuery.isLoading && peptideOptions.length === 0 ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500" />
                  </div>
                ) : peptideOptions.length === 0 ? (
                  <div className="flex flex-col items-center py-16 text-center">
                    <svg className="h-10 w-10 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                    <p className="text-sm text-slate-500">{searchQuery ? `No results for "${searchQuery}"` : "No peptides available"}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {peptideOptions.map((peptide) => {
                      const alreadyInSchedule = isPeptideUsedInSlots(peptide.id);
                      const isSelected = pickerSelections.some((p) => p.id === peptide.id);
                      const imgSrc = toDisplayImageUrl(peptide.imageUrl);
                      const disabled = alreadyInSchedule;
                      const primaryCat = peptide.healthCategories?.[0];

                      return (
                        <button key={peptide.id}
                          onClick={() => !disabled && togglePickerSelection(peptide)}
                          disabled={disabled}
                          className={`flex items-center gap-3 rounded-xl p-3 text-left transition-all border ${
                            disabled ? "opacity-40 cursor-not-allowed border-slate-100 bg-slate-50" :
                            isSelected ? "border-emerald-400 bg-emerald-50/60 shadow-sm shadow-emerald-100" :
                            "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                          }`}>
                          <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all ${
                            disabled ? "border-slate-200 bg-slate-100" :
                            isSelected ? "border-emerald-500 bg-emerald-500" : "border-slate-300 bg-white"
                          }`}>
                            {isSelected && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                            {disabled && <svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                          </div>

                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 border border-slate-200/50 overflow-hidden">
                            {imgSrc ? (
                              <img src={imgSrc} alt="" className="h-full w-full object-contain" loading="lazy" />
                            ) : (
                              <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0" />
                              </svg>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-900 truncate">{peptide.name}</p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {peptide.mgAmount && <span className="text-[11px] text-slate-500">{peptide.mgAmount}</span>}
                              <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                peptide.type === "blend" ? "bg-violet-50 text-violet-700" : "bg-slate-100 text-slate-600"
                              }`}>{peptide.type === "blend" ? "Blend" : "Single"}</span>
                              {primaryCat && <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-700">{primaryCat}</span>}
                              {alreadyInSchedule && <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">In schedule</span>}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-5 py-3.5 shrink-0">
                <p className="text-xs text-slate-500">{peptideOptions.length} peptide{peptideOptions.length === 1 ? "" : "s"} shown</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPickerOpen(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-white">Cancel</button>
                  <button onClick={confirmPicker} disabled={pickerSelections.length === 0}
                    className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed">
                    Add {pickerSelections.length > 0 ? `(${pickerSelections.length})` : "Selected"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


/* ── Slot Editor Panel ── */
function SlotEditor({ slot, variants, onUpdate }) {
  const [overrideWarning, setOverrideWarning] = useState(false);

  return (
    <div className="border-t border-slate-100 bg-slate-50/30 px-5 py-5 space-y-5">

      {/* Dosing Protocol Variants */}
      {variants.length > 0 && (
        <div>
          <label className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-600 uppercase tracking-wider">
            <svg className="h-3.5 w-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5" /></svg>
            Dosing Protocol
          </label>
          <div className="space-y-1.5">
            {[{ name: "", label: "Default schedule" }, ...variants.map((v) => ({ name: v.name, label: v.name }))].map((v) => (
              <button key={v.name} onClick={() => onUpdate({ selectedScheduleName: v.name })} disabled={slot.isOverridden}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left transition-all border text-sm ${
                  slot.selectedScheduleName === v.name ? "border-emerald-300 bg-emerald-50/60 font-semibold text-slate-900" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                } ${slot.isOverridden ? "opacity-50 cursor-not-allowed" : ""}`}>
                <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${slot.selectedScheduleName === v.name ? "border-emerald-500" : "border-slate-300"}`}>
                  {slot.selectedScheduleName === v.name && <div className="h-2 w-2 rounded-full bg-emerald-500" />}
                </div>
                {v.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Time of Day */}
      <div>
        <label className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-600 uppercase tracking-wider">
          <svg className="h-3.5 w-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Time of Day
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { val: "AM", label: "Morning", cls: "teal" },
            { val: "PM", label: "Evening", cls: "indigo" },
            { val: "BOTH", label: "Both", cls: "amber" },
          ].map((tod) => {
            const sel = slot.timeOfDay === tod.val;
            const colors = { teal: sel ? "bg-teal-500 text-white border-teal-500" : "bg-white text-teal-700 border-slate-200 hover:border-teal-300", indigo: sel ? "bg-indigo-500 text-white border-indigo-500" : "bg-white text-indigo-700 border-slate-200 hover:border-indigo-300", amber: sel ? "bg-amber-500 text-white border-amber-500" : "bg-white text-amber-700 border-slate-200 hover:border-amber-300" };
            return (
              <button key={tod.val} onClick={() => onUpdate({ timeOfDay: tod.val })}
                className={`flex flex-col items-center gap-0.5 rounded-xl border py-3 text-xs font-bold transition-all ${colors[tod.cls]}`}>
                {tod.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Injection Days */}
      <div>
        <label className="flex items-center gap-2 mb-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
          <svg className="h-3.5 w-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25" /></svg>
          Injection Days
        </label>
        <p className="text-[11px] text-slate-500 mb-2.5">Leave empty for default</p>
        <div className="flex flex-wrap gap-1.5">
          {ALL_DAYS.map((day) => {
            const sel = slot.daysOfWeek.includes(day);
            return (
              <button key={day} onClick={() => { const next = sel ? slot.daysOfWeek.filter((d) => d !== day) : [...slot.daysOfWeek, day]; onUpdate({ daysOfWeek: next }); }}
                className={`flex h-10 w-10 items-center justify-center rounded-lg text-[11px] font-bold transition-all border ${
                  sel ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-slate-500 border-slate-200 hover:border-emerald-300"
                }`}>{day}</button>
            );
          })}
        </div>
      </div>

      {/* Override */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider">
            <svg className="h-3.5 w-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0" /></svg>
            Override Escalation
          </label>
          <button onClick={() => slot.isOverridden ? onUpdate({ isOverridden: false, overrideConfirmed: false }) : setOverrideWarning(true)}
            className={`relative h-6 w-11 rounded-full transition-colors ${slot.isOverridden ? "bg-amber-500" : "bg-slate-300"}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all shadow-sm ${slot.isOverridden ? "left-5.5" : "left-0.5"}`} />
          </button>
        </div>
        {slot.isOverridden && (
          <div className="mt-2">
            <label className="mb-1 block text-xs font-semibold text-slate-600">Flat dose (units)</label>
            <input type="number" value={slot.doseUnits} onChange={(e) => onUpdate({ doseUnits: e.target.value })} placeholder="e.g. 10"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/10" />
          </div>
        )}
      </div>

      {/* Rest Period */}
      <div>
        <label className="flex items-center gap-2 mb-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
          <svg className="h-3.5 w-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752" /></svg>
          Rest Period
        </label>
        <select value={slot.restWeeks} onChange={(e) => onUpdate({ restWeeks: e.target.value })}
          className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-10 text-sm text-slate-800 outline-none transition-all focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/10">
          <option value="">Default</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => <option key={w} value={w}>{w} Week{w > 1 ? "s" : ""}</option>)}
        </select>
      </div>

      {/* Override Warning Modal */}
      {overrideWarning && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={() => setOverrideWarning(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 mb-4">
              <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900">Override Escalation?</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">This will disable the escalation dosing protocol. A flat dose will be used for the entire schedule duration instead.</p>
            <div className="mt-6 flex justify-end gap-2.5">
              <button onClick={() => setOverrideWarning(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">Cancel</button>
              <button onClick={() => { onUpdate({ isOverridden: true, overrideConfirmed: true }); setOverrideWarning(false); }}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500">Confirm Override</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


/* ── Calendar View ── */
function CalendarView({ calendar, scheduleId, message, authState, onToggleComplete }) {
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
  // Pad trailing to fill last row
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

  // Stats for current month
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
          <p className="text-sm text-emerald-600 font-medium">{message}</p>
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

        {/* Calendar Grid — compact cells */}
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
                {/* Day number */}
                <span className={`text-[12px] leading-none ${
                  isToday ? "flex h-5.5 w-5.5 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-[11px]" :
                  isSelected ? "text-emerald-700 font-bold" :
                  hasEvents ? "text-slate-800 font-medium" : "text-slate-300"
                }`}>{day}</span>
                {/* Dots */}
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
              {/* Date header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <p className="text-[13px] font-bold text-slate-900">
                  {new Date(selectedDate + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
                </p>
                <button onClick={() => setSelectedDate(null)} className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              {/* Event rows */}
              <div className="divide-y divide-slate-50">
                {selectedEvents.map((ev, idx) => {
                  const completed = ev.isCompleted;
                  return (
                    <div key={ev.id || `${selectedDate}-${idx}`} className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${completed ? "bg-emerald-50/20" : "hover:bg-slate-50/50"}`}>
                      {/* Checkbox */}
                      <button onClick={() => onToggleComplete(ev.id, completed)}
                        className={`group flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-[1.5px] transition-all ${
                          completed ? "border-emerald-500 bg-emerald-500 scale-100" : "border-slate-300 bg-white hover:border-emerald-400 hover:scale-105"
                        }`}>
                        {completed && (
                          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        )}
                      </button>

                      {/* Time pill */}
                      <span className={`inline-flex items-center justify-center rounded-md px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase min-w-[32px] ${
                        ev.isRestDay ? "bg-slate-100 text-slate-400" :
                        ev.timeOfDay === "PM" ? "bg-indigo-100/80 text-indigo-600" :
                        ev.timeOfDay === "BOTH" ? "bg-amber-100/80 text-amber-600" :
                        "bg-teal-100/80 text-teal-600"
                      }`}>
                        {ev.isRestDay ? "Rest" : ev.timeOfDay || "AM"}
                      </span>

                      {/* Name + dose */}
                      <div className="min-w-0 flex-1">
                        <p className={`text-[13px] font-semibold truncate leading-tight ${completed ? "text-slate-400 line-through decoration-slate-300" : "text-slate-800"}`}>
                          {ev.peptideName || "Peptide"}
                        </p>
                      </div>

                      {/* Dose */}
                      <span className={`text-[11px] font-medium shrink-0 ${completed ? "text-slate-300" : "text-slate-500"}`}>
                        {ev.doseLabel || `${ev.doseUnits}u`}
                      </span>

                      {/* Status badge */}
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
