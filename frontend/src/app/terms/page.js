"use client";

import Link from "next/link";
import PageTransition from "@/components/shared/PageTransition";

const sections = [
  {
    title: "INFORMATIONAL NATURE OF THE WEBSITE",
    content:
      "Mypeptidedosages provides educational and informational content about peptide dosages, research protocols, and related topics. We do not sell products or services, and the information presented is not intended to replace professional medical advice or treatment.",
  },
  {
    title: "NO MEDICAL OR PROFESSIONAL ADVICE",
    content:
      "The content on this Website is provided for general informational and research purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the guidance of a qualified healthcare provider with any questions you may have regarding a medical condition or treatment plan.",
  },
  {
    title: "INTELLECTUAL PROPERTY",
    content:
      "All materials on the Website, including text, graphics, logos, and images, are the property of Mypeptidedosages or its content suppliers and are protected by applicable intellectual property laws. You may not reproduce, distribute, modify, or create derivative works of any materials from this Website without our express written permission.",
  },
  {
    title: "USER RESPONSIBILITIES",
    content: (
      <>
        <p>When you use this Website, you agree:</p>
        <ul className="mt-4 list-disc space-y-2 pl-6">
          <li>To use the content solely for personal, non-commercial, informational purposes</li>
          <li>Not to engage in any activity that disrupts or interferes with the Website&apos;s performance or security</li>
          <li>To comply with all applicable laws and regulations while using our Website</li>
        </ul>
      </>
    ),
  },
  {
    title: "REQUESTING A DOSAGE PROTOCOL",
    content: (
      <>
        <p>
          Our Website allows you to request a dosage protocol at no cost. By submitting a request, you agree to provide accurate, current, and complete information. We reserve the right to decline any request for any reason.
        </p>
        <p className="mt-4">
          We do not guarantee the accuracy, completeness, or suitability of the dosage protocol for your specific needs. You assume any risks associated with using the information you receive from us.
        </p>
      </>
    ),
  },
  {
    title: "DISCLAIMER OF WARRANTIES",
    content:
      'The Website is provided on an "as is" and "as available" basis. We make no warranties or representations of any kind, express or implied, about the completeness, accuracy, reliability, suitability, or availability of the Website or the information contained on it. You understand and agree that you use the Website at your own risk.',
  },
  {
    title: "LIMITATION OF LIABILITY",
    content:
      "Under no circumstances shall Mypeptidedosages, its affiliates, contributors, or employees be liable for any direct, indirect, incidental, special, or consequential damages arising from or in connection with your use of the Website or reliance on any information provided on the Website.",
  },
  {
    title: "EXTERNAL LINKS",
    content:
      "The Website may contain links to external sites or resources operated by third parties. These links are provided for your convenience only. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party websites.",
  },
  {
    title: "CHANGES TO THESE TERMS",
    content:
      "We may update or modify these Terms at any time. Any changes will be effective immediately upon posting the revised Terms on this page. By continuing to use the Website after such updates or modifications, you agree to be bound by the revised Terms.",
  },
  {
    title: "GOVERNING LAW",
    content:
      "These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Mypeptidedosages operates, without regard to its conflict of law provisions.",
  },
  {
    title: "CONTACT US",
    content: (
      <>
        If you have any questions or concerns regarding these Terms &amp; Conditions, please contact us at{" "}
        <a
          href="mailto:info@mypeptidedosages.com"
          className="font-medium text-blue-600 underline underline-offset-2 transition-colors hover:text-blue-700"
        >
          info@mypeptidedosages.com
        </a>
        .
      </>
    ),
  },
];

export default function TermsOfServicePage() {
  return (
    <PageTransition>
      <div className="mx-auto pb-10 pt-2">
        {/* Page Header */}
        <div className="mb-2">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700"
          >
            <svg className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Home
          </Link>
        </div>

        {/* Title Bar */}
        <div className="mt-6 border-b-[3px] border-slate-900 pb-4">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Terms and Conditions
          </h1>
        </div>

        {/* Intro */}
        <div className="border-b border-emerald-400 py-8">
          <p className="text-sm leading-relaxed text-slate-500">
            Last updated: March 24, 2026
          </p>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            Welcome to Mypeptidedosages (the &quot;Website&quot;). These Terms &amp; Conditions (the &quot;Terms&quot;) govern your access to and use of our Website. By using our Website, you agree to be bound by these Terms.
          </p>
        </div>

        {/* Sections */}
        <div>
          {sections.map((section, i) => (
            <div key={i} className="border-b border-emerald-400 py-10">
              <h2 className="mb-5 text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                {section.title}
              </h2>
              <div className="text-base leading-relaxed text-slate-600">
                {typeof section.content === "string" ? (
                  <p>{section.content}</p>
                ) : (
                  section.content
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Closing */}
        <div className="pt-10 text-center">
          <p className="text-base font-medium text-slate-700">
            Your continued use of Mypeptidedosages indicates that you accept and agree to abide by these Terms &amp; Conditions.
          </p>
          <div className="mt-5 flex items-center justify-center gap-4">
            <Link
              href="/privacy"
              className="text-sm font-medium text-emerald-600 underline underline-offset-2 transition-colors hover:text-emerald-700"
            >
              Privacy Policy
            </Link>
            <span className="text-slate-300">|</span>
            <a
              href="mailto:info@mypeptidedosages.com"
              className="text-sm font-medium text-emerald-600 underline underline-offset-2 transition-colors hover:text-emerald-700"
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
