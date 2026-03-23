"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { apiRequest } from "@/lib/api";
import Button from "@/components/ui/Button";

const links = [
  { href: "/library", label: "Peptide Library" },
  { href: "/schedule", label: "Schedule Builder" },
  { href: "/videos", label: "Videos Library" },
  { href: "/community", label: "Community" },
];

export default function Navbar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [requestSuccess, setRequestSuccess] = useState("");
  const [requestForm, setRequestForm] = useState({ peptideName: "", goal: "", details: "" });
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = user
    ? (user.firstName ? user.firstName[0] : user.email[0]).toUpperCase()
    : "";

  const displayName = user
    ? user.firstName
      ? `${user.firstName} ${user.lastName || ""}`.trim()
      : user.email.split("@")[0]
    : "";

  const requestLabel = user ? "Request a Peptide" : "Sign in to Request Peptide";

  const handleRequestSubmit = async (event) => {
    event.preventDefault();
    setRequestError("");
    setRequestSuccess("");
    setSubmitting(true);

    try {
      const response = await apiRequest("/community/request-peptide", {
        method: "POST",
        body: requestForm,
        token,
        refreshToken,
        onRefresh: (payload) => {
          setAuth({ token: payload.token, refreshToken: payload.refreshToken, user: payload.user });
        },
      });

      setRequestSuccess(response?.message || "Request submitted successfully.");
      setRequestForm({ peptideName: "", goal: "", details: "" });
      setTimeout(() => {
        setRequestOpen(false);
        setRequestSuccess("");
      }, 1200);
    } catch (error) {
      if (error?.status === 401) {
        clearAuth();
      }
      setRequestError(error?.message || "Unable to submit request right now.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
          <div className="flex flex-wrap items-center gap-3 py-3 md:flex-nowrap md:gap-4">
            <Link
              href="/"
              className="group flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-90"
            >
              <Image
                src="/logo.png"
                alt="MyPeptideDosage logo"
                width={44}
                height={44}
                className="h-10 w-10 rounded-xl border border-slate-200 bg-white object-contain p-1"
                priority
              />
              <div className="leading-tight">
                <p className="text-[11px] font-semibold text-slate-500">Research &amp; Protocol Platform</p>
                <p className="text-base font-extrabold tracking-tight text-slate-900 sm:text-lg">MyPeptideDosage</p>
              </div>
            </Link>

            <div className="relative order-3 w-full md:order-0 md:flex-1">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
              <input
                type="search"
                placeholder="Search for peptides, protocols, and schedules"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-(--color-primary)/30 focus:bg-white focus:ring-2 focus:ring-(--color-primary)/10"
              />
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
              <a
                href="https://example.com/download-app"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:block"
              >
                <Button variant="secondary" className="h-10 rounded-xl border-slate-300 px-4 font-semibold text-slate-700">
                  Download App
                </Button>
              </a>

              {user ? (
                <button
                  type="button"
                  onClick={() => {
                    setRequestError("");
                    setRequestSuccess("");
                    setRequestOpen(true);
                  }}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-(--color-accent) px-4 text-sm font-semibold whitespace-nowrap text-white shadow-lg shadow-(--color-accent)/20 transition-all hover:-translate-y-px hover:bg-(--color-accent)"
                >
                  {requestLabel}
                </button>
              ) : (
                <Link href="/login">
                  <Button className="h-10 rounded-xl bg-(--color-accent) px-4 font-semibold whitespace-nowrap text-white shadow-lg shadow-(--color-accent)/20 hover:-translate-y-px hover:bg-(--color-accent)">
                    {requestLabel}
                  </Button>
                </Link>
              )}

              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm"
                  >
                    <div className="hidden min-w-0 text-left sm:block">
                      <p className="max-w-28 truncate text-[13px] leading-4 font-semibold text-slate-800">
                        {displayName}
                      </p>
                      <p className="max-w-28 truncate text-[11px] leading-4 text-slate-500">Account</p>
                    </div>
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-(--color-primary) to-sky-600 text-[11px] font-bold text-white">
                      {initials}
                    </span>
                    <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 top-full z-50 mt-2 w-60 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
                        <div className="border-b border-slate-100 px-4 py-3">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {user.firstName
                              ? `${user.firstName} ${user.lastName || ""}`
                              : "User"}
                          </p>
                          <p className="truncate text-xs text-slate-500">{user.email}</p>
                        </div>

                        <div className="p-2">
                          <button
                            onClick={() => {
                              clearAuth();
                              setDropdownOpen(false);
                            }}
                            className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sign out
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden items-center gap-2 sm:flex">
                  <Link href="/login" className="hidden sm:block">
                    <Button variant="ghost" className="cursor-pointer rounded-lg font-semibold text-slate-600 hover:text-slate-900">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button className="cursor-pointer rounded-full px-5 font-semibold shadow-md shadow-(--color-primary)/20 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          <nav className="hidden items-center justify-center gap-1 border-t border-slate-200/80 py-2 md:flex">
            {links.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition-all duration-200 ${
                    active
                      ? "bg-(--color-primary)/10 text-(--color-primary)"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {requestOpen && user && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Request a Peptide</h3>
                <p className="text-xs text-slate-500">Submit a research request for admin review.</p>
              </div>
              <button
                type="button"
                onClick={() => setRequestOpen(false)}
                className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close request form"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleRequestSubmit} className="space-y-4 px-5 py-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Peptide Name</label>
                <input
                  value={requestForm.peptideName}
                  onChange={(e) => setRequestForm((prev) => ({ ...prev, peptideName: e.target.value }))}
                  required
                  minLength={2}
                  maxLength={120}
                  placeholder="Example: BPC-157"
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-(--color-primary)/40 focus:ring-2 focus:ring-(--color-primary)/10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Goal</label>
                <input
                  value={requestForm.goal}
                  onChange={(e) => setRequestForm((prev) => ({ ...prev, goal: e.target.value }))}
                  required
                  minLength={5}
                  maxLength={300}
                  placeholder="What are you trying to research or achieve?"
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-(--color-primary)/40 focus:ring-2 focus:ring-(--color-primary)/10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Details</label>
                <textarea
                  value={requestForm.details}
                  onChange={(e) => setRequestForm((prev) => ({ ...prev, details: e.target.value }))}
                  required
                  minLength={10}
                  maxLength={5000}
                  rows={5}
                  placeholder="Share protocol context, dosage questions, or required data points."
                  className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-(--color-primary)/40 focus:ring-2 focus:ring-(--color-primary)/10"
                />
              </div>

              {requestError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{requestError}</p>
              )}
              {requestSuccess && (
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{requestSuccess}</p>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRequestOpen(false)}
                  className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex h-10 items-center rounded-lg bg-(--color-accent) px-4 text-sm font-semibold text-white transition-all hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? "Sending..." : "Send Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
