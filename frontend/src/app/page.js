import dynamic from "next/dynamic";
import HeroCarousel from "@/components/home/HeroCarousel";
import AboutSection from "@/components/home/AboutSection";

const MobileHomeSearch = dynamic(() => import("@/components/home/MobileHomeSearch"));
const ServiceCategories = dynamic(() => import("@/components/home/ServiceCategories"));
const ScheduleBanner = dynamic(() => import("@/components/home/ScheduleBanner"));
const ReconstitutionCalculator = dynamic(() => import("@/components/home/ReconstitutionCalculator"));
const FaqSection = dynamic(() => import("@/components/home/FaqSection"));

export const metadata = {
  title: "My Peptide Dosages – Free Peptide Dosage Calculator & Protocol Guide",
  description:
    "My Peptide Dosages – calculate accurate peptide dosages, reconstitution volumes, and build research-backed dosing schedules for BPC-157, Semaglutide, TB-500, and 100+ peptides. Free calculator and schedule tools for researchers.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "My Peptide Dosages",
    title: "My Peptide Dosages – Free Peptide Dosage Calculator & Protocol Guide",
    description:
      "My Peptide Dosages – calculate accurate peptide dosages, reconstitution volumes, and build research-backed dosing schedules for 100+ peptides.",
    url: "https://mypeptidedosages.com",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "My Peptide Dosages – Free Peptide Dosage Calculator & Protocol Guide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "My Peptide Dosages – Free Peptide Dosage Calculator & Protocol Guide",
    description:
      "My Peptide Dosages – calculate accurate peptide dosages, reconstitution volumes, and build research-backed dosing schedules for 100+ peptides.",
    images: ["/opengraph-image"],
  },
};

export default function HomePage() {
  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": "https://mypeptidedosages.com/#webpage",
    url: "https://mypeptidedosages.com",
    name: "My Peptide Dosages – Free Peptide Dosage Calculator & Protocol Guide",
    description:
      "My Peptide Dosages is a free peptide dosage calculator with reconstitution guides and research-backed protocol schedules for BPC-157, Semaglutide, TB-500, and 100+ peptides.",
    isPartOf: { "@id": "https://mypeptidedosages.com/#website" },
    about: { "@id": "https://mypeptidedosages.com/#organization" },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          item: { "@id": "https://mypeptidedosages.com", name: "MyPeptideDosages" },
        },
      ],
    },
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", "#about"],
    },
  };

  return (
    <div className="flex flex-col gap-10 sm:gap-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
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
          My Peptide Dosages – Free Peptide Dosage Calculator, Reconstitution Guides &amp; Protocol Schedules for 100+ Peptides
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
