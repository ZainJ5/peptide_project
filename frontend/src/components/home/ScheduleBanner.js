import Link from "next/link";

export default function ScheduleBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 w-full">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
        />
        <div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-teal-400/8 blur-3xl" />

        <div className="relative grid lg:grid-cols-2 gap-8 lg:gap-0">
          {/* Left — Copy */}
          <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/8 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-emerald-300 w-fit mb-6 backdrop-blur-sm border border-white/5">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Schedule Builder
            </div>
            <h2 style={{ color: "white" }} className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl leading-[1.1]">
              Build Your<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Perfect Schedule</span>
            </h2>
            <p className="mt-5 text-base text-slate-300 leading-relaxed max-w-md">
              Select peptides, configure dosing, and generate a complete injection calendar with escalation protocols — all automated and ready to export.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-start gap-3">
              <Link href="/schedule" className="inline-flex h-12 items-center gap-2 rounded-xl bg-emerald-500 px-7 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-400 hover:-translate-y-0.5 hover:shadow-xl">
                Launch Schedule Builder
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link href="/library" className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/15 px-6 text-sm font-semibold text-white/70 transition-all hover:bg-white/8 hover:text-white hover:border-white/25">
                Browse Protocols
              </Link>
            </div>
            <div className="mt-10 flex gap-8">
              {[
                { value: "103+", label: "Protocols" },
                { value: "52", label: "Week Cycles" },
                { value: "PDF", label: "Export" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-black text-white">{stat.value}</p>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Mock schedule card */}
          <div className="hidden lg:flex items-center justify-center p-8 lg:p-12">
            <div className="w-full max-w-sm">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
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
                      <div className={`h-2.5 w-2.5 rounded-full ${item.active ? "bg-emerald-400 shadow-sm shadow-emerald-400/50" : "bg-slate-600"}`} />
                      <div className="flex flex-1 items-center justify-between rounded-lg bg-white/5 px-3 py-2.5">
                        <span className="text-xs font-medium text-slate-300">{item.week}</span>
                        <span className={`text-xs font-bold ${item.active ? "text-emerald-400" : "text-slate-500"}`}>{item.dose}</span>
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
          </div>
        </div>
      </div>
    </section>
  );
}
