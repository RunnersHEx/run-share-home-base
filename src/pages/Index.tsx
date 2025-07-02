
import HeroSection from "@/components/home/HeroSection";
import QuickSearchSection from "@/components/home/QuickSearchSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import FeaturedRacesSection from "@/components/home/FeaturedRacesSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import CTASection from "@/components/home/CTASection";

const Index = () => {
  console.log("Index component is rendering - using unified Layout system");

  // Función placeholder para mantener compatibilidad con los componentes hijos
  // pero que no hará nada ya que el Layout maneja toda la lógica de modal
  const placeholderAuthModal = () => {
    console.log("Index: Auth modal called - handled by Layout");
  };

  console.log("Index component rendering complete - unified system");

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroSection onAuthModal={placeholderAuthModal} />
      
      {/* Quick Search integrated into Hero */}
      <section className="relative overflow-hidden page-gradient -mt-16 pt-16">
        <div className="container mx-auto px-4 pb-16">
          <QuickSearchSection />
        </div>
      </section>

      <FeaturesSection />
      <HowItWorksSection />
      <FeaturedRacesSection />
      <CTASection onAuthModal={placeholderAuthModal} />
    </div>
  );
};

export default Index;
