import Link from "next/link";
import Accordion from "@/components/ui/Accordion";

const faqItems = [
  { title: "Can I use this app as medical advice?", content: "No. This application is purely educational and modeling software. It does not replace licensed, individualized medical supervision. Always consult a qualified healthcare professional for medical decisions." },
  { title: "How are dosage schedules generated?", content: "Schedules are statically modeled from known literature escalation tables. They utilize frequency parsing and rest-period rule engines to build timelines automatically based on published research protocols." },
  { title: "What happens when I override dosage calculation?", content: "Applying a manual override immediately forces the algorithm to suspend phase escalation, applying your fixed scalar settings universally across the entire schedule timeline." },
  { title: "Can I export these plans to share with my physician?", content: "Yes. All generated protocols and treatment calendars can be exported natively to PDF format or copied directly to your clipboard for easy sharing with healthcare providers." },
  { title: "How accurate is the reconstitution calculator?", content: "The calculator uses standard pharmaceutical math (concentration = amount / volume). Results are precise to three decimal places. Always verify calculations independently before use." },
  { title: "Is my data stored securely?", content: "All user data is encrypted in transit and at rest. We use industry-standard JWT authentication with automatic token refresh. Your schedules and protocols are private by default." },
];

export default function FaqSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-20 w-full">
      <div className="grid lg:grid-cols-5 gap-10 lg:gap-16">
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-40">
            <h2 className="text-sm font-bold tracking-widest uppercase text-emerald-600">Support</h2>
            <h3 className="mt-2 text-3xl font-black text-slate-900 tracking-tight sm:text-4xl">Frequently Asked Questions</h3>
            <p className="mt-4 text-base text-slate-600 leading-relaxed">Everything you need to know about the platform, protocols, and how your data is handled.</p>
            <div className="mt-6">
              <Link href="/community" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                Ask the community
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <Accordion items={faqItems} />
          </div>
        </div>
      </div>
    </section>
  );
}
