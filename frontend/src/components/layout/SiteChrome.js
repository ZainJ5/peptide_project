"use client";

import { usePathname } from "next/navigation";

/**
 * Renders the public site chrome (navbar, footer, popups) around a page,
 * except on /admin where the admin panel provides its own layout.
 */
export default function SiteChrome({ header, footer, extras, children }) {
  const pathname = usePathname() || "";
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return children;

  return (
    <div className="min-h-screen bg-(--color-bg)">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-(--color-primary) focus:px-6 focus:py-3 focus:text-sm focus:font-bold focus:text-white focus:shadow-lg"
      >
        Skip to main content
      </a>
      {header}
      <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-2 pt-2 md:px-6 md:pb-2">{children}</main>
      {footer}
      {extras}
    </div>
  );
}
