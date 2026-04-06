"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, Suspense } from "react";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

function trackPageView(url) {
  if (GA_ID && typeof window.gtag === "function") {
    window.gtag("event", "page_view", { page_path: url });
  }

  if (PIXEL_ID && typeof window.fbq === "function") {
    window.fbq("track", "PageView");
  }
}

function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip the first render — GA auto-tracks the initial page view
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const url = pathname + (searchParams.toString() ? `?${searchParams}` : "");
    trackPageView(url);
  }, [pathname, searchParams]);

  return null;
}

export default function Analytics() {
  return (
    <Suspense fallback={null}>
      <AnalyticsTracker />
    </Suspense>
  );
}