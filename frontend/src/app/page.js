import dynamic from "next/dynamic";
import HeroCarousel from "@/components/home/HeroCarousel";
import MobileHomeSearch from "@/components/home/MobileHomeSearch";
import AboutSection from "@/components/home/AboutSection";

const ServiceCategories = dynamic(() => import("@/components/home/ServiceCategories"));
const ScheduleBanner = dynamic(() => import("@/components/home/ScheduleBanner"));
const ReconstitutionCalculator = dynamic(() => import("@/components/home/ReconstitutionCalculator"));
const FaqSection = dynamic(() => import("@/components/home/FaqSection"));

export const metadata = {
  title: "MyPeptideDosages – Free Peptide Dosage Calculator & Protocol Guide",
  description:
    "Calculate accurate peptide dosages, reconstitution volumes, and build research-backed dosing schedules for BPC-157, Semaglutide, TB-500, and 100+ peptides. Free calculator and schedule tools for researchers.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "MyPeptideDosages",
    title: "MyPeptideDosages – Free Peptide Dosage Calculator & Protocol Guide",
    description:
      "Calculate accurate peptide dosages, reconstitution volumes, and build research-backed dosing schedules for 100+ peptides.",
    url: "https://www.mypeptidedosages.com",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "MyPeptideDosages – Free Peptide Dosage Calculator & Protocol Guide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MyPeptideDosages – Free Peptide Dosage Calculator & Protocol Guide",
    description:
      "Calculate accurate peptide dosages, reconstitution volumes, and build research-backed dosing schedules for 100+ peptides.",
    images: ["/opengraph-image"],
  },
};

export default function HomePage() {
  return (
    <div className="flex flex-col gap-10 sm:gap-28">
      <div className="flex flex-col">
        <HeroCarousel />
        <h1 className="sr-only">
          Free Peptide Dosage Calculator – Reconstitution Guides &amp; Protocol Schedules for 100+ Peptides
        </h1>
        <MobileHomeSearch />
      </div>
      <AboutSection />
      <ScheduleBanner />
      <ServiceCategories />
      <ReconstitutionCalculator />
      <FaqSection />
    </div>
  );
}
