"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function AppShell({ children }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  if (isAuthPage) {
    return <div className="min-h-screen bg-(--color-bg) px-4 py-8 md:px-6">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-(--color-bg)">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-2 pt-2 md:px-6 md:pb-2">{children}</main>
      <Footer />
    </div>
  );
}
