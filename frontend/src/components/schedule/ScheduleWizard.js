"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useForm } from "react-hook-form";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Toggle from "@/components/ui/Toggle";
import { useToast } from "@/components/ui/ToastProvider";
import { DAY_OPTIONS } from "@/lib/config";
import { apiRequest, downloadSchedulePdf } from "@/lib/api";
import { usePeptides, useScheduleBuilderMutations, useSchedules } from "@/lib/hooks";
import { useAuthStore } from "@/lib/auth-store";

const steps = [
  "Peptide Selection",
  "Frequency Strategy",
  "Clinical Overrides",
  "Escalation Variant",
  "Cycle & Rest",
  "Generate & Export",
];

const FREQUENCY_OPTIONS = [
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly (Once per week)" },
  { value: "TWICE_WEEKLY", label: "Twice weekly" },
  { value: "THREE_TIMES_WEEKLY", label: "Three times weekly" },
];

function emptySelection(peptide) {
  return {
    peptideId: peptide.id,
    peptideName: peptide.name,
    selectedScheduleName: "",
    isOverridden: false,
    overrideConfirmed: false,
    overrideTimeOfDay: "AM",
    overrideDaysOfWeek: ["MON", "THU"],
    overrideDoseUnits: "",
    overrideFrequency: "",
    overrideRestWeeks: "",
  };
}

