
import HeroSection from "@/components/home/HeroSection";
import QuickSearchSection from "@/components/home/QuickSearchSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import FeaturedRacesSection from "@/components/home/FeaturedRacesSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import CTASection from "@/components/home/CTASection";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Index = () => {
  
  const { user } = useAuth();

  // Handle auth modal with check for already logged in users
  const handleAuthModal = (mode: "login" | "register") => {
    // Check if user is already logged in
    if (user) {
      toast.info("Ya tienes una sesión activa. Cierra sesión primero para registrarte o iniciar sesión con otra cuenta.");
      return;
    }
    
    // Dispatch custom event for Layout to handle
    const event = new CustomEvent('openAuthModal', {
      detail: { mode }
    });
    window.dispatchEvent(event);
  };



  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroSection onAuthModal={handleAuthModal} />
      
      {/* Quick Search integrated into Hero */}
      <section className="relative page-gradient -mt-16 pt-16 pb-32">
        <div className="container mx-auto px-4">
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
