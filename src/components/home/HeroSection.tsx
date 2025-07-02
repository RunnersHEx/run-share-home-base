
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface HeroSectionProps {
  onAuthModal: (mode: "login" | "register") => void;
}

const HeroSection = ({ onAuthModal }: HeroSectionProps) => {
  const navigate = useNavigate();

  const handleExploreRaces = () => {
    navigate('/discover');
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="/lovable-uploads/2e278f92-53fa-4ccf-b631-a95da538218b.png"
          alt="Runners en paisaje montañoso"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/20"></div>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 container mx-auto px-4 text-center text-white">
        <div className="max-w-4xl mx-auto">
          {/* Main Headline with specific colors */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="text-blue-400">Conecta</span>
            <span className="text-white"> • </span>
            <span className="text-orange-400">Viaja</span>
            <span className="text-white"> • </span>
            <span className="text-blue-400">Corre</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl mb-12 leading-relaxed text-gray-200 max-w-3xl mx-auto">
            La plataforma que conecta corredores locales con corredores que viajan a carreras, 
            ofreciendo alojamiento auténtico y experiencia compartida por gasto cero
          </p>

          {/* CTA Buttons - matching the image colors */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              onClick={() => onAuthModal("register")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 text-lg rounded-lg shadow-lg"
            >
              Únete a la Comunidad
            </Button>
            
            <Button
              size="lg"
              onClick={() => onAuthModal("login")}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 text-lg rounded-lg shadow-lg"
            >
              Iniciar Sesión
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white rounded-full mt-2"></div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
