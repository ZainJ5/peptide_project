"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { apiRequest } from "@/lib/api";

/* ─── Premium SVG Social Icons ─── */
const SocialIcon = ({ children, href, label, gradient }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className={`group relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${gradient}`}
    aria-label={label}
  >
    {children}
  </a>
);

const XTwitterIcon = () => (
  <svg className="h-4 w-4 transition-colors duration-300 group-hover:text-white" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const FacebookIcon = () => (
  <svg className="h-4 w-4 transition-colors duration-300 group-hover:text-white" viewBox="0 0 24 24" fill="currentColor">
    <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 1.09.07 1.373.14V7.94a8 8 0 0 0-.732-.034c-1.04 0-1.44.393-1.44 1.414v1.724h2.076l-.357 3.667h-1.72v8.06a10 10 0 1 0-4.058-.08z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg className="h-4 w-4 transition-colors duration-300 group-hover:text-white" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const YouTubeIcon = () => (
  <svg className="h-4 w-4 transition-colors duration-300 group-hover:text-white" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const InstagramIcon = () => (
  <svg className="h-4 w-4 transition-colors duration-300 group-hover:text-white" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
  </svg>
);

export default function Footer() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribeError, setSubscribeError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsSubmitting(true);
    setSubscribeError("");
    try {
      await apiRequest("/newsletter/subscribe", { method: "POST", body: { email } });
      setIsSubscribed(true);
      setEmail("");
      setTimeout(() => setIsSubscribed(false), 5000);
    } catch (err) {
      setSubscribeError(err?.message || "Subscription failed. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
      <footer aria-label="Site footer" className="relative md:mt-16 mt-2 w-full overflow-hidden bg-slate-900 text-slate-300">
        {/* Subtle top accent line */}
        <div className="h-[2px] w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500" />

        {/* ─── Main Footer Grid ─── */}
        <div className="mx-auto max-w-7xl px-6 pb-10 pt-14 lg:px-8">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
            {/* Brand Column */}
            <div className="sm:col-span-2 lg:col-span-4">
              <Link href="/" className="inline-flex items-center gap-3 group">
                <div className="relative">
                  <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 opacity-0 blur transition-opacity duration-300 group-hover:opacity-100" />
                  <Image
                    src="/logo.png"
                    alt="MyPeptideDosages logo"
                    width={48}
                    height={48}
                    className="relative h-11 w-11 rounded-xl border border-slate-700 bg-white object-contain p-1.5"
                  />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-emerald-400">
                    Research Platform
                  </p>
                  <p className="text-lg font-bold text-white">MyPeptideDosages</p>
                </div>
              </Link>

              <p className="mt-5 max-w-xs text-sm leading-relaxed text-slate-400">
                Your trusted platform for accurate peptide dosage research and protocol planning. Simplifying complex data with confidence and clarity.
              </p>

              {/* Social Icons */}
              <div className="mt-6 flex items-center gap-2.5">
                <SocialIcon href="#" label="X (Twitter)" gradient="hover:border-white/20 hover:bg-white/10 hover:text-white">
                  <XTwitterIcon />
                </SocialIcon>
                <SocialIcon href="#" label="Facebook" gradient="hover:border-blue-400/30 hover:bg-blue-500/10 hover:text-blue-400">
                  <FacebookIcon />
                </SocialIcon>
                <SocialIcon href="#" label="LinkedIn" gradient="hover:border-blue-500/30 hover:bg-blue-600/10 hover:text-blue-400">
                  <LinkedInIcon />
                </SocialIcon>
                <SocialIcon href="#" label="YouTube" gradient="hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-400">
                  <YouTubeIcon />
                </SocialIcon>
                <SocialIcon href="#" label="Instagram" gradient="hover:border-pink-400/30 hover:bg-pink-500/10 hover:text-pink-400">
                  <InstagramIcon />
                </SocialIcon>
              </div>
            </div>

            {/* Platform Links */}
            <div className="lg:col-span-2">
              <h4 style={{color: "white"}} className="mb-5 text-lg font-bold text-white">
                Platform
              </h4>
              <ul className="space-y-3">
                {[
                  { href: "/", label: "Home" },
                  { href: "/library", label: "Peptide Library" },
                  { href: "/schedule", label: "Schedule Builder" },
                  { href: "/videos", label: "Video Library" },
                  { href: "/community", label: "Community" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 transition-colors duration-200 hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Account Links */}
            <div className="lg:col-span-2">
              <h4 style={{color: "white"}} className="mb-5 text-lg font-bold text-white">
                Account
              </h4>
              <ul className="space-y-3">
                {[
                  { href: "/login", label: "Sign In" },
                  { href: "/signup", label: "Create Account" },
                ].map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-slate-400 transition-colors duration-200 hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      if (user) {
                        window.dispatchEvent(new CustomEvent("open-request-protocol"));
                      } else {
                        router.push("/login");
                      }
                    }}
                    className="text-sm text-slate-400 transition-colors duration-200 hover:text-white cursor-pointer bg-transparent border-none p-0"
                  >
                    Request a Protocol
                  </button>
                </li>
                <li>
                  <a
                    href={`mailto:${['info', 'mypeptidedosages.com'].join('@')}`}
                    className="text-sm text-slate-400 transition-colors duration-200 hover:text-white"
                  >
                    Send Feedback
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal Links */}
            <div className="lg:col-span-2">
              <h4 style={{color: "white"}} className="mb-5 text-lg font-bold text-white">
                Legal
              </h4>
              <ul className="space-y-3">
                {[
                  { href: "/privacy", label: "Privacy Policy" },
                  { href: "/terms", label: "Terms of Service" },
                ].map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-slate-400 transition-colors duration-200 hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <a
                    href={`mailto:${['info', 'mypeptidedosages.com'].join('@')}`}
                    className="text-sm text-slate-400 transition-colors duration-200 hover:text-white"
                  >
                    Contact Support
                  </a>
                </li>
              </ul>
            </div>

            {/* Newsletter Subscribe */}
            <div className="sm:col-span-2 lg:col-span-2">
              <h4 style={{color: "white"}} className="mb-5 text-lg font-bold text-white">
                Stay Updated
              </h4>
              <p className="text-[13px] leading-relaxed text-slate-400">
                Peptide insights delivered monthly.
              </p>

              <div className="mt-4">
                {isSubscribed ? (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-medium text-emerald-300">
                    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Subscribed!
                  </div>
                ) : (
                  <form onSubmit={handleSubscribe} className="space-y-2.5">
<div className="relative flex items-center w-full md:w-[120%] rounded-full border border-slate-600 bg-slate-800 transition-all duration-200 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500/30">                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Your email address"
                        aria-label="Email address for newsletter"
                        disabled={isSubmitting}
                        className="h-11 w-full rounded-full bg-transparent pl-4 pr-12 text-sm text-white outline-none placeholder:text-slate-500"
                      />
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="absolute right-1 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white transition-all duration-200 hover:bg-emerald-400 active:scale-95 disabled:opacity-50"
                        aria-label="Subscribe"
                      >
                        {isSubmitting ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        ) : (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {subscribeError && (
                      <p className="text-[11px] text-red-400">{subscribeError}</p>
                    )}
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Popular Protocols — SEO internal links */}
          <div className="mt-10 border-t border-slate-800 pt-8">
            <h4 style={{color: "white"}} className="mb-4 text-sm font-bold text-white uppercase tracking-wider">
              Popular Peptide Dosage Protocols
            </h4>
            <div className="flex flex-wrap gap-2">
              {[
                "BPC-157", "Semaglutide", "TB-500", "CJC-1295", "Ipamorelin",
                "GHK-Cu", "AOD-9604", "Sermorelin", "Tesamorelin", "MK-677",
                "PT-141", "Selank", "Semax", "Thymosin Beta-4", "DSIP",
                "Epithalon", "Kisspeptin", "Oxytocin", "Melanotan II", "NAD+",
              ].map((name) => (
                <Link
                  key={name}
                  href={`/library?search=${encodeURIComponent(name)}`}
                  className="rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-400 transition-colors duration-200 hover:border-emerald-500/40 hover:text-emerald-300"
                >
                  {name} Dosage
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Disclaimer — Inside footer, amber/yellow box ─── */}
        <div className="border-t border-slate-800">
          <div className="mx-auto max-w-7xl md:px-6 px-2 md:py-5 py-2 lg:px-8">
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 md:px-5 md:py-4 px-2 py-2">
              <svg className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <p className="text-xs leading-relaxed text-amber-200/80">
                <span className="font-bold text-amber-300">Disclaimer:</span> Content on MyPeptideDosages is provided for educational and research-awareness purposes only and does not constitute medical advice, diagnosis, or treatment. Always consult a licensed healthcare professional before starting, stopping, or modifying any peptide-related protocol.
              </p>
            </div>
          </div>
        </div>

        {/* ─── Bottom Bar ─── */}
        <div className="border-t border-slate-800">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-5 md:flex-row lg:px-8">
            <p className="text-xs text-slate-500">
              &copy; {currentYear} MyPeptideDosages. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-xs text-slate-500 transition-colors hover:text-slate-300">
                Privacy
              </Link>
              <Link href="/terms" className="text-xs text-slate-500 transition-colors hover:text-slate-300">
                Terms
              </Link>
              <a href={`mailto:${['support', 'mypeptidedosages.com'].join('@')}`} className="text-xs text-slate-500 transition-colors hover:text-slate-300">
                Contact
              </a>
            </div>
            <p className="text-xs text-slate-600">
              Built for precise peptide education and dosage planning.
            </p>
          </div>
        </div>
      </footer>
  );
}
