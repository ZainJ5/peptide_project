"use client";

import { useRef, useState } from "react";
import {
  ArrowDown, ArrowUp, Calculator, Info, Plus, Trash2, X,
} from "lucide-react";
import { AdminButton, Badge, TextInput, cx } from "../ui";

let keySeq = 0;
export const newKey = () => `k${Date.now().toString(36)}${(keySeq += 1)}`;

function move(list, index, delta) {
  const next = [...list];
  const target = index + delta;
  if (target < 0 || target >= next.length) return list;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/* ── String list (benefits, side effects) ─────────────────────────── */

export function ListEditor({ items, onChange, placeholder, addLabel = "Add item", error }) {
  const refs = useRef([]);
  const [bulk, setBulk] = useState(false);
  const [bulkText, setBulkText] = useState("");

  const setAt = (i, value) => onChange(items.map((it, idx) => (idx === i ? value : it)));
  const add = (focus = true) => {
    onChange([...items, ""]);
    if (focus) requestAnimationFrame(() => refs.current[items.length]?.focus());
  };

  const applyBulk = () => {
    const lines = bulkText
      .split(/\r?\n/)
      .map((l) => l.replace(/^\s*[-*•·\d.)]+\s*/, "").trim())
      .filter(Boolean);
    onChange([...items.filter((i) => i.trim()), ...lines]);
    setBulkText("");
    setBulk(false);
  };

  return (
    <div>
      {items.length === 0 && !bulk && (
        <p className="mb-3 rounded-xl border border-dashed border-slate-200 px-4 py-5 text-center text-sm text-slate-400">Nothing added yet.</p>
      )}
      <ol className="space-y-2">
        {items.map((value, i) => (
          <li key={i} className="group flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-500">{i + 1}</span>
            <TextInput
              ref={(el) => { refs.current[i] = el; }}
              value={value}
              maxLength={500}
              placeholder={placeholder}
              onChange={(e) => setAt(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); add(); }
                if (e.key === "Backspace" && !value && items.length > 0) {
                  e.preventDefault();
                  onChange(items.filter((_, idx) => idx !== i));
                  requestAnimationFrame(() => refs.current[Math.max(0, i - 1)]?.focus());
                }
              }}
            />
            <div className="flex shrink-0 items-center opacity-60 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
              <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => onChange(move(items, i, -1))} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
              <button type="button" aria-label="Move down" disabled={i === items.length - 1} onClick={() => onChange(move(items, i, 1))} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
              <button type="button" aria-label="Remove" onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </li>
        ))}
      </ol>

      {bulk && (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
          <textarea
            rows={5}
            autoFocus
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={"Paste one item per line.\nBullets and numbering are removed automatically."}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100"
          />
          <div className="mt-2 flex justify-end gap-2">
            <AdminButton size="sm" variant="ghost" onClick={() => { setBulk(false); setBulkText(""); }}>Cancel</AdminButton>
            <AdminButton size="sm" variant="navy" onClick={applyBulk} disabled={!bulkText.trim()}>Add lines</AdminButton>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        <AdminButton size="sm" icon={Plus} onClick={() => add()}>{addLabel}</AdminButton>
        {!bulk && <AdminButton size="sm" variant="ghost" onClick={() => setBulk(true)}>Paste list</AdminButton>}
      </div>
    </div>
  );
}

/* ── Category tags ────────────────────────────────────────────────── */

