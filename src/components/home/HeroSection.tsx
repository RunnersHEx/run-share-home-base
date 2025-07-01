
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Trophy, Users } from "lucide-react";

interface HeroSectionProps {
  onAuthModal: (mode: "login" | "register") => void;
}

const HeroSection = ({ onAuthModal }: HeroSectionProps) => {
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
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-8 border border-white/20">
            <Trophy className="h-4 w-4 mr-2 text-runner-orange-500" />
            Conecta • Corre • Comparte
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Corre el Mundo,
            <br />
            <span className="text-runner-orange-500">Vive como Local</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl mb-12 leading-relaxed text-gray-200 max-w-3xl mx-auto">
            Conecta con corredores locales, descubre carreras auténticas, 
            y experimenta destinos como nunca antes
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button
              size="lg"
              onClick={() => onAuthModal("register")}
              className="bg-runner-orange-500 hover:bg-runner-orange-600 text-white font-semibold px-8 py-4 text-lg rounded-full shadow-2xl transform hover:scale-105 transition-all duration-200"
            >
              Soy Host Runner
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              onClick={() => onAuthModal("register")}
              className="border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm font-semibold px-8 py-4 text-lg rounded-full"
            >
              Busco Carreras
              <MapPin className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {/* Social Proof */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-gray-300">
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-runner-orange-500" />
              <span>+1,000 runners conectados</span>
            </div>
            <div className="flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-runner-orange-500" />
              <span>+500 carreras descubiertas</span>
            </div>
            <div className="flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-runner-orange-500" />
              <span>+50 ciudades disponibles</span>
            </div>
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
