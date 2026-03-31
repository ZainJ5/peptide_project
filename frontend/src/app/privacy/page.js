"use client";

import Link from "next/link";
import PageTransition from "@/components/shared/PageTransition";

const sections = [
  {
    title: "INFORMATIONAL PURPOSE ONLY",
    content:
      "This Website is provided solely for educational and informational purposes related to peptide dosages. We do not sell products or services on this site, and there is no financial transaction or payment system here.",
  },
  {
    title: "INFORMATION WE COLLECT",
    content: (
      <>
        <p>
          We do not actively collect personal information from visitors except in the following case:
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-6">
          <li>
            <strong className="font-semibold text-slate-700">Request a Dosage Protocol:</strong>{" "}
            When you request a dosage protocol, we may ask for a minimal amount of information (such as your email address) so we can respond to your request.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "HOW WE USE YOUR INFORMATION",
    content: (
      <>
        <p>
          Any information collected when you request a dosage protocol is used solely to:
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-6">
          <li>Respond to your dosage protocol inquiry</li>
          <li>Provide relevant research-based information</li>
          <li>
            Improve user experience on the Website (e.g., if multiple requests suggest a topic is unclear, we may update our articles)
          </li>
        </ul>
        <p className="mt-4">
          We do not sell, rent, or otherwise disclose your personal information to third parties.
        </p>
      </>
    ),
  },
  {
    title: "COOKIES AND ANALYTICS",
    content:
      "Our Website may use cookies or similar technologies to enhance user experience and analyze site traffic. These cookies do not identify you personally. You may disable cookies in your browser settings, though certain features of the site may not function properly if you do so.",
  },
  {
    title: "DATA SECURITY",
    content:
      "We take appropriate measures to help protect any information we may collect. However, no security measures are perfect or impenetrable, and we cannot guarantee the security of your information.",
  },
  {
    title: "EXTERNAL LINKS",
    content:
      "Our Website may contain links to external sites that we do not operate. If you click on a third-party link, you will be directed to that third party's site. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party websites or services.",
  },
  {
    title: "CHILDREN'S PRIVACY",
    content:
      "This Website is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from children under 18. If you are under 18, please do not submit any information via our request forms.",
  },
  {
    title: "UPDATES TO THIS POLICY",
    content:
      'We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated "Last updated" date.',
  },
  {
    title: "CONTACT US",
    content: (
      <>
        If you have any questions or concerns about this Privacy Policy or the information we collect, please contact us at{" "}
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

export default function PrivacyPolicyPage() {
  return (
    <PageTransition>
      <div className="mx-auto  pb-10 pt-2">
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
            Privacy Policy
          </h1>
        </div>

        {/* Intro */}
        <div className="border-b border-emerald-400 py-8">
          <p className="text-sm leading-relaxed text-slate-500">
            Last updated: March 24, 2026
          </p>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            Welcome to Mypeptidedosages (the &quot;Website&quot;). We take your privacy seriously and strive to protect any personal information you provide to us. This Privacy Policy outlines how we collect, use, and safeguard your information.
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
            Thank you for visiting Mypeptidedosages! Your privacy is important to us.
          </p>
          <div className="mt-5 flex items-center justify-center gap-4">
            <Link
              href="/terms"
              className="text-sm font-medium text-emerald-600 underline underline-offset-2 transition-colors hover:text-emerald-700"
            >
              Terms &amp; Conditions
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
