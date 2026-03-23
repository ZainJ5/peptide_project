"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PageTransition from "@/components/shared/PageTransition";
import Accordion from "@/components/ui/Accordion";
import Button from "@/components/ui/Button";

const quickActions = [
  { title: "Browse by Health Concern", desc: "Filter peptides mapped to exact clinical applications.", href: "/library", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
  { title: "Create Custom Schedule", desc: "Generate a timeline with exact escalation protocols.", href: "/schedule", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { title: "Watch Video Library", desc: "Visual guides for safe reconstitution and administration.", href: "/videos", icon: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { title: "Community Forum", desc: "Engage with peers to share protocol outcomes.", href: "/community", icon: "M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" },
];

const popularCategories = ["Recovery", "Weight Loss", "Cognitive", "Sleep", "Inflammation", "Hormonal Support"];

const faqItems = [
  { title: "Can I use this app as medical advice?", content: "No. This application is purely educational and modeling software. It does not replace licensed, individualized medical supervision." },
  { title: "How are dosage schedules generated?", content: "Schedules are statically modeled from known literature escalation tables. They utilize frequency parsing and rest-period rule engines to build timelines automatically." },
  { title: "What happens when I override dosage calculation?", content: "Applying a manual override immediately forces the algorithm to suspend phase escalation, applying your fixed scalar settings universally." },
  { title: "Can I export these plans to share with my physician?", content: "Yes. All generated protocols and treatment calendars can be exported natively to PDF or copied directly to your clipboard." },
];

export default function HomePage() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const handleSearch = (event) => {
    event.preventDefault();
    router.push(`/library?search=${encodeURIComponent(search)}`);
  };

  return (
    <PageTransition>
      <div className="flex flex-col gap-24 sm:gap-32">
        {/* Massive Glassmorphic Hero */}
        <section className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 px-6 py-20 text-center shadow-2xl sm:py-32 isolate">
          {/* Animated Background Gradients */}
          <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
            <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
          </div>
          <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
            <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-(--color-primary) to-teal-400 opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"></div>
          </div>
          
          <div className="mx-auto max-w-4xl">
            <div className="hidden sm:mb-8 sm:flex sm:justify-center">
              <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-slate-300 ring-1 ring-white/20 hover:ring-white/40 transition">
                Version 2.0 Now Available with Intelligent Protocols.{' '}
                <Link href="/library" className="font-semibold text-white group"><span className="absolute inset-0" aria-hidden="true" />Read the docs <span aria-hidden="true" className="group-hover:translate-x-1 inline-block transition">&rarr;</span></Link>
              </div>
            </div>
            
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl leading-tight">
              Precision Peptide <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-(--color-primary)">Intelligence</span>
            </h1>
            <p className="mt-6 mx-auto max-w-2xl text-lg leading-8 text-slate-300">
              Build safer, clinical-grade peptide regimens with fully transparent dosage tables, intelligent tracking algorithms, and schedule automation pipelines.
            </p>
            
            <form onSubmit={handleSearch} className="mx-auto mt-10 max-w-xl">
              <div className="relative flex items-center shadow-xl rounded-2xl overflow-hidden bg-white/5 border border-white/10 ring-1 ring-white/20 hover:ring-white/40 focus-within:ring-white transition-all">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                   <svg className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                     <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                   </svg>
                </div>
                <input
                  type="text"
                  required
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search compounds or health concerns..."
                  className="w-full bg-transparent py-4 pl-12 pr-4 text-white placeholder-slate-400 focus:outline-none sm:text-lg"
                />
                <button type="submit" className="flex items-center gap-2 bg-(--color-primary) h-full px-6 py-4 font-bold text-white transition hover:bg-teal-500">
                  Search
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Feature Band */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 text-center max-w-3xl mx-auto">
            <h2 className="text-sm font-bold tracking-widest uppercase text-(--color-primary)">Platform Capabilities</h2>
            <h3 className="mt-2 text-3xl font-black text-slate-900 tracking-tight sm:text-4xl">Everything you need to orchestrate protocols safely</h3>
          </div>
          
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Link key={action.title} href={action.href} className="group relative rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-2xl hover:-translate-y-1 hover:border-slate-300">
                <div className="absolute top-0 left-0 w-full h-1 bg-(--color-primary) rounded-t-3xl opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-(--color-primary) group-hover:bg-(--color-primary) group-hover:text-white transition-colors">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={action.icon} />
                  </svg>
                </div>
                <h4 className="flex items-center justify-between text-lg font-bold text-slate-900 mb-2">
                  {action.title}
                  <span className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all font-bold text-(--color-primary)">&rarr;</span>
                </h4>
                <p className="text-sm text-slate-500 leading-relaxed">{action.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Categories Scroller */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 w-full">
           <div className="rounded-[2rem] bg-slate-50 border border-slate-200/60 px-6 py-12 sm:px-12 sm:py-16 grid lg:grid-cols-2 gap-10 items-center">
             <div>
                <h2 className="text-3xl font-black tracking-tight text-slate-900">Explore by Objective</h2>
                <p className="mt-4 text-lg text-slate-600 max-w-lg">Instantly locate protocols proven to target exact bio-mechanical outcomes.</p>
             </div>
             <div className="flex flex-wrap gap-3">
                {popularCategories.map((item) => (
                  <button
                    key={item}
                    onClick={() => router.push(`/library?category=${encodeURIComponent(item.toLowerCase())}`)}
                    className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm border border-slate-200 transition-all hover:bg-slate-900 hover:text-white hover:border-slate-900 hover:scale-105"
                  >
                    {item}
                  </button>
                ))}
             </div>
           </div>
        </section>

        {/* About & Disclaimer Integrated Sections */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 w-full grid md:grid-cols-2 gap-8">
          <div id="about" className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 shadow-sm relative overflow-hidden group hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-2xl font-black tracking-tight text-slate-900 mb-4 flex items-center gap-3 relative z-10">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-(--color-primary)/10 text-(--color-primary)">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </span>
              About the Platform
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4 relative z-10 text-sm sm:text-base font-medium">
              MyPeptidedosage is a data-driven peptide education and schedule planning ecosystem. We organize intricate protocol tables, escalation logic, and calendar outputs into a clinical-grade mathematical workflow that is fully transparent.
            </p>
          </div>

          <div id="disclaimer" className="rounded-3xl border border-red-100 bg-red-50/50 p-8 sm:p-10 shadow-sm relative overflow-hidden group hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-2xl font-black tracking-tight text-red-900 mb-4 flex items-center gap-3 relative z-10">
               <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100/80 text-red-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </span>
              Medical Disclaimer
            </h2>
            <div className="space-y-4 text-red-900/80 text-sm leading-relaxed relative z-10 font-medium">
              <p>The information presented within this application is mathematical modeling strictly for educational use. It does <strong className="font-bold text-red-900">not constitute medical advice</strong>, diagnosis, or treatment.</p>
              <p>Always consult a licensed healthcare professional before starting or modifying any peptide sequence. Do not delay emergency treatments based on timeline outputs.</p>
            </div>
          </div>
        </section>

        {/* Integrated FAQ */}
        <section className="mx-auto max-w-3xl px-4 sm:px-6 pb-20 w-full">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Frequently Asked Questions</h2>
            <p className="mt-4 text-slate-600">Core architectural parameters and safety guidelines for platform execution.</p>
          </div>
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-2">
            <Accordion items={faqItems} />
          </div>
        </section>
        
      </div>
    </PageTransition>
  );
}
