import Link from "next/link";

export default function AboutSection() {
  return (
    <section id="about" className="mx-auto max-w-7xl px-0 sm:px-6 w-full">
      <div className="mb-5 px-4 sm:px-0">
        <h2 className="text-xs font-bold tracking-widest uppercase text-emerald-600 sm:text-sm">About Us</h2>
      </div>

      <div className="grid lg:grid-cols-5 gap-10 lg:gap-16 items-start">
        {/* Left — Heading */}
        <div className="px-4 sm:px-0 lg:col-span-2">
          <h3 className="text-3xl font-black text-slate-900 tracking-tight sm:text-4xl leading-[1.15]">
            Your {" "}
            <span className="text-emerald-600">Peptide Protocol</span>{" "}
            Platform
          </h3>
        </div>

        {/* Right — Description */}
        <div className="px-4 sm:px-0 lg:col-span-3">
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            My Peptide Dosages is a data-driven peptide education and schedule planning ecosystem. We have used 1000&apos;s of articles and videos, 100&apos;s medical research studies, and other research methods to determine the best starting points for researchers to begin working with peptides.
          </p>
          <p className="mt-4 text-sm sm:text-base text-slate-500 leading-relaxed">
            Use our free <Link href="/library" className="text-emerald-600 hover:underline">peptide dosage calculator</Link> to find accurate reconstitution volumes, injection frequencies, and cycle schedules for BPC-157, Semaglutide, TB-500, CJC-1295, Ipamorelin, and 100+ research peptides. Build personalized <Link href="/schedule" className="text-emerald-600 hover:underline">peptide dosing schedules</Link> with PDF export.
          </p>
          <div className="mt-6 flex items-center gap-6">
            <Link href="/library" className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors group">
              Explore Library
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link href="/schedule" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors group">
              Build a Schedule
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
