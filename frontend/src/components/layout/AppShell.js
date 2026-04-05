"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-(--color-bg)">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-(--color-primary) focus:px-6 focus:py-3 focus:text-sm focus:font-bold focus:text-white focus:shadow-lg"
      >
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-2 pt-2 md:px-6 md:pb-2">{children}</main>
      <Footer />
    </div>
  );
}