export function CategoryInput({ value, onChange, suggestions = [] }) {
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);

  const addCategory = (raw) => {
    const name = raw.replace(/\s+/g, " ").trim().toLowerCase();
    if (!name || name.length > 100 || value.includes(name) || value.length >= 20) return;
    onChange([...value, name]);
    setText("");
  };

  const matches = suggestions
    .filter((s) => !value.includes(s) && s.includes(text.trim().toLowerCase()))
    .slice(0, 8);

  return (
    <div className="relative">
      <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-1.5 transition-colors focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100 hover:border-slate-300">
        {value.map((c) => (
          <span key={c} className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 py-1 pl-2.5 pr-1 text-xs font-semibold capitalize text-emerald-700 ring-1 ring-inset ring-emerald-600/15">
            {c}
            <button type="button" aria-label={`Remove ${c}`} onClick={() => onChange(value.filter((v) => v !== c))} className="rounded p-0.5 hover:bg-emerald-100">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 120)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addCategory(text); }
            if (e.key === "Backspace" && !text && value.length) onChange(value.slice(0, -1));
          }}
          placeholder={value.length ? "Add another…" : "Type a category and press Enter"}
          aria-label="Add health category"
          className="min-w-[160px] flex-1 bg-transparent px-1.5 py-1 text-sm focus:outline-none"
        />
      </div>
      {focused && matches.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10">
          {matches.map((s) => (
            <button key={s} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => addCategory(s)} className="block w-full rounded-lg px-3 py-2 text-left text-sm capitalize text-slate-700 hover:bg-slate-50">
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Dosing variants & steps ──────────────────────────────────────── */

export const emptyStep = () => ({
  key: newKey(), weekRangeLabel: "", weekStart: "", weekEnd: "", dailyDoseLabel: "", dailyDoseMcg: "", unitsPerInjection: "", volumeMl: "",
});

const round = (n, dp) => String(Math.round(n * 10 ** dp) / 10 ** dp);

/** "10MG" -> 10, "5000 IU" -> null */
export function parseVialMg(mgAmount) {
  const m = String(mgAmount || "").match(/(\d+(?:\.\d+)?)\s*MG\b/i);
  return m ? parseFloat(m[1]) : null;
}

function weekLabel(start, end) {
  if (start === "" || start == null) return "";
  if (end === "" || end == null) return `Weeks ${start}+`;
  return Number(start) === Number(end) ? `Week ${start}` : `Weeks ${start}–${end}`;
}

function doseLabel(mcg) {
  if (mcg === "" || mcg == null) return "";
  const n = Number(mcg);
  return `${n.toLocaleString("en-US")} mcg (${round(n / 1000, 3)} mg)`;
}

const STEP_COLUMNS = [
  { key: "weekRangeLabel", label: "Week label", width: "w-[116px]", placeholder: "Weeks 1–2", type: "text", max: 50 },
  { key: "weekStart", label: "Start wk", width: "w-[64px]", placeholder: "1", type: "number", step: "1" },
  { key: "weekEnd", label: "End wk", width: "w-[64px]", placeholder: "open", type: "number", step: "1" },
  { key: "dailyDoseLabel", label: "Dose label", width: "w-[148px]", placeholder: "250 mcg (0.25 mg)", type: "text", max: 100 },
  { key: "dailyDoseMcg", label: "Dose mcg", width: "w-[84px]", placeholder: "250", type: "number", step: "any" },
  { key: "unitsPerInjection", label: "Units", width: "w-[72px]", placeholder: "5", type: "number", step: "any" },
  { key: "volumeMl", label: "Volume mL", width: "w-[80px]", placeholder: "0.05", type: "number", step: "any" },
];

export function DosingEditor({ variants, onChange, vialMg, bacMl, errors = {} }) {
  const concentration = vialMg && bacMl ? (vialMg * 1000) / bacMl : null; // mcg per mL

  const setVariant = (vi, patch) => onChange(variants.map((v, i) => (i === vi ? { ...v, ...patch } : v)));
  const setStep = (vi, si, patch) =>
    setVariant(vi, { steps: variants[vi].steps.map((s, i) => (i === si ? { ...s, ...patch } : s)) });

  const addVariant = () =>
    onChange([...variants, { key: newKey(), name: variants.length ? "Advanced Approach" : "Standard / Gradual Approach", originalName: null, steps: [emptyStep()] }]);

  /** Fill units/volume from dose + concentration and blank labels from numbers. */
  const autoFill = (vi) => {
    setVariant(vi, {
      steps: variants[vi].steps.map((s) => {
        const next = { ...s };
        if (!next.weekRangeLabel) next.weekRangeLabel = weekLabel(s.weekStart, s.weekEnd);
        if (!next.dailyDoseLabel) next.dailyDoseLabel = doseLabel(s.dailyDoseMcg);
        if (concentration && s.dailyDoseMcg !== "" && Number(s.dailyDoseMcg) >= 0) {
          const vol = Number(s.dailyDoseMcg) / concentration;
          next.volumeMl = round(vol, 3);
          next.unitsPerInjection = round(vol * 100, 2);
        }
        return next;
      }),
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3 text-[13px] text-slate-600">
        <Info className="h-4 w-4 shrink-0 text-emerald-700" />
        <span>
          The <strong className="text-slate-800">first variant</strong> is the dosing table shown on the public page. Units assume a 100-unit (1 mL) insulin syringe.
        </span>
        <span className="ml-auto font-semibold text-slate-700">
          {concentration
            ? <>Concentration: {round(concentration / 1000, 3)} mg/mL</>
            : <span className="text-amber-700">Set vial mg and BAC water to enable the unit calculator</span>}
        </span>
      </div>

      {variants.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 px-6 py-10 text-center">
          <p className="text-sm font-semibold text-slate-700">No dosing table yet</p>
          <p className="mt-1 text-sm text-slate-400">Add a variant to define the week-by-week escalation.</p>
        </div>
      )}

      {variants.map((variant, vi) => (
        <div key={variant.key} className={cx("overflow-hidden rounded-2xl border", vi === 0 ? "border-emerald-200" : "border-slate-200")}>
          <div className={cx("flex flex-wrap items-center gap-2 px-4 py-3", vi === 0 ? "bg-emerald-50/50" : "bg-slate-50/70")}>
            <div className="min-w-[220px] flex-1">
              <TextInput
                value={variant.name}
                maxLength={300}
                error={errors[`variant-${vi}`]}
                onChange={(e) => setVariant(vi, { name: e.target.value })}
                placeholder="Variant name, e.g. Standard / Gradual Approach (3 mL = ~3.33 mg/mL)"
                aria-label="Variant name"
                className="font-semibold"
              />
            </div>
            {vi === 0 ? <Badge tone="green">Shown on site</Badge> : <Badge tone="slate">Alternate</Badge>}
            <div className="flex items-center">
              <AdminButton size="sm" variant="ghost" icon={Calculator} onClick={() => autoFill(vi)} title="Fill labels, units and volume from the numbers">Auto-fill</AdminButton>
              <button type="button" aria-label="Move variant up" disabled={vi === 0} onClick={() => onChange(move(variants, vi, -1))} className="rounded-md p-1.5 text-slate-400 hover:bg-white hover:text-slate-700 disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
              <button type="button" aria-label="Move variant down" disabled={vi === variants.length - 1} onClick={() => onChange(move(variants, vi, 1))} className="rounded-md p-1.5 text-slate-400 hover:bg-white hover:text-slate-700 disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
              <button type="button" aria-label="Delete variant" onClick={() => onChange(variants.filter((_, i) => i !== vi))} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
          {errors[`variant-${vi}`] && <p className="px-4 pt-2 text-xs font-medium text-red-600">{errors[`variant-${vi}`]}</p>}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[740px] text-left">
              <thead>
                <tr className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="w-9 pb-1.5 pl-3 pr-1 pt-3">#</th>
                  {STEP_COLUMNS.map((c) => <th key={c.key} className="px-1 pb-1.5 pt-3">{c.label}</th>)}
                  <th className="w-[88px] pb-1.5 pl-1 pr-3 pt-3"><span className="sr-only">Row actions</span></th>
                </tr>
              </thead>
              <tbody>
                {variant.steps.map((step, si) => {
                  const rowError = errors[`step-${vi}-${si}`];
                  return (
                    <tr key={step.key} className="group align-top">
                      <td className="py-1.5 pl-3 pr-1">
                        <span className="mt-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-500">{si + 1}</span>
                      </td>
                      {STEP_COLUMNS.map((c) => (
                        <td key={c.key} className="px-1 py-1.5">
                          <input
                            type={c.type}
                            inputMode={c.type === "number" ? "decimal" : undefined}
                            step={c.step}
                            min={c.type === "number" ? 0 : undefined}
                            maxLength={c.max}
                            value={step[c.key]}
                            placeholder={c.placeholder}
                            aria-label={`${c.label}, step ${si + 1}`}
                            onChange={(e) => setStep(vi, si, { [c.key]: e.target.value })}
                            className={cx(
                              "h-9 rounded-lg border bg-white px-2 text-sm tabular-nums placeholder:text-slate-300 focus:outline-none focus:ring-4",
                              c.width,
                              rowError ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:border-emerald-500 focus:ring-emerald-100"
                            )}
                          />
                        </td>
                      ))}
                      <td className="py-1.5 pl-1 pr-3">
                        <div className="mt-0.5 flex items-center opacity-60 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                          <button type="button" aria-label="Move step up" disabled={si === 0} onClick={() => setVariant(vi, { steps: move(variant.steps, si, -1) })} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
                          <button type="button" aria-label="Move step down" disabled={si === variant.steps.length - 1} onClick={() => setVariant(vi, { steps: move(variant.steps, si, 1) })} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
                          <button type="button" aria-label="Delete step" onClick={() => setVariant(vi, { steps: variant.steps.filter((_, i) => i !== si) })} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {variant.steps.some((_, si) => errors[`step-${vi}-${si}`]) && (
            <div className="space-y-0.5 px-4 pt-1">
              {variant.steps.map((_, si) => errors[`step-${vi}-${si}`] && (
                <p key={si} className="text-xs font-medium text-red-600">Step {si + 1}: {errors[`step-${vi}-${si}`]}</p>
              ))}
            </div>
          )}
          <div className="px-4 pb-4 pt-2">
            <AdminButton
              size="sm"
              icon={Plus}
              onClick={() => {
                const last = variant.steps[variant.steps.length - 1];
                const start = last?.weekEnd !== "" && last?.weekEnd != null ? Number(last.weekEnd) + 1 : "";
                setVariant(vi, { steps: [...variant.steps, { ...emptyStep(), weekStart: start === "" ? "" : String(start) }] });
              }}
            >
              Add step
            </AdminButton>
          </div>
        </div>
      ))}

      <AdminButton icon={Plus} variant="secondary" onClick={addVariant}>
        {variants.length ? "Add another variant" : "Add dosing variant"}
      </AdminButton>
    </div>
  );
}
