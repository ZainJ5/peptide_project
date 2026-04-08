import dynamic from "next/dynamic";
import HeroCarousel from "@/components/home/HeroCarousel";
import AboutSection from "@/components/home/AboutSection";

const MobileHomeSearch = dynamic(() => import("@/components/home/MobileHomeSearch"));
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
    url: "https://mypeptidedosages.com",
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
      {/* Preload the LCP hero image to reduce resource load delay */}
      <link
        rel="preload"
        as="image"
        href="/_next/image?url=%2Fheader%2Fheader-1-v2.png&w=640&q=75"
        imageSrcSet="/_next/image?url=%2Fheader%2Fheader-1-v2.png&w=640&q=75 640w, /_next/image?url=%2Fheader%2Fheader-1-v2.png&w=750&q=75 750w, /_next/image?url=%2Fheader%2Fheader-1-v2.png&w=828&q=75 828w, /_next/image?url=%2Fheader%2Fheader-1-v2.png&w=1080&q=75 1080w, /_next/image?url=%2Fheader%2Fheader-1-v2.png&w=1200&q=75 1200w, /_next/image?url=%2Fheader%2Fheader-1-v2.png&w=1920&q=75 1920w"
        imageSizes="(max-width: 640px) 100vw, (max-width: 1280px) 100vw, 1280px"
      />
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