function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, (month || 1) - 1, 1);
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function formatDateLabel(dateKey) {
  const date = new Date(dateKey);
  if (Number.isNaN(date.getTime())) return dateKey;
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ScheduleWizard() {
  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      name: "My Peptide Schedule",
      startDate: new Date().toISOString().slice(0, 10),
      durationWeeks: 12,
      notes: "",
    },
  });

  const authState = useAuthStore();
  const { showToast } = useToast();
  const peptidesQuery = usePeptides({ limit: 100, offset: 0 });
  const schedulesQuery = useSchedules();
  const mutations = useScheduleBuilderMutations();

  const [step, setStep] = useState(0);
  const [selectedId, setSelectedId] = useState("");
  const [selectedPeptides, setSelectedPeptides] = useState([]);
  const [frequency, setFrequency] = useState("DAILY");
  const [overrideWarningIndex, setOverrideWarningIndex] = useState(-1);
  const [variantMap, setVariantMap] = useState({});
  const [result, setResult] = useState({ scheduleId: "", calendar: null, preview: null, message: "" });
  const isLoggedIn = Boolean(authState.token);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prefill = params.get("add");
    const data = peptidesQuery.data?.data || [];
    if (!prefill || !data.length) return;

    const found = data.find((item) => item.id === prefill);
    if (!found) return;

    setSelectedPeptides((current) => {
      if (current.some((entry) => entry.peptideId === found.id)) return current;
      return [...current, emptySelection(found)].slice(0, 10);
    });
  }, [peptidesQuery.data]);

  useEffect(() => {
    if (step < 3 || !selectedPeptides.length) return;

    // Load full peptide detail so each selected peptide can expose
    // available escalation schedule variants in Step 4.
    const loadVariants = async () => {
      const entries = await Promise.all(
        selectedPeptides.map(async (item) => {
          try {
            const payload = await apiRequest(`/peptides/${item.peptideId}`, {
              token: authState.token,
              refreshToken: authState.refreshToken,
              onRefresh: authState.setAuth,
            });
            return [item.peptideId, payload.data?.scheduleVariants || []];
          } catch {
            return [item.peptideId, []];
          }
        })
      );
      setVariantMap(Object.fromEntries(entries));
    };

    loadVariants();
  }, [step, selectedPeptides, authState]);

  const peptideOptions = peptidesQuery.data?.data || [];
  const existingSchedules = schedulesQuery.data?.data || [];

  const calendarMonths = useMemo(
    () =>
      Object.entries(result.calendar || {})
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, dates]) => [
          month,
          Object.entries(dates || {}).sort(([a], [b]) => a.localeCompare(b)),
        ]),
    [result.calendar]
  );

  const canProceed = () => {
    if (step === 0) return selectedPeptides.length > 0;
    return true;
  };

  const addPeptide = () => {
    if (!selectedId) {
      showToast("Select a peptide before adding.", "info");
      return;
    }
    if (selectedPeptides.length >= 10) {
      showToast("You can add up to 10 peptides only.", "error");
      return;
    }
    const found = peptideOptions.find((entry) => entry.id === selectedId);
    if (!found) {
      showToast("Selected peptide is unavailable.", "error");
      return;
    }

    setSelectedPeptides((current) => {
      if (current.some((entry) => entry.peptideId === found.id)) {
        showToast("Peptide is already in your schedule.", "info");
        return current;
      }
      return [...current, emptySelection(found)];
    });
    showToast("Peptide added to schedule.", "success");
    setSelectedId("");
  };

  const updateSelection = (index, patch) => {
    setSelectedPeptides((current) => current.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));
  };

  const removeSelection = (peptideId) => {
    setSelectedPeptides((current) => current.filter((entry) => entry.peptideId !== peptideId));
  };

  const buildSchedule = async (formValues) => {
    if (!authState.token) {
      showToast("Login required to generate schedules.", "error");
      return;
    }

    try {
      // Create base schedule first, then append each peptide slot in sequence
      // to preserve position ordering and backend validation.
      const scheduleResponse = await mutations.createSchedule.mutateAsync({
        name: formValues.name,
        startDate: formValues.startDate,
        durationWeeks: Number(formValues.durationWeeks),
        notes: formValues.notes,
      });

      const scheduleId = scheduleResponse.data.id;

      for (let index = 0; index < selectedPeptides.length; index += 1) {
        const item = selectedPeptides[index];
        const body = {
          peptideId: item.peptideId,
          position: index + 1,
          selectedScheduleName: item.selectedScheduleName || undefined,
          isOverridden: item.isOverridden,
          overrideConfirmed: item.isOverridden ? item.overrideConfirmed : false,
          overrideTimeOfDay: item.isOverridden ? item.overrideTimeOfDay : undefined,
          overrideDaysOfWeek: item.isOverridden ? item.overrideDaysOfWeek : undefined,
          overrideDoseUnits: item.isOverridden && item.overrideDoseUnits ? Number(item.overrideDoseUnits) : undefined,
          overrideFrequency: item.isOverridden ? item.overrideFrequency || frequency : undefined,
          overrideRestWeeks: item.overrideRestWeeks ? Number(item.overrideRestWeeks) : undefined,
        };

        await mutations.addItem.mutateAsync({ scheduleId, body });
      }

      const preview = await mutations.preview.mutateAsync(scheduleId);
      const generated = await mutations.generate.mutateAsync(scheduleId);
      const calendar = await mutations.calendar.mutateAsync(scheduleId);

      setResult({
        scheduleId,
        preview: preview.data,
        calendar: calendar.data,
        message: generated.message,
      });
      showToast("Schedule generated successfully.", "success");
    } catch (error) {
      showToast(error?.message || "Failed to generate schedule.", "error");
    }
  };

  const nextStep = () => {
    if (step === 0 && selectedPeptides.length === 0) {
      showToast("Add at least one peptide to continue.", "error");
      return;
    }
    if (step === 4 && !isLoggedIn) {
      showToast("Sign in required to generate and save schedules.", "info");
    }
    setStep((current) => Math.min(current + 1, steps.length - 1));
  };

  const previousStep = () => {
    setStep((current) => Math.max(current - 1, 0));
  };

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="grid gap-3 md:grid-cols-6">
          {steps.map((label, index) => (
            <div key={label} className={`rounded-xl px-3 py-2 text-xs font-semibold ${index === step ? "bg-(--color-primary) text-white" : "bg-slate-100 text-slate-600"}`}>
              {index + 1}. {label}
            </div>
          ))}
        </div>
      </Card>

      {isLoggedIn && (
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">Saved Schedules</h3>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {existingSchedules.length} Total
            </span>
          </div>
          {schedulesQuery.isLoading ? (
            <p className="text-sm text-slate-500">Loading schedules...</p>
          ) : existingSchedules.length === 0 ? (
            <p className="text-sm text-slate-500">No schedules created yet. Generate your first schedule below.</p>
          ) : (
            <div className="space-y-2">
              {existingSchedules.slice(0, 5).map((schedule) => (
                <div key={schedule.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{schedule.name}</p>
                    <p className="text-xs text-slate-500">Start {schedule.startDate} • {schedule.durationWeeks} weeks</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${schedule.isGenerated ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                      {schedule.isGenerated ? "Generated" : "Draft"}
                    </span>
                    {schedule.isGenerated && (
                      <Button
                        type="button"
                        variant="secondary"
                        className="px-3 py-1.5 text-xs"
                        onClick={() =>
                          downloadSchedulePdf(schedule.id, {
                            token: authState.token,
                            refreshToken: authState.refreshToken,
                            onRefresh: authState.setAuth,
                          })
                        }
                      >
                        PDF
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <Card className="p-6">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }}>
            {step === 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Step 1: Select Peptides (up to 10)</h2>
                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                  <Select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
                    <option value="">Choose peptide protocol</option>
                    {peptideOptions.map((item) => (
                      <option key={item.id} value={item.id}>{item.name} ({item.mgAmount || "N/A"})</option>
                    ))}
                  </Select>
                  <Button type="button" onClick={addPeptide}>Add Peptide</Button>
                </div>

                <div className="space-y-2">
                  {selectedPeptides.map((item) => (
                    <div key={item.peptideId} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm">
                      <span>{item.peptideName}</span>
                      <Button variant="ghost" onClick={() => removeSelection(item.peptideId)}>Remove</Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Step 2: Frequency Strategy</h2>
                <p className="text-sm text-slate-600">This default frequency is applied when an item override is enabled and no custom frequency is entered.</p>
                <Select value={frequency} onChange={(event) => setFrequency(event.target.value)}>
                  {FREQUENCY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </Select>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Step 3: Override Controls</h2>
                {selectedPeptides.map((item, index) => (
                  <div key={item.peptideId} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{item.peptideName}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Override</span>
                        <Toggle
                          checked={item.isOverridden}
                          onChange={(value) => {
                            if (value) {
                              setOverrideWarningIndex(index);
                            } else {
                              updateSelection(index, { isOverridden: false, overrideConfirmed: false });
                            }
                          }}
                        />
                      </div>
                    </div>

                    {item.isOverridden && (
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-semibold">Time</label>
                          <Select value={item.overrideTimeOfDay} onChange={(event) => updateSelection(index, { overrideTimeOfDay: event.target.value })}>
                            <option value="AM">AM</option>
                            <option value="PM">PM</option>
                            <option value="BOTH">Both</option>
                          </Select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold">Dose Units</label>
                          <input
                            value={item.overrideDoseUnits}
                            onChange={(event) => updateSelection(index, { overrideDoseUnits: event.target.value })}
                            placeholder="e.g. 12"
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-semibold">Frequency</label>
                          <Select
                            value={item.overrideFrequency}
                            onChange={(event) => updateSelection(index, { overrideFrequency: event.target.value })}
                          >
                            <option value="">Use default strategy</option>
                            {FREQUENCY_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </Select>
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-semibold">Days</label>
                          <div className="flex flex-wrap gap-1">
                            {DAY_OPTIONS.map((day) => {
                              const selected = item.overrideDaysOfWeek.includes(day);
                              return (
                                <button
                                  key={day}
                                  type="button"
                                  onClick={() => {
                                    const nextDays = selected
                                      ? item.overrideDaysOfWeek.filter((d) => d !== day)
                                      : [...item.overrideDaysOfWeek, day];
                                    updateSelection(index, { overrideDaysOfWeek: nextDays });
                                  }}
                                  className={`rounded-md px-2 py-1 text-xs ${selected ? "bg-(--color-primary) text-white" : "bg-slate-100 text-slate-600"}`}
                                >
                                  {day}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Step 4: Escalation</h2>
                {selectedPeptides.map((item, index) => (
                  <div key={item.peptideId} className="rounded-xl border border-slate-200 p-4">
                    <p className="text-sm font-semibold">{item.peptideName}</p>
                    <Select
                      className="mt-2"
                      value={item.selectedScheduleName}
                      onChange={(event) => updateSelection(index, { selectedScheduleName: event.target.value })}
                      disabled={item.isOverridden}
                    >
                      <option value="">Default schedule</option>
                      {(variantMap[item.peptideId] || []).map((variant) => (
                        <option key={variant.name} value={variant.name}>{variant.name}</option>
                      ))}
                    </Select>
                  </div>
                ))}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Step 5: Rest Periods</h2>
                {selectedPeptides.map((item, index) => (
                  <div key={item.peptideId} className="grid gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-[1fr_200px] md:items-center">
                    <p className="text-sm font-semibold">{item.peptideName}</p>
                    <input
                      value={item.overrideRestWeeks}
                      onChange={(event) => updateSelection(index, { overrideRestWeeks: event.target.value })}
                      placeholder="Optional weeks"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                ))}
              </div>
            )}

            {step === 5 && (
              <form className="space-y-4" onSubmit={handleSubmit(buildSchedule)}>
                <h2 className="text-xl font-bold">Step 6: Generate Output</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Schedule Name</label>
                    <input {...register("name", { required: true })} placeholder="e.g. Recovery Phase Q2" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Start Date</label>
                    <input type="date" {...register("startDate", { required: true })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Duration (weeks)</label>
                    <input type="number" min="1" max="52" {...register("durationWeeks", { required: true })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Notes</label>
                    <input {...register("notes")} placeholder="Optional clinical notes for this schedule" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={mutations.createSchedule.isPending || mutations.generate.isPending}
                  className={!isLoggedIn ? "cursor-not-allowed opacity-60" : ""}
                  onClick={() => {
                    if (!isLoggedIn) {
                      showToast("Sign in required to create and store schedules.", "info");
                    }
                  }}
                >
                  {mutations.generate.isPending ? "Generating..." : "Generate Calendar & Table"}
                </Button>

                {!isLoggedIn && <p className="text-xs text-slate-500">Sign in to enable generation and secure storage.</p>}

                {result.message && <p className="text-sm text-emerald-700">{result.message}</p>}

                {result.scheduleId && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() =>
                          downloadSchedulePdf(result.scheduleId, {
                            token: authState.token,
                            refreshToken: authState.refreshToken,
                            onRefresh: authState.setAuth,
                          })
                        }
                      >
                        Export PDF
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-slate-700">Injection Calendar</p>
                      {calendarMonths.length === 0 ? (
                        <p className="text-sm text-slate-500">No calendar entries found.</p>
                      ) : (
                        calendarMonths.map(([month, dateEntries]) => (
                          <Card key={month} className="rounded-xl border border-slate-200 p-4 shadow-none">
                            <p className="mb-4 text-base font-bold text-slate-900">{formatMonthLabel(month)}</p>
                            <div className="space-y-3">
                              {dateEntries.map(([date, events]) => (
                                <div key={date} className="rounded-xl border border-slate-200/70 bg-slate-50/60 p-3">
                                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-600">{formatDateLabel(date)}</p>
                                  <div className="grid grid-cols-[90px_1fr_1fr_90px] gap-2 border-b border-slate-200 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    <span>Time</span>
                                    <span>Peptide</span>
                                    <span>Dose</span>
                                    <span>Rest Day</span>
                                  </div>
                                  <div className="space-y-1.5 pt-2">
                                    {events.map((event) => (
                                      <div key={event.id || `${date}-${event.peptideId}-${event.timeOfDay}`} className="grid grid-cols-[90px_1fr_1fr_90px] gap-2 text-xs text-slate-700">
                                        <span className="font-semibold text-slate-800">{event.timeOfDay || "AM"}</span>
                                        <span>{event.peptideName || "Peptide"}</span>
                                        <span>{event.doseLabel || `${event.doseUnits} units`}</span>
                                        <span className={event.isRestDay ? "font-semibold text-amber-700" : "text-slate-600"}>
                                          {event.isRestDay ? "Yes" : "No"}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </form>
            )}
          </motion.div>
        </AnimatePresence>
      </Card>

      {overrideWarningIndex >= 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <Card className="max-w-md p-6">
            <h3 className="text-lg font-bold">Override Warning</h3>
            <p className="mt-2 text-sm text-slate-600">
              Enabling override disables escalation dosing for this peptide. Confirm to continue.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setOverrideWarningIndex(-1)}>Cancel</Button>
              <Button
                onClick={() => {
                  updateSelection(overrideWarningIndex, { isOverridden: true, overrideConfirmed: true });
                  setOverrideWarningIndex(-1);
                }}
              >
                Confirm Override
              </Button>
            </div>
          </Card>
        </div>
      )}

      <div className="text-xs text-slate-500">
        <p>Current plan summary: {selectedPeptides.length} peptides • Frequency {frequency} • Start {watch("startDate")}</p>
      </div>

      <div className="flex items-center justify-between">
        <Button type="button" variant="secondary" onClick={previousStep} disabled={step === 0}>
          Previous
        </Button>
        {step < steps.length - 1 ? (
          <Button
            type="button"
            onClick={() => {
              if (step === steps.length - 2 && !isLoggedIn) {
                showToast("Sign in required to create and store schedules.", "info");
              }
              nextStep();
            }}
          >
            Next
          </Button>
        ) : null}
      </div>
    </div>
  );
}
