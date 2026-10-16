import dynamic from "next/dynamic";
import Footer from "@/components/layout/Footer";
import AppDownloadPopup from "@/components/layout/AppDownloadPopup";
import SiteChrome from "@/components/layout/SiteChrome";

const Navbar = dynamic(() => import("@/components/layout/Navbar"));

export default function AppShell({ children }) {
  return (
    <SiteChrome header={<Navbar />} footer={<Footer />} extras={<AppDownloadPopup />}>
      {children}
    </SiteChrome>
  );
}
