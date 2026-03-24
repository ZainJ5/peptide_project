import PageTransition from "@/components/shared/PageTransition";
import HeroCarousel from "@/components/home/HeroCarousel";
import AboutSection from "@/components/home/AboutSection";
import ServiceCategories from "@/components/home/ServiceCategories";
import ScheduleBanner from "@/components/home/ScheduleBanner";
import ReconstitutionCalculator from "@/components/home/ReconstitutionCalculator";
import FaqSection from "@/components/home/FaqSection";

export default function HomePage() {
  return (
    <PageTransition>
      <div className="flex flex-col gap-20 sm:gap-28">
        <HeroCarousel />
        <AboutSection />
        <ScheduleBanner />
        <ServiceCategories />
        <ReconstitutionCalculator />
        <FaqSection />
      </div>
    </PageTransition>
  );
}
