"use client";

import Link from "next/link";
import { useState } from "react";

export default function ReconstitutionCalculator() {
  const [peptideAmount, setPeptideAmount] = useState("10");
  const [peptideUnit, setPeptideUnit] = useState("mg");
  const [bacWater, setBacWater] = useState("5");
  const [desiredDose, setDesiredDose] = useState("250");
  const [doseUnit, setDoseUnit] = useState("mcg");
  const [result, setResult] = useState(null);

  const calculate = () => {
    const amountMg = peptideUnit === "mcg" ? parseFloat(peptideAmount) / 1000 : parseFloat(peptideAmount);
    const water = parseFloat(bacWater);
    const doseMg = doseUnit === "mcg" ? parseFloat(desiredDose) / 1000 : parseFloat(desiredDose);

    if (!amountMg || !water || !doseMg || amountMg <= 0 || water <= 0 || doseMg <= 0) {
      setResult(null);
      return;
    }

    const concentrationMgPerMl = amountMg / water;
    const volumeMl = doseMg / concentrationMgPerMl;
    const insulinUnits = volumeMl * 100;
    const totalDoses = amountMg / doseMg;

    setResult({
      volumeMl: volumeMl.toFixed(3),
      insulinUnits: insulinUnits.toFixed(1),
      totalDoses: totalDoses.toFixed(1),
      concentration: concentrationMgPerMl.toFixed(2),
    });
  };

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 w-full">
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="grid lg:grid-cols-2">
          {/* Left — Info */}
          <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-14">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 w-fit mb-6">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Calculator
            </div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Reconstitution Calculator</h2>
            <p className="mt-4 text-base text-slate-600 leading-relaxed max-w-lg">
              Calculate precise injection volumes, syringe units, and total doses from your vial. Enter your peptide details and get instant results.
            </p>
            <div className="mt-8 space-y-4">
              {[
                { step: "1", text: "Enter the total peptide amount in your vial" },
                { step: "2", text: "Specify the BAC water volume used for reconstitution" },
                { step: "3", text: "Enter your target dose per injection" },
                { step: "4", text: "Click Calculate to see volume, units, and total doses" },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-xs font-bold text-emerald-700">{item.step}</span>
                  <p className="text-sm font-medium text-slate-600 leading-relaxed pt-0.5">{item.text}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 text-xs text-slate-400 leading-relaxed">
              Need a custom protocol? <Link href="/library" className="font-semibold text-emerald-600 hover:underline">Browse our library</Link> or request one for free.
            </p>
          </div>

          {/* Right — Form */}
          <div className="border-t lg:border-t-0 lg:border-l border-slate-100 bg-slate-50/50 p-8 sm:p-12 lg:p-14">
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Peptide Amount</label>
                <div className="flex gap-2">
                  <input type="number" value={peptideAmount} onChange={(e) => setPeptideAmount(e.target.value)} placeholder="10" min="0" step="any" className="h-12 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/10" />
                  <select value={peptideUnit} onChange={(e) => setPeptideUnit(e.target.value)} className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/10">
                    <option value="mg">mg</option>
                    <option value="mcg">mcg</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">BAC Water (mL)</label>
                <input type="number" value={bacWater} onChange={(e) => setBacWater(e.target.value)} placeholder="5" min="0" step="any" className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/10" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Desired Dose</label>
                <div className="flex gap-2">
                  <input type="number" value={desiredDose} onChange={(e) => setDesiredDose(e.target.value)} placeholder="250" min="0" step="any" className="h-12 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/10" />
                  <select value={doseUnit} onChange={(e) => setDoseUnit(e.target.value)} className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/10">
                    <option value="mcg">mcg</option>
                    <option value="mg">mg</option>
                  </select>
                </div>
              </div>
              <button onClick={calculate} className="h-12 w-full cursor-pointer rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 hover:-translate-y-px hover:shadow-xl active:scale-[0.98]">
                Calculate
              </button>
              {result && (
                <div className="mt-2 space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Results</span>
                    <span className="ml-auto text-xs text-slate-400">{result.concentration} mg/mL</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Dose Volume</span>
                      <span className="text-sm font-bold text-slate-900">{result.volumeMl} <span className="font-semibold text-emerald-600">mL</span></span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Insulin Syringe</span>
                      <span className="text-sm font-bold text-slate-900">{result.insulinUnits} <span className="font-semibold text-emerald-600">units</span></span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Total Doses in Vial</span>
                      <span className="text-sm font-bold text-slate-900">{result.totalDoses} <span className="font-semibold text-emerald-600">doses</span></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
