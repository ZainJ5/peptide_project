"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MOBILE_NAV_ITEMS } from "@/lib/config";

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-3 py-2 backdrop-blur md:hidden">
      <div className="grid grid-cols-4 gap-2">
        {MOBILE_NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-lg px-2 py-2 text-center text-xs font-semibold min-h-[44px] flex items-center justify-center ${active ? "bg-slate-100 text-(--color-primary)" : "text-slate-500"}`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
