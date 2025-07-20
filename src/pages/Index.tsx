
import HeroSection from "@/components/home/HeroSection";
import QuickSearchSection from "@/components/home/QuickSearchSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import FeaturedRacesSection from "@/components/home/FeaturedRacesSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import CTASection from "@/components/home/CTASection";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  
  const { user } = useAuth();

  // Esta función será pasada a los componentes pero la gestión real del modal
  // está en Layout.tsx que detecta automáticamente cuando se debe abrir
  const handleAuthModal = (mode: "login" | "register") => {
    // El Layout maneja automáticamente la apertura del modal
    // mediante los eventos de los botones
  };



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
