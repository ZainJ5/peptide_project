"use client";

import { useState } from "react";
import { apiRequest } from "@/lib/api";

export default function NewsletterForm() {
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

  if (isSubscribed) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-medium text-emerald-300">
        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Subscribed!
      </div>
    );
  }

  return (
    <form onSubmit={handleSubscribe} className="space-y-2.5">
      <div className="relative flex items-center w-full md:w-[120%] rounded-full border border-slate-600 bg-slate-800 transition-all duration-200 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500/30">
        <input
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
  );
}
