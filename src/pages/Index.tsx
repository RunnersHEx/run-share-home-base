
import HeroSection from "@/components/home/HeroSection";
import QuickSearchSection from "@/components/home/QuickSearchSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import FeaturedRacesSection from "@/components/home/FeaturedRacesSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import CTASection from "@/components/home/CTASection";

const Index = () => {
  console.log("Index component is rendering - using unified Layout system");

  // The auth modal functionality is now handled by the Layout component
  // No need to manage it here since Layout has its own auth modal state
  const handleAuthModal = (mode: "login" | "register") => {
    console.log("Index: Auth modal called with mode:", mode);
    // This is now handled by the Layout component automatically
  };

  console.log("Index component rendering complete - unified system");

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroSection onAuthModal={handleAuthModal} />
      
      {/* Quick Search integrated into Hero */}
      <section className="relative overflow-hidden page-gradient -mt-16 pt-16">
        <div className="container mx-auto px-4 pb-16">
          <QuickSearchSection />
        </div>
      </section>

      <FeaturesSection />
      <HowItWorksSection />
      <FeaturedRacesSection />
      <CTASection onAuthModal={handleAuthModal} />
    </div>
  );
};

export default Index;
