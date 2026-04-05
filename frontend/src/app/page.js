import dynamic from "next/dynamic";
import HeroCarousel from "@/components/home/HeroCarousel";
import MobileHomeSearch from "@/components/home/MobileHomeSearch";
import AboutSection from "@/components/home/AboutSection";

const ServiceCategories = dynamic(() => import("@/components/home/ServiceCategories"));
const ScheduleBanner = dynamic(() => import("@/components/home/ScheduleBanner"));
const ReconstitutionCalculator = dynamic(() => import("@/components/home/ReconstitutionCalculator"));
const FaqSection = dynamic(() => import("@/components/home/FaqSection"));

export default function HomePage() {
  return (
    <div className="flex flex-col gap-10 sm:gap-28">
      <div className="flex flex-col">
        <HeroCarousel />
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
