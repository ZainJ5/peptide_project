"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setIsSubscribed(true);
      setEmail("");
      setTimeout(() => setIsSubscribed(false), 4000);
    }
  };

  return (
    <>
      <footer className="mt-16 w-full border-t border-slate-200 bg-slate-900 text-slate-300">
        <div className="mx-auto max-w-7xl px-4 py-14 md:px-6">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <Link href="/" className="inline-flex items-center gap-3">
                <Image
                  src="/logo.png"
                  alt="MyPeptideDosage logo"
                  width={56}
                  height={56}
                  className="h-12 w-12 rounded-xl border border-slate-700 bg-white object-contain p-1"
                />
                <div>
                  <p className="text-xs font-medium text-slate-400">Research Platform</p>
                  <p className="text-xl font-bold text-white">MyPeptideDosage</p>
                </div>
              </Link>

              <p className="mt-5 max-w-sm text-sm leading-relaxed text-slate-300">
                Your go to platform for accurate peptide dosage and research knowledge.
                Designed to simplify complex protocols with confidence and clarity
              </p>

              <div className="mt-6 flex items-center gap-3">
                <a
                  href="#"
                  className="group flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/90 text-slate-200 shadow-lg shadow-black/10 transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-400 hover:bg-linear-to-br hover:from-sky-500 hover:to-blue-600 hover:text-white hover:shadow-sky-900/40"
                  aria-label="Facebook"
                >
                  <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13.25 21V13.35H15.85L16.25 10.35H13.25V8.45C13.25 7.58 13.49 6.99 14.74 6.99H16.35V4.31C15.57 4.21 14.79 4.16 14 4.16C11.69 4.16 10.1 5.56 10.1 8.12V10.35H7.75V13.35H10.1V21H13.25Z" fill="currentColor"/>
                  </svg>
                </a>
                <a
                  href="#"
                  className="group flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/90 text-slate-200 shadow-lg shadow-black/10 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-400 hover:bg-linear-to-br hover:from-blue-600 hover:to-indigo-700 hover:text-white hover:shadow-blue-900/40"
                  aria-label="LinkedIn"
                >
                  <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6.22 8.46C5.2 8.46 4.38 7.63 4.38 6.62C4.38 5.6 5.2 4.78 6.22 4.78C7.24 4.78 8.06 5.6 8.06 6.62C8.06 7.63 7.24 8.46 6.22 8.46ZM4.72 19.5V10.02H7.73V19.5H4.72ZM10.09 19.5V10.02H12.98V11.31H13.02C13.42 10.55 14.4 9.75 15.86 9.75C18.89 9.75 19.45 11.74 19.45 14.33V19.5H16.43V14.91C16.43 13.81 16.41 12.4 14.91 12.4C13.38 12.4 13.14 13.59 13.14 14.83V19.5H10.09Z" fill="currentColor"/>
                  </svg>
                </a>
                <a
                  href="#"
                  className="group flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/90 text-slate-200 shadow-lg shadow-black/10 transition-all duration-200 hover:-translate-y-0.5 hover:border-red-400 hover:bg-linear-to-br hover:from-red-500 hover:to-rose-600 hover:text-white hover:shadow-red-900/40"
                  aria-label="YouTube"
                >
                  <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.73 8.13C20.53 7.36 19.93 6.76 19.17 6.55C17.8 6.18 12 6.18 12 6.18C12 6.18 6.2 6.18 4.83 6.55C4.07 6.76 3.47 7.36 3.27 8.13C2.9 9.49 2.9 12.32 2.9 12.32C2.9 12.32 2.9 15.15 3.27 16.51C3.47 17.28 4.07 17.88 4.83 18.09C6.2 18.46 12 18.46 12 18.46C12 18.46 17.8 18.46 19.17 18.09C19.93 17.88 20.53 17.28 20.73 16.51C21.1 15.15 21.1 12.32 21.1 12.32C21.1 12.32 21.1 9.49 20.73 8.13Z" fill="currentColor"/>
                    <path d="M10.28 15.25L15.1 12.32L10.28 9.4V15.25Z" fill="#0F172A" className="group-hover:fill-white"/>
                  </svg>
                </a>
              </div>
            </div>

            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold text-white">Platform</h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li><Link href="/" className="transition-colors hover:text-white">Home</Link></li>
                <li><Link href="/library" className="transition-colors hover:text-white">Peptide Library</Link></li>
                <li><Link href="/schedule" className="transition-colors hover:text-white">Schedule Builder</Link></li>
                <li><Link href="/videos" className="transition-colors hover:text-white">Videos Library</Link></li>
                <li><Link href="/community" className="transition-colors hover:text-white">Community</Link></li>
              </ul>
            </div>

            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold text-white">Navigate</h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li><Link href="/login" className="transition-colors hover:text-white">Sign In</Link></li>
                <li><Link href="/signup" className="transition-colors hover:text-white">Create Account</Link></li>
                <li><Link href="/community?type=request-peptide" className="transition-colors hover:text-white">Request a Peptide</Link></li>
                <li><a href="mailto:feedback@mypeptidedosage.com" className="transition-colors hover:text-white">Feedback</a></li>
              </ul>
            </div>

            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold text-white">Support</h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li><Link href="/privacy" className="transition-colors hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="transition-colors hover:text-white">Terms of Service</Link></li>
                <li><a href="mailto:support@mypeptidedosage.com" className="transition-colors hover:text-white">Contact Support</a></li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-700 bg-slate-800/70 p-5 lg:col-span-2">
              <h3 className="text-lg font-semibold text-white">Contact</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Reach our research support team for protocol and platform guidance.
              </p>
              <a
                href="mailto:support@mypeptidedosage.com"
                className="mt-4 inline-flex items-center text-sm font-medium text-slate-200 transition-colors hover:text-white"
              >
                support@mypeptidedosage.com
              </a>
              <p className="mt-2 text-xs text-slate-500">Mon–Fri, 9:00 AM – 6:00 PM</p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-700 bg-slate-900/95">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 lg:flex-row lg:items-center lg:justify-between md:px-6">
            <div>
              <p className="text-sm font-semibold text-white">Get peptide insights in your inbox</p>
              <p className="text-xs text-slate-400">Monthly updates on dosage protocols, safety notes, and platform improvements.</p>
            </div>

            {isSubscribed ? (
              <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300">
                Subscribed successfully.
              </p>
            ) : (
              <form onSubmit={handleSubscribe} className="flex w-full max-w-xl items-center gap-2 md:gap-3">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="h-11 flex-1 rounded-xl border border-slate-600 bg-slate-950 px-4 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-(--color-accent)"
                />
                <button
                  type="submit"
                  className="h-11 rounded-xl bg-(--color-accent) px-5 text-sm font-semibold whitespace-nowrap text-white shadow-lg shadow-(--color-accent)/20 transition-all hover:-translate-y-px hover:bg-(--color-accent)"
                >
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="border-t border-slate-700">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 text-xs text-slate-400 md:flex-row md:items-center md:justify-between md:px-6">
            <p>© {new Date().getFullYear()} MyPeptideDosage. All rights reserved.</p>
            <p>Built for precise peptide education and dosage planning.</p>
          </div>
        </div>

        <div className="border-t border-slate-700 bg-slate-100/95">
          <div className="mx-auto max-w-7xl px-4 py-3 text-center text-sm leading-relaxed text-red-700 md:px-6">
            Disclaimer: Content on MyPeptideDosage is provided for educational and research-awareness purposes only and does not constitute medical advice, diagnosis, or treatment. Always consult a licensed healthcare professional before starting, stopping, or modifying any peptide-related protocol.
          </div>
        </div>
      </footer>
    </>
  );
}