"use client";

import { useEffect, useMemo, useState } from "react";
import { useUpdateSchedule } from "@/lib/hooks";
import { useToast } from "@/components/ui/ToastProvider";

function toDateInputValue(value) {
  if (!value) return "";
  // startDate is a DATEONLY string ("YYYY-MM-DD") — keep it as-is when possible
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

/**
 * Modal for editing a saved schedule's metadata (name, start date, duration, notes).
 * Only changed fields are sent. Changing the start date or duration invalidates the
 * generated calendar (the schedule returns to "Draft" and must be re-generated).
 */
export default function ScheduleEditModal({ schedule, onClose }) {
  const { showToast } = useToast();
  const updateMutation = useUpdateSchedule();

  const initial = useMemo(
    () => ({
      name: schedule?.name || "",
      startDate: toDateInputValue(schedule?.startDate),
      durationWeeks: schedule?.durationWeeks ?? 8,
      notes: schedule?.notes || "",
    }),
    [schedule]
  );

  const [form, setForm] = useState(initial);

  useEffect(() => setForm(initial), [initial]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const calendarAffected =
    schedule?.isGenerated &&
    (form.startDate !== initial.startDate || Number(form.durationWeeks) !== Number(initial.durationWeeks));

  const handleChange = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    const name = form.name.trim();
    if (!name) {
      showToast("Schedule name is required.", "error");
      return;
    }

    // Send only changed fields
    const body = {};
    if (name !== (schedule.name || "")) body.name = name;
    if (form.startDate && form.startDate !== initial.startDate) body.startDate = form.startDate;
    if (Number(form.durationWeeks) !== Number(initial.durationWeeks)) body.durationWeeks = Number(form.durationWeeks);
    if ((form.notes || "") !== (schedule.notes || "")) body.notes = form.notes;

    if (Object.keys(body).length === 0) {
      onClose();
      return;
    }

    try {
      await updateMutation.mutateAsync({ scheduleId: schedule.id, body });
      showToast("Schedule updated.", "success");
      onClose();
    } catch {
      showToast("Failed to update schedule.", "error");
    }
  };

  const saving = updateMutation.isPending;

  return (
    <div role="dialog" aria-modal="true" aria-label="Edit schedule" className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zM19.5 7.125L16.875 4.5" /></svg>
            </div>
            <h3 className="text-base font-bold text-slate-900">Edit Schedule</h3>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          <div>
            <label htmlFor="edit-name" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Name</label>
            <input
              id="edit-name" type="text" value={form.name} onChange={handleChange("name")} maxLength={200} required
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm font-medium text-slate-800 outline-none transition-all focus:border-emerald-300 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-start" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Start Date</label>
              <input
                id="edit-start" type="date" value={form.startDate} onChange={handleChange("startDate")}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm font-medium text-slate-800 outline-none transition-all focus:border-emerald-300 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
              />
            </div>
            <div>
              <label htmlFor="edit-weeks" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Duration (weeks)</label>
              <input
                id="edit-weeks" type="number" min={1} max={52} value={form.durationWeeks} onChange={handleChange("durationWeeks")}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm font-medium text-slate-800 outline-none transition-all focus:border-emerald-300 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
              />
            </div>
          </div>

          <div>
            <label htmlFor="edit-notes" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Notes</label>
            <textarea
              id="edit-notes" value={form.notes} onChange={handleChange("notes")} rows={3} placeholder="Optional notes…"
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
            />
          </div>

          {calendarAffected && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
              <p className="text-xs font-medium leading-relaxed text-amber-800">
                Changing the start date or duration will reset this schedule to <strong>Draft</strong>. Re-generate it to refresh the calendar.
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60">
              {saving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
