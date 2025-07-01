
import { useState } from "react";
import AuthModalIntegrated from "@/components/auth/AuthModalIntegrated";
import MainHeader from "@/components/layout/MainHeader";
import HeroSection from "@/components/home/HeroSection";
import QuickSearchSection from "@/components/home/QuickSearchSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import FeaturedRacesSection from "@/components/home/FeaturedRacesSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import CTASection from "@/components/home/CTASection";

const Index = () => {
  console.log("Index component is rendering");
  
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");

  const openAuthModal = (mode: "login" | "register") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  console.log("Index component rendering complete");

  return (
    <div className="min-h-screen">
      {/* Header original para la homepage */}
      <MainHeader onAuthModal={openAuthModal} />
      
      {/* Hero Section */}
      <HeroSection onAuthModal={openAuthModal} />
      
      {/* Quick Search integrated into Hero */}
      <section className="relative overflow-hidden page-gradient -mt-16 pt-16">
        <div className="container mx-auto px-4 pb-16">
          <QuickSearchSection />
        </div>
      </section>

      <FeaturesSection />
      <HowItWorksSection />
      <FeaturedRacesSection />
      <CTASection onAuthModal={openAuthModal} />

      {/* Modal de autenticación independiente para la homepage */}
      <AuthModalIntegrated 
        isOpen={authModalOpen}
        onClose={closeAuthModal}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </div>
  );
};

export default Index;
