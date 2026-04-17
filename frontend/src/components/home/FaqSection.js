import Link from "next/link";
import Accordion from "@/components/ui/Accordion";

const faqItems = [
  { title: "What is My Peptide Dosages?", content: "My Peptide Dosages (MyPeptideDosages) is a free, research-driven peptide dosage calculator and protocol planning platform. We compile data from thousands of articles, medical studies, and published research to provide accurate dosing schedules, reconstitution guides, and injection frequency charts for 100+ peptides." },
  { title: "Can I use this app as medical advice?", content: "No. My Peptide Dosages is purely educational and modeling software. It does not replace licensed, individualized medical supervision. Always consult a qualified healthcare professional for medical decisions." },
  { title: "How are dosage schedules generated?", content: "Schedules are statically modeled from known literature escalation tables. They utilize frequency parsing and rest-period rule engines to build timelines automatically based on published research protocols." },
  { title: "What happens when I override dosage calculation?", content: "Applying a manual override immediately forces the algorithm to suspend phase escalation, applying your fixed scalar settings universally across the entire schedule timeline." },
  { title: "Can I export these plans to share with my physician?", content: "Yes. All generated protocols and treatment calendars on My Peptide Dosages can be exported natively to PDF format or copied directly to your clipboard for easy sharing with healthcare providers." },
  { title: "How accurate is the reconstitution calculator?", content: "The My Peptide Dosages reconstitution calculator uses standard pharmaceutical math (concentration = amount / volume). Results are precise to three decimal places. Always verify calculations independently before use." },
  { title: "Is my data stored securely?", content: "All user data on My Peptide Dosages is encrypted in transit and at rest. We use industry-standard JWT authentication with automatic token refresh. Your schedules and protocols are private by default." },
  { title: "How do I find My Peptide Dosages online?", content: "You can visit us directly at mypeptidedosages.com or search for \"My Peptide Dosages\" in any search engine. Our platform offers completely free peptide dosage calculators, schedule builders, and a video library to support your peptide research." },
];

export { faqItems };

export default function FaqSection() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.title,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.content,
      },
    })),
  };

  return (
    <section className="mx-auto max-w-7xl px-0 sm:px-6 pb-16 sm:pb-20 w-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="grid lg:grid-cols-5 gap-8 sm:gap-10 lg:gap-16">

        {/* ── Left: Heading ── */}
        <div className="px-4 sm:px-0 lg:col-span-2">
          <div className="lg:sticky lg:top-40">

            {/* On mobile: compact inline header row */}
            <div className="flex flex-col sm:block">
              <h2 className="text-xs font-bold tracking-widest uppercase text-emerald-600 sm:text-sm">
                Support
              </h2>
              <h3 className="mt-1.5 sm:mt-2 text-2xl font-black text-slate-900 tracking-tight sm:text-3xl lg:text-4xl">
                Frequently Asked<br className="hidden sm:block" /> Questions
              </h3>

              {/* Description — hidden on mobile to keep it tight */}
              <p className="hidden sm:block mt-4 text-base text-slate-600 leading-relaxed">
                Everything you need to know about the platform, protocols, and how your data is handled.
              </p>

              <div className="mt-3 sm:mt-6">
                <Link
                  href="/community"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  Ask the community
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Accordion ── */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <Accordion items={faqItems} />
          </div>
        </div>

      </div>
    </section>
  );
}