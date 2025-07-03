
import HeroSection from "@/components/home/HeroSection";
import QuickSearchSection from "@/components/home/QuickSearchSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import FeaturedRacesSection from "@/components/home/FeaturedRacesSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import CTASection from "@/components/home/CTASection";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  console.log("Index component is rendering - using unified Layout system");
  
  const { user } = useAuth();

  // Esta función dispara eventos personalizados que el Layout captura
  const handleAuthModal = (mode: "login" | "register") => {
    console.log("Index: Auth modal called with mode:", mode);
    // Disparar evento personalizado que Layout capturará
    window.dispatchEvent(new CustomEvent('openAuthModal', { detail: { mode } }));
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
      <FeaturedRacesSection onAuthModal={handleAuthModal} />
      <CTASection onAuthModal={handleAuthModal} />
    </div>
  );
};

export default Index;
