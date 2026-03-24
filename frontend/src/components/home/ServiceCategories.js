import Link from "next/link";

const categories = [
  {
    title: "Recovery & Healing",
    desc: "Tissue repair, wound recovery, and accelerated regeneration protocols.",
    icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
    href: "/library?category=recovery",
  },
  {
    title: "Weight Management",
    desc: "Fat metabolism, body composition optimization, and metabolic support.",
    icon: "M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3",
    href: "/library?category=weight",
  },
  {
    title: "Cognitive Performance",
    desc: "Mental clarity, focus enhancement, and neuroprotective compounds.",
    icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
    href: "/library?category=focus",
  },
  {
    title: "Sleep Optimization",
    desc: "Deep rest, circadian rhythm regulation, and sleep quality protocols.",
    icon: "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z",
    href: "/library?category=sleep",
  },
  {
    title: "Energy & Vitality",
    desc: "Endurance enhancement, cellular energy production, and stamina support.",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
    href: "/library?category=energy",
  },
  {
    title: "Joint & Mobility",
    desc: "Flexibility improvement, cartilage support, and mobility restoration.",
    icon: "M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11",
    href: "/library?category=joint",
  },
  {
    title: "Gut Health",
    desc: "Digestive wellness, microbiome balance, and intestinal repair protocols.",
    icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
    href: "/library?category=gut",
  },
  {
    title: "Hormonal Support",
    desc: "Endocrine balance, hormone optimization, and anti-inflammatory response.",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    href: "/library?category=inflammation",
  },
];

/* Checkerboard: row-index + col-index => even=tinted, odd=white */
function isGreen(index) {
  const row = Math.floor(index / 4);
  const col = index % 4;
  return (row + col) % 2 === 0;
}

export default function ServiceCategories() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 w-full">
      <div className="mb-10">
        <h2 className="text-sm font-bold tracking-widest uppercase text-emerald-600">Explore Categories</h2>
        <h3 className="mt-2 text-3xl font-black text-slate-900 tracking-tight sm:text-4xl">Find Your Protocol</h3>
        <p className="mt-3 text-base text-slate-500 max-w-lg">Browse peptide protocols organized by health objective. Each category contains research-backed dosing schedules.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {categories.map((cat, index) => {
          const green = isGreen(index);
          return (
            <Link
              key={cat.title}
              href={cat.href}
              className={`group relative rounded-2xl p-6 sm:p-7 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl border ${
                green
                  ? "bg-emerald-50/50 border-transparent hover:border-emerald-200 hover:shadow-emerald-100/60"
                  : "bg-white border-transparent hover:border-slate-200 hover:shadow-slate-200/60"
              }`}
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
            >
              {/* Icon */}
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl mb-5 transition-all duration-300 group-hover:scale-105 group-hover:rotate-3 ${
                green
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25"
                  : "bg-slate-800 text-white shadow-md shadow-slate-800/25"
              }`}>
                <svg className="h-5.5 w-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d={cat.icon} />
                </svg>
              </div>

              {/* Content */}
              <h3 className="text-[15px] font-bold text-slate-900 mb-1.5">{cat.title}</h3>
              <p className="text-[13px] text-slate-500 leading-relaxed mb-5">{cat.desc}</p>

              {/* Arrow */}
              <div className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-400 transition-all duration-300 group-hover:text-emerald-600 group-hover:gap-2.5">
                View protocols
                <svg className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
